# #!/usr/bin/env python3
# """
# Comprehensive seed data script for MetaPortal with all tables populated for a banking use case.
# This extends the existing sample data with additional tables and lineage data.
# """
# import sys
# import os
# sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# from datetime import datetime, timedelta
# import random
# import uuid
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy import create_engine

# # Assuming your models are in app.models
# # You might need to adjust the import path based on your project structure
# from app.models import *
# from app.core.database import Base
# from app.core.security import SecurityManager
# from app.core.config import settings

# def create_comprehensive_seed_data():
#     """Generate comprehensive seed data for all tables."""
    
#     # Database connection
#     engine = create_engine(os.getenv("DATABASE_URL", settings.database_url))
#     SessionLocal = sessionmaker(bind=engine)
#     db = SessionLocal()
    
#     try:
#         print("🚀 Creating comprehensive seed data for MetaPortal (Banking)...")
        
#         # Get existing data
#         existing_users = db.query(User).all()
#         existing_domains = db.query(Domain).all()
#         existing_data_sources = db.query(DataSource).all()
#         existing_tables = db.query(Table).all()
#         existing_tags = db.query(Tag).all()
        
#         print(f"📊 Found existing data: {len(existing_users)} users, {len(existing_domains)} domains, {len(existing_data_sources)} data sources, {len(existing_tables)} tables")
        
#         if not existing_users or not existing_tables:
#             print("❌ No existing users or tables found. Please run the basic sample data script first.")
#             return

#         table_map = {t.name: t for t in existing_tables}

#         # Create data classifications
#         print("🏷️ Creating data classifications...")
#         classifications = [
#             {
#                 "name": "PII - Personal Identifiable Information",
#                 "description": "Data that can be used to identify a specific individual",
#                 "pattern": r".*(?:ssn|social_security|account_number|card_number|passport).*",
#                 "sensitivity_level": "RESTRICTED",
#                 "pii_category": "Direct Identifier",
#                 "compliance_tags": ["GLBA", "CCPA", "PCI-DSS"],
#                 "auto_apply": True
#             },
#             {
#                 "name": "Financial Data",
#                 "description": "Financial information including balances, loans, and transactions",
#                 "pattern": r".*(?:balance|loan|transaction|credit|debit|payment|salary|wage).*",
#                 "sensitivity_level": "CONFIDENTIAL",
#                 "pii_category": None,
#                 "compliance_tags": ["SOX", "Financial"],
#                 "auto_apply": True
#             },
#             {
#                 "name": "Customer Data",
#                 "description": "Customer information and preferences",
#                 "pattern": r".*(?:customer|client).*",
#                 "sensitivity_level": "CONFIDENTIAL",
#                 "pii_category": "Quasi Identifier",
#                 "compliance_tags": ["Customer Privacy"],
#                 "auto_apply": True
#             },
#             {
#                 "name": "Risk Metrics",
#                 "description": "Business risk data and KPIs",
#                 "pattern": r".*(?:risk|score|metric|kpi|assessment).*",
#                 "sensitivity_level": "INTERNAL",
#                 "pii_category": None,
#                 "compliance_tags": ["Risk Management"],
#                 "auto_apply": False
#             },
#             {
#                 "name": "Public Reference Data",
#                 "description": "Publicly available reference information",
#                 "pattern": r".*(?:branch_code|country|currency_code).*",
#                 "sensitivity_level": "PUBLIC",
#                 "pii_category": None,
#                 "compliance_tags": [],
#                 "auto_apply": True
#             }
#         ]
        
#         for class_data in classifications:
#             classification = DataClassification(
#                 name=class_data["name"],
#                 description=class_data["description"],
#                 pattern=class_data["pattern"],
#                 sensitivity_level=class_data["sensitivity_level"],
#                 pii_category=class_data["pii_category"],
#                 compliance_tags=class_data["compliance_tags"],
#                 is_active=True,
#                 auto_apply=class_data["auto_apply"]
#             )
#             db.add(classification)
        
#         # Create quality dimensions
#         print("📏 Creating quality dimensions...")
#         quality_dimensions = [
#             {"name": "Completeness", "description": "Percentage of non-null values", "category": "Validity", "weight": 0.3},
#             {"name": "Accuracy", "description": "Correctness of data values", "category": "Validity", "weight": 0.25},
#             {"name": "Consistency", "description": "Data consistency across systems", "category": "Validity", "weight": 0.2},
#             {"name": "Timeliness", "description": "How up-to-date the data is", "category": "Currency", "weight": 0.15},
#             {"name": "Uniqueness", "description": "Absence of duplicate records", "category": "Validity", "weight": 0.1}
#         ]
        
#         for dim_data in quality_dimensions:
#             dimension = QualityDimension(
#                 name=dim_data["name"],
#                 description=dim_data["description"],
#                 category=dim_data["category"],
#                 weight=dim_data["weight"],
#                 is_active=True
#             )
#             db.add(dimension)

