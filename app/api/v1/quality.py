from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
import structlog
from sqlalchemy import func, distinct, or_ # Added imports for advanced dashboard metrics
from sqlalchemy.orm import joinedload
# Assuming these imports point to your SQLAlchemy models
from ...core.database import get_db
from ...core.security import get_current_user
from ...models.quality import QualityAlert, QualityRule, QualityResult, QualityDimension, QualityRuleTypeEnum, QualityStatusEnum, SeverityLevelEnum # All required models
from ...models.table import Domain, Table
from ...schemas.common import SuccessResponse

logger = structlog.get_logger()
router = APIRouter()


# ----------------------------------------------------------------------
# A. Helper Function: Dimension Mapping (Used by /dashboard_v2)
# ----------------------------------------------------------------------

def get_dimension_name_from_rule_type(rule_type: QualityRuleTypeEnum) -> str:
    """Maps QualityRuleTypeEnum to QualityDimension name (Implementing your final logic)."""
    type_map = {
        # Completeness (NULL_CHECK / Missing Data)
        QualityRuleTypeEnum.NULL_CHECK: "Completeness",
        QualityRuleTypeEnum.COMPLETENESS: "Completeness",
        
        # Uniqueness (Duplicate Checks)
        QualityRuleTypeEnum.UNIQUE_CHECK: "Uniqueness",
        
        # Validity (Format, Range, Domain Checks)
        QualityRuleTypeEnum.FORMAT_CHECK: "Validity",
        QualityRuleTypeEnum.RANGE_CHECK: "Validity",
        
        # Integrity (Referential Checks / Relationships)
        QualityRuleTypeEnum.REFERENCE_CHECK: "Integrity",
        
        # Consistency (Intra-Record/Temporal Uniformity)
        QualityRuleTypeEnum.CONSISTENCY: "Consistency",
        
        # Timeliness (Freshness / Latency)
        QualityRuleTypeEnum.FRESHNESS: "Timeliness",
        
        # Accuracy (Complex Business Rules / Plausibility)
        QualityRuleTypeEnum.CUSTOM_SQL: "Accuracy",
        QualityRuleTypeEnum.ROW_COUNT: "Accuracy",
    }
    # Fallback to Accuracy
    return type_map.get(rule_type, "Accuracy")


# Add this function somewhere accessible in quality.py (e.g., above the router definitions)

def get_tables_with_issues_ids(db: Session):
    """
    Finds the latest status for all active rules and returns the set of 
    table_ids that have a FAILED or WARNING status.
    """
    tables_with_issues = set()
    tables_total_covered = set()
    
    # Iterate over rules to find the latest result
    for rule in db.query(QualityRule).filter(QualityRule.is_active == True).all():
        tables_total_covered.add(rule.table_id) 
        
        latest_result = db.query(QualityResult).filter(
            QualityResult.rule_id == rule.id
        ).order_by(QualityResult.started_at.desc()).first()
        
        if latest_result:
            status_value = latest_result.status.value
            
            # Use enum values for robust comparison: FAILED or WARNING means an issue
            if status_value == QualityStatusEnum.FAILED or status_value == QualityStatusEnum.WARNING:
                tables_with_issues.add(rule.table_id)
                
    return tables_with_issues, tables_total_covered
# ----------------------------------------------------------------------
# 1. Endpoint: Get Rules for a specific Table (/table/{table_id}/rules)
# ----------------------------------------------------------------------

