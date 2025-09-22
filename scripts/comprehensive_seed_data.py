#!/usr/bin/env python3
"""
Comprehensive seed data script for MetaPortal with all tables populated.
This extends the existing sample data with additional tables and lineage data.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from datetime import datetime, timedelta
import random
import uuid
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

from app.models import *
from app.core.database import Base
from app.core.security import SecurityManager
from app.core.config import settings

def create_comprehensive_seed_data():
    """Generate comprehensive seed data for all tables."""
    
    # Database connection
    engine = create_engine(os.getenv("DATABASE_URL", settings.database_url))
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("🚀 Creating comprehensive seed data for MetaPortal...")
        
        # Get existing data
        existing_users = db.query(User).all()
        existing_domains = db.query(Domain).all()
        existing_data_sources = db.query(DataSource).all()
        existing_tables = db.query(Table).all()
        existing_tags = db.query(Tag).all()
        
        print(f"📊 Found existing data: {len(existing_users)} users, {len(existing_domains)} domains, {len(existing_data_sources)} data sources, {len(existing_tables)} tables")
        
        if not existing_users:
            print("❌ No existing users found. Please run the basic sample data script first.")
            return
        
        # Create data classifications
        print("🏷️ Creating data classifications...")
        classifications = [
            {
                "name": "PII - Personal Identifiable Information",
                "description": "Data that can be used to identify a specific individual",
                "pattern": r".*(?:ssn|social|passport|license).*",
                "sensitivity_level": "RESTRICTED",
                "pii_category": "Direct Identifier",
                "compliance_tags": ["GDPR", "CCPA", "PCI"],
                "auto_apply": True
            },
            {
                "name": "Financial Data",
                "description": "Financial information including revenue, costs, pricing",
                "pattern": r".*(?:revenue|cost|price|payment|salary|wage).*",
                "sensitivity_level": "CONFIDENTIAL",
                "pii_category": None,
                "compliance_tags": ["SOX", "Financial"],
                "auto_apply": True
            },
            {
                "name": "Customer Data",
                "description": "Customer information and preferences",
                "pattern": r".*(?:customer|client|passenger).*",
                "sensitivity_level": "CONFIDENTIAL",
                "pii_category": "Quasi Identifier",
                "compliance_tags": ["GDPR", "Customer Privacy"],
                "auto_apply": True
            },
            {
                "name": "Operational Metrics",
                "description": "Business operational data and KPIs",
                "pattern": r".*(?:metric|kpi|performance|utilization).*",
                "sensitivity_level": "INTERNAL",
                "pii_category": None,
                "compliance_tags": ["Business Intelligence"],
                "auto_apply": False
            },
            {
                "name": "Public Reference Data",
                "description": "Publicly available reference information",
                "pattern": r".*(?:airport_code|country|timezone).*",
                "sensitivity_level": "PUBLIC",
                "pii_category": None,
                "compliance_tags": [],
                "auto_apply": True
            }
        ]
        
        classification_map = {}
        for class_data in classifications:
            classification = DataClassification(
                name=class_data["name"],
                description=class_data["description"],
                pattern=class_data["pattern"],
                sensitivity_level=class_data["sensitivity_level"],
                pii_category=class_data["pii_category"],
                compliance_tags=class_data["compliance_tags"],
                is_active=True,
                auto_apply=class_data["auto_apply"]
            )
            db.add(classification)
            db.flush()
            classification_map[class_data["name"]] = classification
        
        # Create quality dimensions
        print("📏 Creating quality dimensions...")
        quality_dimensions = [
            {"name": "Completeness", "description": "Percentage of non-null values", "category": "Validity", "weight": 0.3},
            {"name": "Accuracy", "description": "Correctness of data values", "category": "Validity", "weight": 0.25},
            {"name": "Consistency", "description": "Data consistency across systems", "category": "Validity", "weight": 0.2},
            {"name": "Timeliness", "description": "How up-to-date the data is", "category": "Currency", "weight": 0.15},
            {"name": "Uniqueness", "description": "Absence of duplicate records", "category": "Validity", "weight": 0.1}
        ]
        
        for dim_data in quality_dimensions:
            dimension = QualityDimension(
                name=dim_data["name"],
                description=dim_data["description"],
                category=dim_data["category"],
                weight=dim_data["weight"],
                is_active=True
            )
            db.add(dimension)
        
        # Create business glossary entries
        print("📚 Creating business glossary entries...")
        glossary_terms = [
            {
                "term": "Flight Delay",
                "definition": "The amount of time a flight arrives later than scheduled",
                "business_definition": "A flight is considered delayed if it arrives more than 15 minutes after the scheduled arrival time",
                "technical_definition": "actual_arrival - scheduled_arrival > 15 minutes",
                "category": "Operations",
                "synonyms": "Late Arrival, Schedule Deviation",
                "domain": existing_domains[0] if existing_domains else None
            },
            {
                "term": "Passenger Load Factor",
                "definition": "The percentage of available seats that are filled with passengers",
                "business_definition": "A key metric for airline efficiency and revenue optimization",
                "technical_definition": "passengers_boarded / total_seat_capacity * 100",
                "category": "Performance",
                "synonyms": "Seat Utilization, Occupancy Rate",
                "domain": existing_domains[1] if len(existing_domains) > 1 else None
            },
            {
                "term": "Turnaround Time",
                "definition": "Time between aircraft arrival and departure at a gate",
                "business_definition": "Critical operational metric affecting schedule reliability and gate utilization",
                "technical_definition": "departure_time - arrival_time for same aircraft at same gate",
                "category": "Operations",
                "synonyms": "Ground Time, Gate Time",
                "domain": existing_domains[3] if len(existing_domains) > 3 else None
            }
        ]
        
        for term_data in glossary_terms:
            term = BusinessGlossary(
                term=term_data["term"],
                definition=term_data["definition"],
                business_definition=term_data["business_definition"],
                technical_definition=term_data["technical_definition"],
                owner_id=random.choice(existing_users).id,
                approved_by=random.choice(existing_users).id,
                is_approved=True,
                synonyms=term_data["synonyms"],
                category=term_data["category"],
                domain_id=term_data["domain"].id if term_data["domain"] else None,
                is_active=True,
                approved_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
            )
            db.add(term)
        
        # Create lineage jobs
        print("🔄 Creating lineage jobs...")
        lineage_jobs = [
            {
                "name": "Flight Data ETL Pipeline",
                "description": "Daily ETL job that processes flight operational data",
                "external_job_id": "fms_etl_001",
                "job_type": "ETL",
                "schedule": "0 2 * * *",  # Daily at 2 AM
                "is_scheduled": True,
                "job_config": {"source_system": "FMS", "target_schema": "operations", "batch_size": 10000}
            },
            {
                "name": "Passenger Analytics Pipeline",
                "description": "Processes passenger booking and service data",
                "external_job_id": "pas_analytics_001",
                "job_type": "Analytics",
                "schedule": "0 4 * * *",  # Daily at 4 AM
                "is_scheduled": True,
                "job_config": {"source_system": "PAS", "target_schema": "analytics", "aggregation_level": "daily"}
            },
            {
                "name": "Security Data Sync",
                "description": "Syncs security screening data with operational systems",
                "external_job_id": "sec_sync_001",
                "job_type": "Sync",
                "schedule": "0 */2 * * *",  # Every 2 hours
                "is_scheduled": True,
                "job_config": {"source_system": "Security", "sync_type": "incremental"}
            }
        ]
        
        job_map = {}
        for job_data in lineage_jobs:
            job = LineageJob(
                name=job_data["name"],
                description=job_data["description"],
                external_job_id=job_data["external_job_id"],
                job_type=job_data["job_type"],
                schedule=job_data["schedule"],
                is_scheduled=job_data["is_scheduled"],
                last_run_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                next_run_at=datetime.utcnow() + timedelta(hours=random.randint(1, 24)),
                last_run_status="success",
                job_config=job_data["job_config"],
                owner_id=random.choice(existing_users).id,
                is_active=True
            )
            db.add(job)
            db.flush()
            job_map[job_data["name"]] = job
        
        # Create lineage job runs
        print("▶️ Creating lineage job runs...")
        for job in job_map.values():
            for i in range(5):  # 5 recent runs per job
                run = LineageJobRun(
                    job_id=job.id,
                    run_id=f"{job.external_job_id}_{datetime.utcnow().strftime('%Y%m%d')}_{i:03d}",
                    started_at=datetime.utcnow() - timedelta(days=i+1, hours=random.randint(0, 23)),
                    ended_at=datetime.utcnow() - timedelta(days=i+1, hours=random.randint(0, 23)) + timedelta(minutes=random.randint(15, 120)),
                    status="success" if random.random() > 0.1 else "failed",
                    tables_processed=random.randint(5, 20),
                    lineage_edges_created=random.randint(10, 50),
                    lineage_edges_updated=random.randint(0, 10),
                    execution_context={"version": "1.0", "environment": "prod", "cluster": f"cluster-{random.randint(1,3)}"}
                )
                db.add(run)
        
        # Create lineage edges to show data flow relationships
        print("🔗 Creating lineage edges...")
        if len(existing_tables) >= 4:
            # Create some realistic lineage relationships
            lineage_relationships = [
                # Flight data flows into reporting tables
                {
                    "source_table": existing_tables[0],  # flights table
                    "target_table": existing_tables[6],  # gate_assignments
                    "transformation_logic": "SELECT flight_id, gate_number FROM flights WHERE flight_status = 'BOARDING'",
                    "transformation_type": "filter_projection",
                    "confidence_score": 95
                },
                # Passenger data flows into security screening
                {
                    "source_table": existing_tables[2],  # passengers
                    "target_table": existing_tables[4],  # security_screenings  
                    "transformation_logic": "JOIN passengers p ON s.passenger_id = p.passenger_id",
                    "transformation_type": "join",
                    "confidence_score": 90
                },
                # Booking data aggregated into revenue
                {
                    "source_table": existing_tables[3],  # bookings
                    "target_table": existing_tables[8],  # revenue_summary
                    "transformation_logic": "GROUP BY booking_date, service_category; SUM(ticket_price) as total_revenue",
                    "transformation_type": "aggregation",
                    "confidence_score": 98
                }
            ]
            
            for rel in lineage_relationships:
                edge = LineageEdge(
                    source_table_id=rel["source_table"].id,
                    target_table_id=rel["target_table"].id,
                    lineage_type="TABLE_TO_TABLE",
                    source_type="ETL_METADATA",
                    transformation_logic=rel["transformation_logic"],
                    transformation_type=rel["transformation_type"],
                    job_id=random.choice(list(job_map.values())).id,
                    confidence_score=rel["confidence_score"],
                    is_verified=True,
                    verified_by=random.choice(existing_users).id,
                    verified_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)),
                    is_active=True,
                    last_observed_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
                )
                db.add(edge)
        
        # Create lineage impact analysis
        print("📊 Creating lineage impact analysis...")
        for table in existing_tables[:5]:  # For first 5 tables
            analysis = LineageImpactAnalysis(
                table_id=table.id,
                upstream_table_count=random.randint(0, 3),
                upstream_column_count=random.randint(0, 10),
                max_upstream_depth=random.randint(1, 3),
                downstream_table_count=random.randint(1, 5),
                downstream_column_count=random.randint(5, 20),
                max_downstream_depth=random.randint(1, 4),
                is_critical_path=random.choice([True, False]),
                criticality_score=random.randint(1, 10),
                impact_radius=random.randint(1, 15),
                upstream_tables=[{"id": t.id, "name": t.name} for t in existing_tables[:2]],
                downstream_tables=[{"id": t.id, "name": t.name} for t in existing_tables[3:6]],
                analysis_version="1.0"
            )
            db.add(analysis)
        
        # Create column statistics for existing columns
        print("📈 Creating column statistics...")
        existing_columns = db.query(Column).all()
        for column in existing_columns[:20]:  # For first 20 columns
            stats = ColumnStats(
                column_id=column.id,
                null_count=random.randint(0, 1000),
                unique_count=random.randint(100, 50000),
                min_value=str(random.randint(1, 100)) if 'id' in column.name.lower() else "A",
                max_value=str(random.randint(1000, 99999)) if 'id' in column.name.lower() else "Z",
                avg_length=random.randint(5, 50) if column.data_type in ['VARCHAR', 'TEXT'] else None,
                top_values={"value1": 0.3, "value2": 0.25, "value3": 0.2} if random.choice([True, False]) else None,
                data_patterns=[r"^\d{3}-\d{2}-\d{4}$"] if 'ssn' in column.name.lower() else None
            )
            db.add(stats)
        
        # Create quality rules
        print("✅ Creating quality rules...")
        quality_rules = [
            {
                "name": "Flight ID Not Null",
                "description": "Flight ID must not be null",
                "table": existing_tables[0] if existing_tables else None,
                "rule_type": "NULL_CHECK",
                "rule_config": {"column": "flight_id"},
                "severity": "CRITICAL"
            },
            {
                "name": "Email Format Validation",
                "description": "Email addresses must be in valid format",
                "table": existing_tables[2] if len(existing_tables) > 2 else None,
                "rule_type": "FORMAT_CHECK",
                "rule_config": {"column": "email", "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"},
                "severity": "HIGH"
            },
            {
                "name": "Revenue Non-Negative",
                "description": "Revenue amounts must be non-negative",
                "table": existing_tables[8] if len(existing_tables) > 8 else None,
                "rule_type": "RANGE_CHECK",
                "rule_config": {"column": "total_revenue", "min_value": 0},
                "severity": "HIGH"
            }
        ]
        
        rule_map = {}
        for rule_data in quality_rules:
            if rule_data["table"]:
                rule = QualityRule(
                    name=rule_data["name"],
                    description=rule_data["description"],
                    table_id=rule_data["table"].id,
                    rule_type=rule_data["rule_type"],
                    rule_config=rule_data["rule_config"],
                    severity=rule_data["severity"],
                    is_active=True,
                    is_blocking=rule_data["severity"] in ["CRITICAL", "HIGH"],
                    check_frequency="daily",
                    last_check_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                    next_check_at=datetime.utcnow() + timedelta(hours=random.randint(1, 24)),
                    created_by=random.choice(existing_users).id,
                    owner_id=random.choice(existing_users).id
                )
                db.add(rule)
                db.flush()
                rule_map[rule_data["name"]] = rule
        
        # Create quality results
        print("📊 Creating quality results...")
        for rule in rule_map.values():
            for i in range(7):  # 7 days of results
                result = QualityResult(
                    rule_id=rule.id,
                    check_id=f"check_{rule.id}_{datetime.utcnow().strftime('%Y%m%d')}_{i:03d}",
                    started_at=datetime.utcnow() - timedelta(days=i+1),
                    completed_at=datetime.utcnow() - timedelta(days=i+1) + timedelta(minutes=random.randint(1, 30)),
                    status=random.choice(["PASSED", "PASSED", "PASSED", "WARNING", "FAILED"]),  # Mostly passed
                    score=random.uniform(0.7, 1.0),
                    passed_count=random.randint(800, 1000),
                    failed_count=random.randint(0, 50),
                    total_count=random.randint(850, 1000),
                    measured_value=str(random.uniform(0.85, 1.0)),
                    expected_value="1.0",
                    execution_context={"check_type": "automated", "version": "1.0"}
                )
                db.add(result)
                
                # Create alerts for failed results
                if result.status == "FAILED":
                    alert = QualityAlert(
                        rule_id=rule.id,
                        result_id=result.id,
                        alert_type="QUALITY_FAILURE",
                        severity=rule.severity,
                        message=f"Quality rule '{rule.name}' failed with score {result.score:.2f}",
                        recipients=[f"admin@airport.com", f"dq-team@airport.com"],
                        is_resolved=random.choice([True, False]),
                        notification_sent=True,
                        notification_sent_at=result.completed_at + timedelta(minutes=5)
                    )
                    db.add(alert)
        
        # Create data retention policies
        print("🗄️ Creating data retention policies...")
        retention_policies = [
            {
                "name": "PII Data Retention Policy",
                "description": "Personal data must be deleted after 7 years of inactivity",
                "retention_period_days": 2555,  # ~7 years
                "applies_to_tags": ["PII"],
                "applies_to_sensitivity": ["RESTRICTED", "CONFIDENTIAL"],
                "regulatory_basis": "GDPR Article 5(1)(e) - storage limitation"
            },
            {
                "name": "Financial Records Policy",
                "description": "Financial data must be retained for 10 years",
                "retention_period_days": 3653,  # ~10 years
                "applies_to_tags": ["Financial"],
                "regulatory_basis": "Sarbanes-Oxley Act requirements"
            },
            {
                "name": "Operational Logs Policy", 
                "description": "System logs retained for 2 years",
                "retention_period_days": 730,  # 2 years
                "applies_to_domains": ["Ground Operations"],
                "regulatory_basis": "Internal audit requirements"
            }
        ]
        
        for policy_data in retention_policies:
            policy = DataRetentionPolicy(
                name=policy_data["name"],
                description=policy_data["description"],
                retention_period_days=policy_data["retention_period_days"],
                applies_to_domains=policy_data.get("applies_to_domains"),
                applies_to_tags=policy_data.get("applies_to_tags"),
                applies_to_sensitivity=policy_data.get("applies_to_sensitivity"),
                auto_delete_enabled=False,  # Require manual approval
                notification_days_before=30,
                regulatory_basis=policy_data["regulatory_basis"],
                owner_id=random.choice(existing_users).id,
                approved_by=random.choice(existing_users).id,
                is_active=True,
                approved_at=datetime.utcnow() - timedelta(days=random.randint(10, 90))
            )
            db.add(policy)
        
        # Create some access requests
        print("🔐 Creating access requests...")
        for i in range(10):
            request = AccessRequest(
                user_id=random.choice(existing_users).id,
                table_id=random.choice(existing_tables).id,
                reason=f"Need access for analysis project #{i+1}",
                business_justification=f"Required for quarterly reporting and compliance analysis",
                requested_access_level=random.choice(["READ", "READ_WRITE"]),
                duration_days=random.choice([30, 60, 90]),
                status=random.choice(["PENDING", "APPROVED", "APPROVED", "APPROVED"]),  # Mostly approved
                requested_start_date=datetime.utcnow() + timedelta(days=1),
                requested_end_date=datetime.utcnow() + timedelta(days=random.choice([30, 60, 90])),
                approved_by=random.choice(existing_users).id if random.random() > 0.3 else None,
                approved_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)) if random.random() > 0.3 else None
            )
            db.add(request)
        
        # Create compliance reports
        print("📋 Creating compliance reports...")
        compliance_reports = [
            {
                "name": "Q4 2024 GDPR Compliance Report",
                "report_type": "GDPR_COMPLIANCE",
                "period_start": datetime(2024, 10, 1),
                "period_end": datetime(2024, 12, 31),
                "scope_domains": ["Passenger Services", "Security"],
                "status": "completed"
            },
            {
                "name": "SOX Controls Assessment 2024",
                "report_type": "SOX_COMPLIANCE",
                "period_start": datetime(2024, 1, 1), 
                "period_end": datetime(2024, 12, 31),
                "scope_domains": ["Finance"],
                "status": "in_progress"
            }
        ]
        
        for report_data in compliance_reports:
            report = ComplianceReport(
                name=report_data["name"],
                report_type=report_data["report_type"],
                scope_domains=report_data["scope_domains"],
                period_start=report_data["period_start"],
                period_end=report_data["period_end"],
                generated_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)) if report_data["status"] == "completed" else None,
                report_data={"findings": random.randint(0, 5), "recommendations": random.randint(1, 8)} if report_data["status"] == "completed" else None,
                status=report_data["status"],
                created_by=random.choice(existing_users).id
            )
            db.add(report)
        
        # Create some audit logs for recent activity
        print("📝 Creating audit logs...")
        actions = ["CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "SEARCH", "TAG_ADD"]
        resource_types = ["TABLE", "DOMAIN", "TAG", "USER", "DATA_SOURCE"]
        
        for i in range(50):
            log = AuditLog(
                user_id=random.choice(existing_users).id,
                action=random.choice(actions),
                resource_type=random.choice(resource_types),
                resource_id=random.randint(1, 20),
                resource_name=f"Resource_{random.randint(1, 100)}",
                details={"operation": "sample_audit", "metadata": {"source": "api"}},
                ip_address=f"192.168.1.{random.randint(1, 254)}",
                user_agent="MetaPortal-Client/1.0",
                endpoint=f"/api/v1/{random.choice(['tables', 'domains', 'tags'])}",
                http_method=random.choice(["GET", "POST", "PUT", "DELETE"]),
                status_code=random.choice([200, 201, 404, 500]),
                success=random.choice([True, True, True, False]),
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 168))  # Last 7 days
            )
            db.add(log)
        
        db.commit()
        print("✅ Comprehensive seed data created successfully!")
        
        # Print summary
        print("\n📈 Data Summary:")
        print(f"  • Data Classifications: {len(classifications)}")
        print(f"  • Quality Dimensions: {len(quality_dimensions)}")
        print(f"  • Business Glossary Terms: {len(glossary_terms)}")
        print(f"  • Lineage Jobs: {len(lineage_jobs)}")
        print(f"  • Quality Rules: {len(rule_map)}")
        print(f"  • Retention Policies: {len(retention_policies)}")
        print(f"  • Compliance Reports: {len(compliance_reports)}")
        print(f"  • Access Requests: 10")
        print(f"  • Audit Logs: 50")
        
        print("\n🔗 Lineage Relationships Created:")
        print(f"  • {len(lineage_relationships) if 'lineage_relationships' in locals() else 0} table-to-table lineage edges")
        print(f"  • Impact analysis for {min(5, len(existing_tables))} tables")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating comprehensive seed data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_comprehensive_seed_data()