#         # Create business glossary entries
#         print("📚 Creating business glossary entries...")
#         glossary_terms = [
#             {
#                 "term": "Loan-to-Value (LTV) Ratio",
#                 "definition": "A ratio assessing lending risk, calculated by dividing the loan amount by the market value of the asset.",
#                 "business_definition": "A key risk metric for secured loans like mortgages. Higher LTV indicates higher risk.",
#                 "technical_definition": "(loan_amount / appraised_asset_value) * 100",
#                 "category": "Credit Risk",
#                 "synonyms": "LTV",
#                 "domain": next((d for d in existing_domains if d.name == "Risk Management"), None)
#             },
#             {
#                 "term": "Customer Churn Rate",
#                 "definition": "The percentage of customers who stop using the bank's services over a given period.",
#                 "business_definition": "A key performance indicator for customer retention and satisfaction.",
#                 "technical_definition": "(customers_lost_in_period / total_customers_at_start_of_period) * 100",
#                 "category": "Performance Metric",
#                 "synonyms": "Customer Attrition Rate",
#                 "domain": next((d for d in existing_domains if d.name == "Retail Banking"), None)
#             },
#             {
#                 "term": "Know Your Customer (KYC)",
#                 "definition": "A mandatory process of identifying and verifying the identity of a client.",
#                 "business_definition": "A critical compliance process to prevent identity theft, fraud, and money laundering.",
#                 "technical_definition": "Collection and verification of customer identity documents (e.g., passport, utility bills).",
#                 "category": "Compliance",
#                 "synonyms": "KYC",
#                 "domain": next((d for d in existing_domains if d.name == "Compliance"), None)
#             }
#         ]
        
#         for term_data in glossary_terms:
#             if term_data["domain"]:
#                 term = BusinessGlossary(
#                     term=term_data["term"],
#                     definition=term_data["definition"],
#                     business_definition=term_data["business_definition"],
#                     technical_definition=term_data["technical_definition"],
#                     owner_id=random.choice(existing_users).id,
#                     approved_by=random.choice(existing_users).id,
#                     is_approved=True,
#                     synonyms=term_data["synonyms"],
#                     category=term_data["category"],
#                     domain_id=term_data["domain"].id,
#                     is_active=True,
#                     approved_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
#                 )
#                 db.add(term)
        
#         # Create lineage jobs
#         print("🔄 Creating lineage jobs...")
#         lineage_jobs = [
#             {
#                 "name": "Core Banking Daily ETL",
#                 "description": "Daily ETL job that processes customer and transaction data into the data warehouse.",
#                 "external_job_id": "core_banking_etl_001",
#                 "job_type": "ETL",
#                 "schedule": "0 2 * * *",  # Daily at 2 AM
#                 "job_config": {"source_system": "Core Banking System", "target_schema": "analytics", "batch_size": 100000}
#             },
#             {
#                 "name": "Credit Risk Analytics Pipeline",
#                 "description": "Weekly pipeline to calculate credit risk scores and aggregate loan data.",
#                 "external_job_id": "risk_analytics_001",
#                 "job_type": "Analytics",
#                 "schedule": "0 4 * * 1",  # Every Monday at 4 AM
#                 "job_config": {"source_system": "Loan Origination System", "target_schema": "risk_analytics"}
#             },
#             {
#                 "name": "AML Transaction Monitoring Sync",
#                 "description": "Syncs transaction data for Anti-Money Laundering (AML) monitoring systems.",
#                 "external_job_id": "aml_sync_001",
#                 "job_type": "Sync",
#                 "schedule": "0 */1 * * *",  # Every hour
#                 "job_config": {"source_system": "Core Banking System", "sync_type": "incremental"}
#             }
#         ]
        
#         job_map = {}
#         for job_data in lineage_jobs:
#             job = LineageJob(
#                 name=job_data["name"],
#                 description=job_data["description"],
#                 external_job_id=job_data["external_job_id"],
#                 job_type=job_data["job_type"],
#                 schedule=job_data["schedule"],
#                 is_scheduled=True,
#                 last_run_status="success",
#                 owner_id=random.choice(existing_users).id,
#                 is_active=True
#             )
#             db.add(job)
#             db.flush()
#             job_map[job_data["name"]] = job
        
#         # Create lineage job runs
#         print("▶️ Creating lineage job runs...")
#         for job in job_map.values():
#             for i in range(5):  # 5 recent runs per job
#                 run = LineageJobRun(
#                     job_id=job.id,
#                     run_id=f"{job.external_job_id}_{datetime.utcnow().strftime('%Y%m%d')}_{i:03d}",
#                     started_at=datetime.utcnow() - timedelta(days=i+1, hours=random.randint(0, 23)),
#                     ended_at=datetime.utcnow() - timedelta(days=i+1, hours=random.randint(0, 23)) + timedelta(minutes=random.randint(15, 120)),
#                     status="success" if random.random() > 0.1 else "failed",
#                     tables_processed=random.randint(5, 20),
#                     lineage_edges_created=random.randint(10, 50),
#                     lineage_edges_updated=random.randint(0, 10),
#                     execution_context={"version": "1.0", "environment": "prod", "cluster": f"cluster-{random.randint(1,3)}"}
#                 )
#                 db.add(run)

#         # Create lineage edges to show data flow relationships
#         print("🔗 Creating lineage edges...")
#         # Note: table indices depend on the order in generate_sample_data.py
#         # 0:customers, 1:accounts, 2:transactions, 3:credit_scores, 4:loan_applications, 5:aml_alerts
#         if len(existing_tables) >= 6:
#             lineage_relationships = [
#                 # Customer data flows into accounts
#                 {
#                     "source_table": table_map["customers"],
#                     "target_table": table_map["accounts"],
#                     "transformation_logic": "SELECT customer_id, first_name, last_name, join_date FROM customers",
#                     "transformation_type": "projection",
#                     "confidence_score": 98
#                 },
#                 # Account data flows into transactions
#                 {
#                     "source_table": table_map["accounts"],
#                     "target_table": table_map["transactions"],
#                     "transformation_logic": "JOIN accounts a ON t.account_number = a.account_number",
#                     "transformation_type": "join",
#                     "confidence_score": 95
#                 },
#                 # Transaction data aggregated for AML alerts
#                 {
#                     "source_table": table_map["transactions"],
#                     "target_table": table_map["aml_alerts"],
#                     "transformation_logic": "GROUP BY customer_id, transaction_date HAVING SUM(amount) > 10000",
#                     "transformation_type": "aggregation",
#                     "confidence_score": 90
#                 }
#             ]
            