@router.get("/table/{table_id}/rules")
async def get_table_quality_rules(
    table_id: int,
    db: Session = Depends(get_db)
):
    """Get quality rules for a table."""
    try:
        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Get quality rules and their latest results
        rules = db.query(QualityRule).filter(
            QualityRule.table_id == table_id,
            QualityRule.is_active == True
        ).all()
        
        rules_data = []
        for rule in rules:
            # Get latest result
            latest_result = db.query(QualityResult).filter(
                QualityResult.rule_id == rule.id
            ).order_by(QualityResult.started_at.desc()).first()
            
            rule_data = {
                "id": rule.id,
                "name": rule.name,
                "description": rule.description,
                "rule_type": rule.rule_type.value,
                "severity": rule.severity.value,
                "is_blocking": rule.is_blocking,
                "last_check_at": rule.last_check_at,
                "latest_result": {
                    "status": latest_result.status.value if latest_result else None,
                    "score": latest_result.score if latest_result else None,
                    "started_at": latest_result.started_at if latest_result else None
                } if latest_result else None
            }
            rules_data.append(rule_data)
        
        return {
            "table_id": table_id,
            "table_name": table.name,
            "rules": rules_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get quality rules", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quality rules"
        )


# ----------------------------------------------------------------------
# 2. Endpoint: Simple Dashboard (Enhanced with Table/Issue Metrics)
# ----------------------------------------------------------------------

@router.get("/dashboard")
async def get_quality_dashboard(
    db: Session = Depends(get_db)
):
    """
    Get quality dashboard metrics, including overall score, critical issues,
    and table status counts. (Simple, count-based metrics).
    """
    try:
        tables_with_issues_ids, tables_total_covered_ids = get_tables_with_issues_ids(db)
        
        tables_passing_all_checks_ids = tables_total_covered_ids - tables_with_issues_ids
        # --- Part 1: Overall Rule Status Counts and Table Issue Tracking ---
        total_rules = db.query(QualityRule).filter(QualityRule.is_active == True).count()
        
        # passing_rules = 0
        # failing_rules = 0
        # warning_rules = 0
        failing_rules = db.query(QualityResult).filter(QualityResult.rule_id.in_(
            db.query(QualityRule.id).filter(QualityRule.table_id.in_(tables_with_issues_ids))
        ), QualityResult.status == QualityStatusEnum.FAILED).count()
        warning_rules = db.query(QualityResult).filter(QualityResult.rule_id.in_(
            db.query(QualityRule.id).filter(QualityRule.table_id.in_(tables_with_issues_ids))
        ), QualityResult.status == QualityStatusEnum.WARNING).count()
        passing_rules = total_rules - failing_rules - warning_rules

        total_tables = db.query(Table).count()
        inactive_tables = db.query(Table).filter(Table.is_active == False).count()
        active_tables = total_tables - inactive_tables

        critical_alerts = db.query(QualityAlert).filter(
            QualityAlert.severity == SeverityLevelEnum.CRITICAL,
            QualityAlert.is_resolved == False
        ).count()
        
        # --- Part 3: Return Metrics ---
        
        total_with_results = passing_rules + failing_rules + warning_rules
        quality_score = (passing_rules / total_with_results * 100) if total_with_results > 0 else 0
        
        return {
            "total_rules": total_rules,
            "passing_rules": passing_rules,
            "failing_rules": failing_rules,
            "warning_rules": warning_rules,
            "overall_quality_score": round(quality_score, 1),
            "rules_without_results": total_rules - total_with_results,
            
            # The count is derived from the shared helper function
            "tables_with_issues": {
                "count": len(tables_with_issues_ids),
                "total_active_tables": active_tables,
            },
            "critical_unresolved_alerts": critical_alerts,
            "checks_passed_tables": {
                "count": len(tables_passing_all_checks_ids),
                "total_active_tables": active_tables,
            },
            
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')     
        }
        
    except Exception as e:
        logger.error("Failed to get quality dashboard", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quality dashboard"
        )
        
        # tables_with_issues = set()
        # tables_total_covered = set() # Tables that have at least one active rule
        
        # # Iterate over rules to find latest status and track tables
        # for rule in db.query(QualityRule).filter(QualityRule.is_active == True).all():
        #     tables_total_covered.add(rule.table_id) 
            
        #     latest_result = db.query(QualityResult).filter(
        #         QualityResult.rule_id == rule.id
        #     ).order_by(QualityResult.started_at.desc()).first()
            
        #     if latest_result:
        #         status_value = latest_result.status.value
                
        #         if status_value == QualityStatusEnum.PASSED:
        #             passing_rules += 1
        #         elif status_value == QualityStatusEnum.FAILED:
        #             failing_rules += 1
        #             tables_with_issues.add(rule.table_id)
        #         elif status_value == QualityStatusEnum.WARNING:
        #             warning_rules += 1
        #             tables_with_issues.add(rule.table_id)
            
        # # Determine tables where ALL checks passed
        # tables_passing_all_checks = tables_total_covered - tables_with_issues
        
        # # --- Part 2: Global Table and Alert Counts (Efficient Queries) ---
        
        # # Total Tables (for context)
        # total_tables = db.query(Table).count()
        # inactive_tables = db.query(Table).filter(Table.is_active == False).count()
        # active_tables = total_tables - inactive_tables

        # # Critical Issues (Unresolved CRITICAL Quality Alerts)
        # critical_alerts = db.query(QualityAlert).filter(
        #     QualityAlert.severity == SeverityLevelEnum.CRITICAL,
        #     QualityAlert.is_resolved == False
        # ).count()
        
        # # --- Part 3: Return Metrics ---
        
        # total_with_results = passing_rules + failing_rules + warning_rules
        # quality_score = (passing_rules / total_with_results * 100) if total_with_results > 0 else 0
        
        # return {
        #     # Existing Metrics (Rule Status)
        #     "total_rules": total_rules,
        #     "passing_rules": passing_rules,
        #     "failing_rules": failing_rules,
        #     "warning_rules": warning_rules,
        #     "overall_quality_score": round(quality_score, 1),
        #     "rules_without_results": total_rules - total_with_results,
            
        #     # NEW Metrics (Requested Table/Issue Counts)
        #     "tables_with_issues": {
        #         "count": len(tables_with_issues),
        #         "total_active_tables": active_tables, # Context for the count
        #     },
        #     "critical_unresolved_alerts": critical_alerts,
        #     "checks_passed_tables": {
        #         "count": len(tables_passing_all_checks),
        #         "total_active_tables": active_tables, # Context for the count
        #     },
            
        #     "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')     
        # }
        
    # except Exception as e:
    #     logger.error("Failed to get quality dashboard", error=str(e), exc_info=True)
    #     raise HTTPException(
    #         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #         detail="Failed to get quality dashboard"
    #     )


