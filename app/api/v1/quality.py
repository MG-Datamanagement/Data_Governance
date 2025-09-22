from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import structlog

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.quality import QualityRule, QualityResult
from ...models.table import Table
from ...schemas.common import SuccessResponse

logger = structlog.get_logger()
router = APIRouter()


@router.get("/table/{table_id}/rules")
async def get_table_quality_rules(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
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
        
        # Get quality rules
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


@router.get("/dashboard")
async def get_quality_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get quality dashboard metrics."""
    try:
        # Count total rules
        total_rules = db.query(QualityRule).filter(QualityRule.is_active == True).count()
        
        # Count rules by status from latest results
        passing_rules = 0
        failing_rules = 0
        warning_rules = 0
        
        for rule in db.query(QualityRule).filter(QualityRule.is_active == True).all():
            latest_result = db.query(QualityResult).filter(
                QualityResult.rule_id == rule.id
            ).order_by(QualityResult.started_at.desc()).first()
            
            if latest_result:
                if latest_result.status.value == "passed":
                    passing_rules += 1
                elif latest_result.status.value == "failed":
                    failing_rules += 1
                elif latest_result.status.value == "warning":
                    warning_rules += 1
        
        # Calculate overall quality score
        total_with_results = passing_rules + failing_rules + warning_rules
        quality_score = (passing_rules / total_with_results * 100) if total_with_results > 0 else 0
        
        return {
            "total_rules": total_rules,
            "passing_rules": passing_rules,
            "failing_rules": failing_rules,
            "warning_rules": warning_rules,
            "overall_quality_score": round(quality_score, 1),
            "rules_without_results": total_rules - total_with_results
        }
        
    except Exception as e:
        logger.error("Failed to get quality dashboard", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get quality dashboard"
        )