#             for rel in lineage_relationships:
#                 edge = LineageEdge(
#                     source_table_id=rel["source_table"].id,
#                     target_table_id=rel["target_table"].id,
#                     lineage_type="TABLE_TO_TABLE",
#                     source_type="ETL_METADATA",
#                     transformation_logic=rel["transformation_logic"],
#                     transformation_type=rel["transformation_type"],
#                     job_id=random.choice(list(job_map.values())).id,
#                     confidence_score=rel["confidence_score"],
#                     is_verified=True,
#                     verified_by=random.choice(existing_users).id,
#                     verified_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)),
#                     is_active=True,
#                     last_observed_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
#                 )
#                 db.add(edge)
        
#         # Create lineage impact analysis
#         print("📊 Creating lineage impact analysis...")
#         for table in existing_tables[:5]:
#             analysis = LineageImpactAnalysis(
#                 table_id=table.id,
#                 upstream_table_count=random.randint(0, 3),
#                 upstream_column_count=random.randint(0, 10),
#                 max_upstream_depth=random.randint(1, 3),
#                 downstream_table_count=random.randint(1, 5),
#                 downstream_column_count=random.randint(5, 20),
#                 max_downstream_depth=random.randint(1, 4),
#                 is_critical_path=random.choice([True, False]),
#                 criticality_score=random.randint(1, 10),
#                 impact_radius=random.randint(1, 15),
#                 upstream_tables=[{"id": t.id, "name": t.name} for t in random.sample(existing_tables, 2)],
#                 downstream_tables=[{"id": t.id, "name": t.name} for t in random.sample(existing_tables, 3)],
#                 analysis_version="1.0"
#             )
#             db.add(analysis)

#         # Create column statistics for existing columns
#         print("📈 Creating column statistics...")
#         existing_columns = db.query(Column).all()
#         for column in existing_columns[:20]:
#             stats = ColumnStats(
#                 column_id=column.id,
#                 null_count=random.randint(0, 1000),
#                 unique_count=random.randint(100, 50000),
#                 min_value=str(random.randint(1, 100)) if 'id' in column.name.lower() else "A",
#                 max_value=str(random.randint(1000, 99999)) if 'id' in column.name.lower() else "Z",
#                 avg_length=random.randint(5, 50) if column.data_type in ['VARCHAR', 'TEXT'] else None,
#                 top_values={"value1": 0.3, "value2": 0.25, "value3": 0.2} if random.choice([True, False]) else None,
#                 data_patterns=[r"^\d{3}-\d{2}-\d{4}$"] if 'ssn' in column.name.lower() else None
#             )
#             db.add(stats)
        
#         # Create quality rules
#         print("✅ Creating quality rules...")
#         quality_rules = [
#             {
#                 "name": "Account Number Not Null",
#                 "description": "Account Number must not be null",
#                 "table": table_map.get("accounts"),
#                 "rule_type": "NULL_CHECK",
#                 "rule_config": {"column": "account_number"},
#                 "severity": "CRITICAL"
#             },
#             {
#                 "name": "Customer Email Format Validation",
#                 "description": "Email addresses must be in valid format",
#                 "table": table_map.get("customers"),
#                 "rule_type": "FORMAT_CHECK",
#                 "rule_config": {"column": "email_address", "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"},
#                 "severity": "HIGH"
#             },
#             {
#                 "name": "Transaction Amount Positive",
#                 "description": "Transaction amounts must be positive numbers",
#                 "table": table_map.get("transactions"),
#                 "rule_type": "RANGE_CHECK",
#                 "rule_config": {"column": "amount", "min_value": 0.01},
#                 "severity": "HIGH"
#             }
#         ]
        
#         rule_map = {}
#         for rule_data in quality_rules:
#             if rule_data["table"]:
#                 rule = QualityRule(
#                     name=rule_data["name"],
#                     description=rule_data["description"],
#                     table_id=rule_data["table"].id,
#                     rule_type=rule_data["rule_type"],
#                     rule_config=rule_data["rule_config"],
#                     severity=rule_data["severity"],
#                     is_active=True,
#                     is_blocking=rule_data["severity"] in ["CRITICAL", "HIGH"],
#                     check_frequency="daily",
#                     last_check_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
#                     next_check_at=datetime.utcnow() + timedelta(hours=random.randint(1, 24)),
#                     created_by=random.choice(existing_users).id,
#                     owner_id=random.choice(existing_users).id
#                 )
#                 db.add(rule)
#                 db.flush()
#                 rule_map[rule_data["name"]] = rule

#         # Create quality results
#         print("📊 Creating quality results...")
#         for rule in rule_map.values():
#             for i in range(7):  # 7 days of results
#                 completion_time = datetime.utcnow() - timedelta(days=i+1) + timedelta(minutes=random.randint(1, 30))
#                 start_time = completion_time - timedelta(minutes=random.randint(1, 15))
#                 result = QualityResult(
#                     rule_id=rule.id,
#                     check_id=f"check_{rule.id}_{datetime.utcnow().strftime('%Y%m%d')}_{i:03d}",
#                     started_at=start_time,
#                     completed_at=completion_time,
#                     status=random.choice(["PASSED", "PASSED", "PASSED", "WARNING", "FAILED"]),  # Mostly passed
#                     score=random.uniform(0.7, 1.0),
#                     passed_count=random.randint(800, 1000),
#                     failed_count=random.randint(0, 50),
#                     total_count=random.randint(850, 1000),
#                     measured_value=str(random.uniform(0.85, 1.0)),
#                     expected_value="1.0",
#                     execution_context={"check_type": "automated", "version": "1.0"}
#                 )
#                 db.add(result)
#                 db.flush() # Flush to get result.id for the alert
                