# Add this new API endpoint to your router definitions in quality.py
# Add this new API endpoint to your router definitions in quality.py

@router.get("/action/tables_needing_action")
async def get_tables_needing_action(
    db: Session = Depends(get_db)
):
    """
    Lists the tables identified by the /dashboard API as having issues, 
    synchronizing the list with the dashboard's 'tables_with_issues' count.
    """
    try:
        # Step 1: Use the identical helper logic to get the exact set of table IDs
        tables_with_issues_ids, _ = get_tables_with_issues_ids(db)
        
        # Step 2: Fetch the names and details for those specific table IDs
        table_details = db.query(
            Table.id, 
            Table.name, 
            Table.domain_id
        ).filter(
            Table.id.in_(tables_with_issues_ids)
        ).all()
        
        return {
            "count": len(table_details),
            # Return the list of tables needing action
            "tables": [{"id": t.id, "name": t.name, "domain_id": t.domain_id} for t in table_details]
        }
    except Exception as e:
        logger.error("Failed to get tables needing action", error=str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list tables.")
    
    
# ----------------------------------------------------------------------
# 3. Endpoint: Enhanced Weighted Dashboard (/dashboard_v2)
# ----------------------------------------------------------------------

@router.get("/dashboard_v2")
async def get_quality_dashboard_enhanced(
    db: Session = Depends(get_db)
):
    """Get enhanced quality dashboard metrics including dimension scores via weighted aggregation."""
    try:
        # 1. Fetch data and initialize structures
        active_rules = db.query(QualityRule).filter(QualityRule.is_active == True).all()
        dimensions = db.query(QualityDimension).filter(QualityDimension.is_active == True).all()

        dimension_metrics = {d.name: {"total_weight": 0.0, "total_weighted_score": 0.0, "weight": d.weight, "rule_count": 0} for d in dimensions}
        passing_rules, failing_rules, warning_rules = 0, 0, 0
        
        # Pre-calculate rule counts per dimension (needed for the weight distribution formula)
        rule_counts_by_dimension = {}
        for rule in active_rules:
             dim_name = get_dimension_name_from_rule_type(rule.rule_type)
             rule_counts_by_dimension[dim_name] = rule_counts_by_dimension.get(dim_name, 0) + 1
        
        # 2. Iterate through rules, get latest result, and calculate weighted metrics
        for rule in active_rules:
            latest_result = db.query(QualityResult).filter(
                QualityResult.rule_id == rule.id
            ).order_by(QualityResult.started_at.desc()).first()
            
            dimension_name = get_dimension_name_from_rule_type(rule.rule_type)
            current_dimension = next((d for d in dimensions if d.name == dimension_name), None)

            if latest_result and current_dimension:
                # Rule Score: Treat non-passed statuses as 0.0 contribution to the dimension's score
                rule_score = latest_result.score if latest_result.status.value == "passed" else 0.0
                
                # Rule Contribution Weight: Distribute dimension's weight across its rules
                rule_count_for_dim = rule_counts_by_dimension.get(dimension_name, 1)
                rule_weight = float(current_dimension.weight) / rule_count_for_dim
                
                # Aggregate Metrics
                dimension_metrics[dimension_name]["total_weighted_score"] += rule_score * rule_weight
                dimension_metrics[dimension_name]["total_weight"] += rule_weight
                dimension_metrics[dimension_name]["rule_count"] += 1
                
                # Update status counters
                if latest_result.status.value == "passed":
                    passing_rules += 1
                elif latest_result.status.value == "failed":
                    failing_rules += 1
                elif latest_result.status.value == "warning":
                    warning_rules += 1

        # 3. Finalize dimension scores (Calculate Weighted Average)
        dimension_scores = []
        total_score_sum = 0
        total_weight_sum = 0
        
        for name, metrics in dimension_metrics.items():
            # Calculate final dimension score (0-100%)
            final_score = (metrics["total_weighted_score"] / metrics["total_weight"]) * 100 if metrics["total_weight"] > 0 else 0
            
            # Use the original dimension weight for overall score calculation
            total_score_sum += final_score * float(metrics['weight'])
            total_weight_sum += float(metrics['weight'])
            
            dimension_scores.append({
                "name": name,
                "score": round(final_score, 1),
                "weight": float(metrics['weight']),
                "rule_count": metrics["rule_count"],
            })
            
        # 4. Calculate overall quality score (weighted average of dimension scores)
        overall_score = (total_score_sum / total_weight_sum) if total_weight_sum > 0 else 0


        # 5. Return Enhanced Dashboard Data
        total_rules = len(active_rules)
        total_with_results = passing_rules + failing_rules + warning_rules
        
        return {
            "total_rules": total_rules,
            "passing_rules": passing_rules,
            "failing_rules": failing_rules,
            "warning_rules": warning_rules,
            "overall_quality_score": round(overall_score, 1),
            "rules_without_results": total_rules - total_with_results,
            # Key difference: detailed dimension breakdown for the UI scorecard
            "dimension_scores": dimension_scores,
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        }
        
    except Exception as e:
        logger.error("Failed to get enhanced quality dashboard", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get enhanced quality dashboard"
        )
    
@router.get("/recent_issues")
async def get_recent_quality_alerts(
    db: Session = Depends(get_db),
    limit: int = 10  # Parameter to control how many recent alerts to fetch
):
    """
    List the most recent quality alerts, including resolution status,
    and linking them to the associated rule and table.
    """
    try:
        # Query QualityAlerts, joining with QualityRule and Table to get names
        alerts_data = db.query(
            QualityAlert,
            QualityRule.name.label("rule_name"),
            Table.name.label("table_name")
        ).join(
            QualityRule, QualityAlert.rule_id == QualityRule.id
        ).join(
            Table, QualityRule.table_id == Table.id
        ).order_by(
            QualityAlert.created_at.desc()  # Sort by most recent creation date
        ).limit(limit).all()

        # Format the results for the API response
        recent_issues = []
        for alert, rule_name, table_name in alerts_data:
            recent_issues.append({
                "alert_id": alert.id,
                "rule_name": rule_name,
                "table_name": table_name,
                "alert_type": alert.alert_type,
                "severity": alert.severity.value,
                "message": alert.message,
                "created_at": alert.created_at,
                "is_resolved": alert.is_resolved,      # <--- Key Metric
                "resolved_at": alert.resolved_at,
            })
            
        return {
            "count": len(recent_issues),
            "limit": limit,
            "issues": recent_issues
        }

    except Exception as e:
        logger.error("Failed to fetch recent quality alerts", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recent quality issues."
        )
    

# In your existing quality.py file (Add this after your other router.get definitions)

# NOTE: This API reuses the logic from /dashboard_v2 but groups by table.

@router.get("/top_tables_by_quality")
async def get_top_tables_by_quality(
    db: Session = Depends(get_db),
    limit: int = 5  # Parameter to control the number of tables returned
):
    """
    Calculates the aggregated quality score for every monitored table and returns the top N.
    """
    try:
        # 1. Fetch all active rules, dimensions, and latest results
        active_rules = db.query(QualityRule).filter(QualityRule.is_active == True).all()
        dimensions = db.query(QualityDimension).filter(QualityDimension.is_active == True).all()
        
        # Group dimensions by name for easy weight lookup
        dimension_weights = {d.name: float(d.weight) for d in dimensions}

        # Initialize metrics grouped by table ID
        table_metrics = {}
        
        # Pre-calculate Rule Counts by Dimension (to get Rule Weight, as used in /dashboard_v2)
        rule_counts_by_dimension = {}
        for rule in active_rules:
             dim_name = get_dimension_name_from_rule_type(rule.rule_type)
             rule_counts_by_dimension[dim_name] = rule_counts_by_dimension.get(dim_name, 0) + 1
        
        # 2. Iterate and Aggregate Scores by Table
        for rule in active_rules:
            table_id = rule.table_id
            
            # Initialize table structure if not present
            if table_id not in table_metrics:
                table_metrics[table_id] = {
                    "total_weighted_score": 0.0, 
                    "total_weight": 0.0, 
                    "table_name": db.query(Table.name).filter(Table.id == table_id).scalar(),
                    "rule_count": 0
                }
            
            latest_result = db.query(QualityResult).filter(
                QualityResult.rule_id == rule.id
            ).order_by(QualityResult.started_at.desc()).first()
            
            dimension_name = get_dimension_name_from_rule_type(rule.rule_type)
            dim_weight = dimension_weights.get(dimension_name, 0.0)

            if latest_result and dim_weight > 0:
                # Rule Score: 0.0 if failed/warned, actual score if passed
                rule_score = latest_result.score if latest_result.status.value == "passed" else 0.0
                
                # Rule Contribution Weight: Distribute dimension's weight across its rules
                rule_count_for_dim = rule_counts_by_dimension.get(dimension_name, 1)
                
                # IMPORTANT: Use the distributed weight as the score multiplier
                rule_contribution_weight = dim_weight / rule_count_for_dim
                
                # Aggregate to Table Metrics
                table_metrics[table_id]["total_weighted_score"] += rule_score * rule_contribution_weight
                table_metrics[table_id]["total_weight"] += rule_contribution_weight
                table_metrics[table_id]["rule_count"] += 1

        # 3. Finalize and Sort Scores
        final_scores = []
        for table_id, metrics in table_metrics.items():
            if metrics["total_weight"] > 0:
                overall_score = (metrics["total_weighted_score"] / metrics["total_weight"]) * 100
                final_scores.append({
                    "table_id": table_id,
                    "table_name": metrics["table_name"],
                    "quality_score": round(overall_score, 1),
                    "rules_covered": metrics["rule_count"],
                })

        # Sort by score descending and apply limit
        sorted_tables = sorted(final_scores, key=lambda x: x["quality_score"], reverse=True)
        
        return {
            "count": len(sorted_tables),
            "top_tables": sorted_tables[:limit]
        }

    except Exception as e:
        logger.error("Failed to fetch top quality tables", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve top quality tables."
        )
    
# In your quality.py file

@router.get("/action/generate_issue_report", response_class=Response)
async def generate_issue_report(
    db: Session = Depends(get_db)
):
    """Generates a CSV report containing details of all failing/warning quality rules."""
    try:
        # Find all rules with a recent non-passing status
        non_passing_results = db.query(QualityResult.rule_id).filter(
            QualityResult.status != QualityStatusEnum.PASSED
        ).distinct().subquery()
        
        # Join rules with the affected table and filter by the non-passing results
        rules_with_issues = db.query(
            QualityRule, Table.name.label("table_name")
        ).join(
            Table, QualityRule.table_id == Table.id
        ).filter(
            QualityRule.id.in_(non_passing_results)
        ).all()
        
        # 1. Build the CSV content string (simple example)
        header = "Rule ID,Table Name,Severity,Rule Type,Description\n"
        rows = [header]
        
        for rule, table_name in rules_with_issues:
            row = f"{rule.id},{table_name},{rule.severity.value},{rule.rule_type.value},{rule.description.replace(',', ';')}\n"
            rows.append(row)
        
        csv_content = "".join(rows)

        # 2. Return the CSV content with correct headers for download
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=quality_report_{datetime.now().strftime('%Y%m%d')}.csv"
            }
        )
    except Exception as e:
        logger.error("Failed to generate quality report", error=str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Report generation failed.")
    



@router.get("/action/manage_rules")
async def get_all_quality_rules_summary(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Lists all active quality rules with basic details."""
    try:
        rules_summary = db.query(
            QualityRule.id,
            QualityRule.name,
            QualityRule.severity,
            Table.name.label("table_name")
        ).join(
            Table, QualityRule.table_id == Table.id
        ).filter(
            QualityRule.is_active == True
        ).offset(skip).limit(limit).all()

        return {
            "count": db.query(QualityRule).filter(QualityRule.is_active == True).count(),
            "rules": [
                {
                    "id": rule.id,
                    "name": rule.name,
                    "severity": rule.severity.value,
                    "table_name": rule.table_name
                } for rule in rules_summary
            ]
        }
    except Exception as e:
        logger.error("Failed to list all rules", error=str(e), exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list quality rules.")
    

# In your quality.py file

@router.post("/action/run_full_scan")
async def trigger_full_quality_scan(
    # NOTE: You might want to add Depends(get_current_user) here to authenticate
    # who is starting the scan.
):
    """Triggers a full quality scan asynchronously across all active rules."""
    
    # NOTE: In a real system, you would push a message to a queue here:
    # background_task_queue.send_task('tasks.run_quality_sweep', args=['full'])
    
    logger.info("Manual full quality scan initiated.")
    
    return SuccessResponse(
        message="Full quality scan initiated successfully. Results will appear in the dashboard shortly.",
        data={"scan_triggered_at": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')}
    )