#                 # Create alerts for failed results
#                 if result.status == "FAILED":
#                     alert = QualityAlert(
#                         rule_id=rule.id,
#                         result_id=result.id,
#                         alert_type="QUALITY_FAILURE",
#                         severity=rule.severity,
#                         message=f"Quality rule '{rule.name}' failed with score {result.score:.2f}",
#                         recipients=[f"compliance@megabank.com", f"dq-team@megabank.com"],
#                         is_resolved=random.choice([True, False]),
#                         notification_sent=True,
#                         notification_sent_at=result.completed_at + timedelta(minutes=5)
#                     )
#                     db.add(alert)
        
#         # Create data retention policies
#         print("🗄️ Creating data retention policies...")
#         retention_policies = [
#             {
#                 "name": "Customer PII Data Retention Policy",
#                 "description": "Customer personal data must be deleted after 7 years of account inactivity.",
#                 "retention_period_days": 2555,  # ~7 years
#                 "applies_to_tags": ["PII"],
#                 "applies_to_sensitivity": ["RESTRICTED", "CONFIDENTIAL"],
#                 "regulatory_basis": "Gramm-Leach-Bliley Act (GLBA)"
#             },
#             {
#                 "name": "Financial Records Policy (SOX)",
#                 "description": "Financial transaction data must be retained for at least 7 years",
#                 "retention_period_days": 2555,  # ~7 years
#                 "applies_to_tags": ["Financial"],
#                 "regulatory_basis": "Sarbanes-Oxley Act (SOX)"
#             },
#             {
#                 "name": "AML Records Policy", 
#                 "description": "Anti-Money Laundering records retained for 5 years",
#                 "retention_period_days": 1825,  # 5 years
#                 "applies_to_domains": ["Compliance"],
#                 "regulatory_basis": "Bank Secrecy Act (BSA)"
#             }
#         ]
        
#         for policy_data in retention_policies:
#             policy = DataRetentionPolicy(
#                 name=policy_data["name"],
#                 description=policy_data["description"],
#                 retention_period_days=policy_data["retention_period_days"],
#                 applies_to_domains=policy_data.get("applies_to_domains"),
#                 applies_to_tags=policy_data.get("applies_to_tags"),
#                 applies_to_sensitivity=policy_data.get("applies_to_sensitivity"),
#                 auto_delete_enabled=False,
#                 notification_days_before=30,
#                 regulatory_basis=policy_data["regulatory_basis"],
#                 owner_id=random.choice(existing_users).id,
#                 approved_by=random.choice(existing_users).id,
#                 is_active=True,
#                 approved_at=datetime.utcnow() - timedelta(days=random.randint(10, 90))
#             )
#             db.add(policy)

#         # Create some access requests
#         print("🔐 Creating access requests...")
#         for i in range(10):
#             request = AccessRequest(
#                 user_id=random.choice(existing_users).id,
#                 table_id=random.choice(existing_tables).id,
#                 reason=f"Need access for fraud detection analysis project #{i+1}",
#                 business_justification=f"Required for quarterly risk assessment and model training.",
#                 requested_access_level=random.choice(["READ", "READ_WRITE"]),
#                 duration_days=random.choice([30, 60, 90]),
#                 status=random.choice(["PENDING", "APPROVED", "APPROVED", "APPROVED"]),
#                 requested_start_date=datetime.utcnow() + timedelta(days=1),
#                 requested_end_date=datetime.utcnow() + timedelta(days=random.choice([30, 60, 90])),
#                 approved_by=random.choice(existing_users).id if random.random() > 0.3 else None,
#                 approved_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)) if random.random() > 0.3 else None
#             )
#             db.add(request)
        
#         # Create compliance reports
#         print("📋 Creating compliance reports...")
#         compliance_reports = [
#             {
#                 "name": "Q4 2024 BSA/AML Compliance Report",
#                 "report_type": "BSA_AML_COMPLIANCE",
#                 "period_start": datetime(2024, 10, 1),
#                 "period_end": datetime(2024, 12, 31),
#                 "scope_domains": ["Compliance", "Retail Banking"],
#                 "status": "completed"
#             },
#             {
#                 "name": "SOX Controls Assessment 2024",
#                 "report_type": "SOX_COMPLIANCE",
#                 "period_start": datetime(2024, 1, 1), 
#                 "period_end": datetime(2024, 12, 31),
#                 "scope_domains": ["Treasury"],
#                 "status": "in_progress"
#             }
#         ]
        
#         for report_data in compliance_reports:
#             report = ComplianceReport(
#                 name=report_data["name"],
#                 report_type=report_data["report_type"],
#                 scope_domains=report_data["scope_domains"],
#                 period_start=report_data["period_start"],
#                 period_end=report_data["period_end"],
#                 generated_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)) if report_data["status"] == "completed" else None,
#                 report_data={"findings": random.randint(0, 5), "recommendations": random.randint(1, 8)} if report_data["status"] == "completed" else None,
#                 status=report_data["status"],
#                 created_by=random.choice(existing_users).id
#             )
#             db.add(report)
        
#         # Create some audit logs for recent activity
#         print("📝 Creating audit logs...")
#         actions = ["CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "SEARCH", "TAG_ADD"]
#         resource_types = ["TABLE", "DOMAIN", "TAG", "USER", "DATA_SOURCE"]
        
#         for i in range(50):
#             log = AuditLog(
#                 user_id=random.choice(existing_users).id,
#                 action=random.choice(actions),
#                 resource_type=random.choice(resource_types),
#                 resource_id=random.randint(1, 20),
#                 resource_name=f"Resource_{random.randint(1, 100)}",
#                 details={"operation": "sample_audit", "metadata": {"source": "api"}},
#                 ip_address=f"192.168.1.{random.randint(1, 254)}",
#                 user_agent="MetaPortal-Client/1.0",
#                 endpoint=f"/api/v1/{random.choice(['tables', 'domains', 'tags'])}",
#                 http_method=random.choice(["GET", "POST", "PUT", "DELETE"]),
#                 status_code=random.choice([200, 201, 404, 500]),
#                 success=random.choice([True, True, True, False]),
#                 created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 168))
#             )
#             db.add(log)
        
#         db.commit()
#         print("✅ Comprehensive seed data created successfully!")
        
#     except Exception as e:
#         db.rollback()
#         print(f"❌ Error creating comprehensive seed data: {e}")
#         raise
#     finally:
#         db.close()


# if __name__ == "__main__":
#     create_comprehensive_seed_data()

#!/usr/bin/env python3
"""
Comprehensive seed data script for MetaPortal with all tables populated for a banking use case.
This extends the existing sample data with additional tables and lineage data.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from datetime import datetime, timedelta
import random
import uuid
from sqlalchemy.orm import sessionmaker, joinedload
from sqlalchemy import create_engine

# Assuming your models are in app.models
# You might need to adjust the import path based on your project structure
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
        print("🚀 Creating comprehensive seed data for MetaPortal (Banking)...")
        
        # Get existing data
        existing_users = db.query(User).all()
        existing_domains = db.query(Domain).all()
        existing_data_sources = db.query(DataSource).all()
        # Eagerly load columns to avoid separate queries for each table
        existing_tables = db.query(Table).options(joinedload(Table.columns)).all()
        existing_tags = db.query(Tag).all()
        
        print(f"📊 Found existing data: {len(existing_users)} users, {len(existing_domains)} domains, {len(existing_data_sources)} data sources, {len(existing_tables)} tables")
        
        if not existing_users or not existing_tables:
            print("❌ No existing users or tables found. Please run the basic sample data script first.")
            return

        table_map = {t.name: t for t in existing_tables}
        # Create a map of (table_name, column_name) -> column_object for easy lookup
        column_map = {
            (table.name, column.name): column
            for table in existing_tables
            for column in table.columns
        }

        # Create data classifications
        print("🏷️ Creating data classifications...")
        classifications = [
            {
                "name": "PII - Personal Identifiable Information",
                "description": "Data that can be used to identify a specific individual",
                "pattern": r".*(?:ssn|social_security|account_number|card_number|passport).*",
                "sensitivity_level": "RESTRICTED",
                "pii_category": "Direct Identifier",
                "compliance_tags": ["GLBA", "CCPA", "PCI-DSS"],
                "auto_apply": True
            },
            {
                "name": "Financial Data",
                "description": "Financial information including balances, loans, and transactions",
                "pattern": r".*(?:balance|loan|transaction|credit|debit|payment|salary|wage).*",
                "sensitivity_level": "CONFIDENTIAL",
                "pii_category": None,
                "compliance_tags": ["SOX", "Financial"],
                "auto_apply": True
            },
            {
                "name": "Customer Data",
                "description": "Customer information and preferences",
                "pattern": r".*(?:customer|client).*",
                "sensitivity_level": "CONFIDENTIAL",
                "pii_category": "Quasi Identifier",
                "compliance_tags": ["Customer Privacy"],
                "auto_apply": True
            },
            {
                "name": "Risk Metrics",
                "description": "Business risk data and KPIs",
                "pattern": r".*(?:risk|score|metric|kpi|assessment).*",
                "sensitivity_level": "INTERNAL",
                "pii_category": None,
                "compliance_tags": ["Risk Management"],
                "auto_apply": False
            },
            {
                "name": "Public Reference Data",
                "description": "Publicly available reference information",
                "pattern": r".*(?:branch_code|country|currency_code).*",
                "sensitivity_level": "PUBLIC",
                "pii_category": None,
                "compliance_tags": [],
                "auto_apply": True
            }
        ]
        
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
            db.merge(classification)
        
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
            db.merge(dimension)

        # Create business glossary entries
        print("📚 Creating business glossary entries...")
        glossary_terms = [
            {
                "term": "Loan-to-Value (LTV) Ratio",
                "definition": "A ratio assessing lending risk, calculated by dividing the loan amount by the market value of the asset.",
                "business_definition": "A key risk metric for secured loans like mortgages. Higher LTV indicates higher risk.",
                "technical_definition": "(loan_amount / appraised_asset_value) * 100",
                "category": "Credit Risk",
                "synonyms": "LTV",
                "domain": next((d for d in existing_domains if d.name == "Risk Management"), None)
            },
            {
                "term": "Customer Churn Rate",
                "definition": "The percentage of customers who stop using the bank's services over a given period.",
                "business_definition": "A key performance indicator for customer retention and satisfaction.",
                "technical_definition": "(customers_lost_in_period / total_customers_at_start_of_period) * 100",
                "category": "Performance Metric",
                "synonyms": "Customer Attrition Rate",
                "domain": next((d for d in existing_domains if d.name == "Retail Banking"), None)
            },
            {
                "term": "Know Your Customer (KYC)",
                "definition": "A mandatory process of identifying and verifying the identity of a client.",
                "business_definition": "A critical compliance process to prevent identity theft, fraud, and money laundering.",
                "technical_definition": "Collection and verification of customer identity documents (e.g., passport, utility bills).",
                "category": "Compliance",
                "synonyms": "KYC",
                "domain": next((d for d in existing_domains if d.name == "Compliance"), None)
            }
        ]
        
        for term_data in glossary_terms:
            if term_data["domain"]:
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
                    domain_id=term_data["domain"].id,
                    is_active=True,
                    approved_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
                )
                db.merge(term)
        
        # --- START: EXPANDED LINEAGE SECTION ---

        print("🔄 Creating detailed lineage jobs...")
        lineage_jobs = [
            {
                "name": "Core Banking Daily ETL",
                "description": "Daily ETL job that processes customer and transaction data from the core banking system.",
                "external_job_id": "core_banking_etl_001",
                "job_type": "ETL",
                "schedule": "0 2 * * *",
            },
            {
                "name": "Credit Risk Analytics Pipeline",
                "description": "Weekly pipeline to calculate credit risk scores and aggregate loan data.",
                "external_job_id": "risk_analytics_001",
                "job_type": "Analytics",
                "schedule": "0 4 * * 1",
            },
            {
                "name": "AML Transaction Monitoring Sync",
                "description": "Syncs transaction data for Anti-Money Laundering (AML) monitoring systems.",
                "external_job_id": "aml_sync_001",
                "job_type": "Sync",
                "schedule": "0 */1 * * *",
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
                is_scheduled=True,
                last_run_status="success",
                owner_id=random.choice(existing_users).id,
                is_active=True
            )
            db.add(job)
            db.flush()
            job_map[job_data["name"]] = job
        
        print("▶️ Creating lineage job runs...")
        for job in job_map.values():
            for i in range(5):
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

        print("🔗 Creating detailed lineage edges (Table & Column Level)...")

        # Define all lineage relationships here for clarity
        lineage_relationships = [
            {
                "source_table": "customers", "target_table": "accounts", "job": "Core Banking Daily ETL",
                "table_logic": "Populate accounts with verified customer IDs.",
                "column_mappings": [
                    {"source": "customer_id", "target": "customer_id", "logic": "Direct copy of customer primary key."},
                ]
            },
            {
                "source_table": "accounts", "target_table": "transactions", "job": "Core Banking Daily ETL",
                "table_logic": "Link transactions to a valid account number.",
                "column_mappings": [
                    {"source": "account_number", "target": "account_number", "logic": "Direct copy of account primary key."},
                    {"source": "balance", "target": "running_balance", "logic": "Update running balance after each transaction."},
                ]
            },
            {
                "source_table": "customers", "target_table": "credit_scores", "job": "Credit Risk Analytics Pipeline",
                "table_logic": "Fetch credit scores for active customers.",
                "column_mappings": [
                    {"source": "customer_id", "target": "customer_id", "logic": "Direct copy of customer primary key."},
                ]
            },
            {
                "source_table": "customers", "target_table": "loan_applications", "job": "Credit Risk Analytics Pipeline",
                "table_logic": "Associate loan applications with a customer record.",
                "column_mappings": [
                    {"source": "customer_id", "target": "customer_id", "logic": "Direct copy of customer primary key."},
                ]
            },
            {
                "source_table": "transactions", "target_table": "aml_alerts", "job": "AML Transaction Monitoring Sync",
                "table_logic": "Generate alerts for transactions exceeding a certain threshold or showing suspicious patterns.",
                "column_mappings": [
                    {"source": "transaction_id", "target": "transaction_id", "logic": "Direct reference to the suspicious transaction."},
                    {"source": "amount", "target": "alert_reason", "logic": "CASE WHEN amount > 10000 THEN 'Large Transaction' ELSE 'Pattern Analysis' END"},
                ]
            },
            {
                "source_table": "accounts", "target_table": "aml_alerts", "job": "AML Transaction Monitoring Sync",
                "table_logic": "Enrich AML alerts with customer information via account details.",
                "column_mappings": [
                    # This demonstrates an indirect relationship mapped via a JOIN
                    {"source": "customer_id", "target": "customer_id", "logic": "JOIN accounts ON transactions.account_number = accounts.account_number"},
                ]
            }
        ]

        for rel in lineage_relationships:
            source_table_obj = table_map.get(rel["source_table"])
            target_table_obj = table_map.get(rel["target_table"])
            job_obj = job_map.get(rel["job"])

            if not all([source_table_obj, target_table_obj, job_obj]):
                print(f"⚠️ Skipping lineage creation for {rel['source_table']} -> {rel['target_table']} due to missing components.")
                continue

            # Create Table-to-Table Lineage Edge
            table_edge = LineageEdge(
                source_table_id=source_table_obj.id,
                target_table_id=target_table_obj.id,
                lineage_type="TABLE_TO_TABLE",
                source_type="ETL_METADATA",
                transformation_logic=rel["table_logic"],
                transformation_type="join" if "join" in rel["table_logic"].lower() else "projection",
                job_id=job_obj.id,
                confidence_score=random.randint(90, 99),
                is_verified=True, verified_by=random.choice(existing_users).id,
                verified_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)),
                is_active=True, last_observed_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
            )
            db.add(table_edge)

            # Create Column-to-Column Lineage Edges
            for mapping in rel["column_mappings"]:
                source_col_obj = column_map.get((rel["source_table"], mapping["source"]))
                target_col_obj = column_map.get((rel["target_table"], mapping["target"]))

                if not all([source_col_obj, target_col_obj]):
                    print(f"    ⚠️ Skipping column lineage for {mapping['source']} -> {mapping['target']} as column not found.")
                    continue

                column_edge = LineageEdge(
                    source_table_id=source_table_obj.id,
                    target_table_id=target_table_obj.id,
                    source_column_id=source_col_obj.id,
                    target_column_id=target_col_obj.id,
                    lineage_type="COLUMN_TO_COLUMN",
                    source_type="ETL_METADATA",
                    transformation_logic=mapping["logic"],
                    transformation_type="direct_copy" if "copy" in mapping["logic"].lower() else "complex",
                    job_id=job_obj.id,
                    confidence_score=random.randint(95, 100),
                    is_verified=True, verified_by=random.choice(existing_users).id,
                    verified_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)),
                    is_active=True, last_observed_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
                )
                db.add(column_edge)
        
        print("📊 Creating updated lineage impact analysis...")
        for table in existing_tables:
            # Simple logic to generate plausible impact numbers based on new lineage
            downstream_count = db.query(LineageEdge).filter(LineageEdge.source_table_id == table.id, LineageEdge.lineage_type == "TABLE_TO_TABLE").count()
            upstream_count = db.query(LineageEdge).filter(LineageEdge.target_table_id == table.id, LineageEdge.lineage_type == "TABLE_TO_TABLE").count()
            
            analysis = LineageImpactAnalysis(
                table_id=table.id,
                upstream_table_count=upstream_count,
                upstream_column_count=upstream_count * random.randint(3, 8),
                max_upstream_depth=random.randint(1, 2) if upstream_count > 0 else 0,
                downstream_table_count=downstream_count,
                downstream_column_count=downstream_count * random.randint(4, 10),
                max_downstream_depth=random.randint(1, 3) if downstream_count > 0 else 0,
                is_critical_path= (downstream_count > 1 or "transaction" in table.name),
                criticality_score= (upstream_count + downstream_count) * random.randint(1, 2),
                impact_radius= (upstream_count + downstream_count) * random.randint(2, 5),
                analysis_version="2.0" # New version reflecting detailed lineage
            )
            db.merge(analysis)

        # --- END: EXPANDED LINEAGE SECTION ---

        # Create column statistics for existing columns
        print("📈 Creating column statistics...")
        existing_columns = db.query(Column).all()
        for column in existing_columns[:30]: # Increased coverage
            stats = ColumnStats(
                column_id=column.id,
                null_count=random.randint(0, 1000),
                unique_count=random.randint(100, 50000),
                min_value=str(random.randint(1, 100)) if 'id' in column.name.lower() else "A",
                max_value=str(random.randint(1000, 99999)) if 'id' in column.name.lower() else "Z",
                avg_length=random.randint(5, 50) if 'VARCHAR' in column.data_type else None,
                top_values={"value1": 0.3, "value2": 0.25, "value3": 0.2} if random.choice([True, False]) else None,
                data_patterns=[r"^\d{3}-\d{2}-\d{4}$"] if 'ssn' in column.name.lower() else None
            )
            db.merge(stats)
        
        # Create quality rules
        print("✅ Creating quality rules...")
        quality_rules = [
            {
                "name": "Account Number Not Null", "table": table_map.get("accounts"),
                "rule_type": "NULL_CHECK", "rule_config": {"column": "account_number"}, "severity": "CRITICAL"
            },
            {
                "name": "Customer Email Format Validation", "table": table_map.get("customers"),
                "rule_type": "FORMAT_CHECK", "rule_config": {"column": "email_address", "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"}, "severity": "HIGH"
            },
            {
                "name": "Transaction Amount Positive", "table": table_map.get("transactions"),
                "rule_type": "RANGE_CHECK", "rule_config": {"column": "amount", "min_value": 0.01}, "severity": "HIGH"
            }
        ]
        
        rule_map = {}
        for rule_data in quality_rules:
            if rule_data["table"]:
                rule = QualityRule(
                    name=rule_data["name"], description=f"Rule for {rule_data['name']}",
                    table_id=rule_data["table"].id, rule_type=rule_data["rule_type"],
                    rule_config=rule_data["rule_config"], severity=rule_data["severity"],
                    is_active=True, is_blocking=rule_data["severity"] in ["CRITICAL", "HIGH"],
                    check_frequency="daily", last_check_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                    next_check_at=datetime.utcnow() + timedelta(hours=random.randint(1, 24)),
                    created_by=random.choice(existing_users).id, owner_id=random.choice(existing_users).id
                )
                db.add(rule)
                db.flush()
                rule_map[rule_data["name"]] = rule

        print("📊 Creating quality results...")
        for rule in rule_map.values():
            for i in range(7):
                completion_time = datetime.utcnow() - timedelta(days=i+1) + timedelta(minutes=random.randint(1, 30))
                start_time = completion_time - timedelta(minutes=random.randint(1, 15))
                result = QualityResult(
                    rule_id=rule.id,
                    check_id=f"check_{rule.id}_{datetime.utcnow().strftime('%Y%m%d')}_{i:03d}",
                    started_at=start_time, completed_at=completion_time,
                    status=random.choice(["PASSED", "PASSED", "PASSED", "WARNING", "FAILED"]),
                    score=random.uniform(0.7, 1.0),
                    passed_count=random.randint(800, 1000), failed_count=random.randint(0, 50),
                    total_count=random.randint(850, 1000), measured_value=str(random.uniform(0.85, 1.0)),
                    expected_value="1.0", execution_context={"check_type": "automated", "version": "1.0"}
                )
                db.add(result)
                db.flush()
                
                if result.status == "FAILED":
                    alert = QualityAlert(
                        rule_id=rule.id, result_id=result.id, alert_type="QUALITY_FAILURE",
                        severity=rule.severity, message=f"Quality rule '{rule.name}' failed with score {result.score:.2f}",
                        recipients=[f"compliance@megabank.com", f"dq-team@megabank.com"],
                        is_resolved=random.choice([True, False]), notification_sent=True,
                        notification_sent_at=result.completed_at + timedelta(minutes=5)
                    )
                    db.add(alert)
        
        # Create data retention policies
        print("🗄️ Creating data retention policies...")
        retention_policies = [
            {
                "name": "Customer PII Data Retention Policy",
                "description": "Customer personal data must be deleted after 7 years of account inactivity.",
                "retention_period_days": 2555, "applies_to_tags": ["PII"],
                "applies_to_sensitivity": ["RESTRICTED", "CONFIDENTIAL"], "regulatory_basis": "Gramm-Leach-Bliley Act (GLBA)"
            },
            {
                "name": "Financial Records Policy (SOX)",
                "description": "Financial transaction data must be retained for at least 7 years",
                "retention_period_days": 2555, "applies_to_tags": ["Financial"], "regulatory_basis": "Sarbanes-Oxley Act (SOX)"
            },
            {
                "name": "AML Records Policy", 
                "description": "Anti-Money Laundering records retained for 5 years",
                "retention_period_days": 1825, "applies_to_domains": ["Compliance"], "regulatory_basis": "Bank Secrecy Act (BSA)"
            }
        ]
        
        for policy_data in retention_policies:
            policy = DataRetentionPolicy(
                name=policy_data["name"], description=policy_data["description"],
                retention_period_days=policy_data["retention_period_days"],
                applies_to_domains=policy_data.get("applies_to_domains"),
                applies_to_tags=policy_data.get("applies_to_tags"),
                applies_to_sensitivity=policy_data.get("applies_to_sensitivity"),
                auto_delete_enabled=False, notification_days_before=30,
                regulatory_basis=policy_data["regulatory_basis"], owner_id=random.choice(existing_users).id,
                approved_by=random.choice(existing_users).id, is_active=True,
                approved_at=datetime.utcnow() - timedelta(days=random.randint(10, 90))
            )
            db.merge(policy)

        # Create some access requests
        print("🔐 Creating access requests...")
        for i in range(10):
            request = AccessRequest(
                user_id=random.choice(existing_users).id, table_id=random.choice(existing_tables).id,
                reason=f"Need access for fraud detection analysis project #{i+1}",
                business_justification=f"Required for quarterly risk assessment and model training.",
                requested_access_level=random.choice(["READ", "READ_WRITE"]),
                duration_days=random.choice([30, 60, 90]),
                status=random.choice(["PENDING", "APPROVED", "APPROVED", "APPROVED"]),
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
                "name": "Q4 2024 BSA/AML Compliance Report", "report_type": "BSA_AML_COMPLIANCE",
                "period_start": datetime(2024, 10, 1), "period_end": datetime(2024, 12, 31),
                "scope_domains": ["Compliance", "Retail Banking"], "status": "completed"
            },
            {
                "name": "SOX Controls Assessment 2024", "report_type": "SOX_COMPLIANCE",
                "period_start": datetime(2024, 1, 1), "period_end": datetime(2024, 12, 31),
                "scope_domains": ["Treasury"], "status": "in_progress"
            }
        ]
        
        for report_data in compliance_reports:
            report = ComplianceReport(
                name=report_data["name"], report_type=report_data["report_type"],
                scope_domains=report_data["scope_domains"], period_start=report_data["period_start"],
                period_end=report_data["period_end"],
                generated_at=datetime.utcnow() - timedelta(days=random.randint(1, 10)) if report_data["status"] == "completed" else None,
                report_data={"findings": random.randint(0, 5), "recommendations": random.randint(1, 8)} if report_data["status"] == "completed" else None,
                status=report_data["status"], created_by=random.choice(existing_users).id
            )
            db.merge(report)
        
        # Create some audit logs for recent activity
        print("📝 Creating audit logs...")
        actions = ["CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "SEARCH", "TAG_ADD"]
        resource_types = ["TABLE", "DOMAIN", "TAG", "USER", "DATA_SOURCE"]
        
        for i in range(50):
            log = AuditLog(
                user_id=random.choice(existing_users).id, action=random.choice(actions),
                resource_type=random.choice(resource_types), resource_id=random.randint(1, 20),
                resource_name=f"Resource_{random.randint(1, 100)}",
                details={"operation": "sample_audit", "metadata": {"source": "api"}},
                ip_address=f"192.168.1.{random.randint(1, 254)}", user_agent="MetaPortal-Client/1.0",
                endpoint=f"/api/v1/{random.choice(['tables', 'domains', 'tags'])}",
                http_method=random.choice(["GET", "POST", "PUT", "DELETE"]),
                status_code=random.choice([200, 201, 404, 500]), success=random.choice([True, True, True, False]),
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 168))
            )
            db.add(log)
        
        db.commit()
        print("✅ Comprehensive seed data created successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating comprehensive seed data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_comprehensive_seed_data()

