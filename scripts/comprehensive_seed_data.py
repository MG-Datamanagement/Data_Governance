# #!/usr/bin/env python3
# """
# Comprehensive seed data script for MetaPortal with all tables populated.
# This extends the existing sample data with additional tables and lineage data.
# """
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
import json
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Import all necessary models, assuming 'app.models' contains them
from app.models import *
from app.core.database import Base
from app.core.security import SecurityManager
from app.core.config import settings

# --- Helper function used in the script to find a reliable column ---
def get_pk_or_first_column(table_data):
    """Finds the primary key or the first column for rule configuration."""
    pk_col = next((c["name"] for c in table_data["columns"] if c.get("is_primary_key")), None)
    if pk_col:
        return {"name": pk_col, "type": "PK"}
    
    # Fallback to the first column if no PK is found
    if table_data["columns"]:
        return {"name": table_data["columns"][0]["name"], "type": "FIRST"}
    
    return {"name": "id", "type": "FALLBACK"}
# ------------------------------------------------------------------


def create_comprehensive_seed_data():
    """Generate comprehensive seed data for all tables."""
    
    # Database connection
    engine = create_engine(os.getenv("DATABASE_URL", settings.database_url))
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("🚀 Creating comprehensive seed data for MetaPortal...")
        
        # Get existing data (must be run after your first script)
        existing_users = db.query(User).all()
        existing_domains = db.query(Domain).all()
        existing_data_sources = db.query(DataSource).all()
        existing_tables = db.query(Table).all()
        existing_columns = db.query(Column).all()
        existing_tags = db.query(Tag).all()
        
        print(f"📊 Found existing data: {len(existing_users)} users, {len(existing_domains)} domains, {len(existing_data_sources)} data sources, {len(existing_tables)} tables")
        
        if not existing_users:
            print("❌ No existing users found. Please run the basic sample data script first.")
            return
        
        # --- Data Classifications (UNCHANGED) ---
        print("🏷️ Creating data classifications...")
        classifications = [
            {
                "name": "PII - Personal Identifiable Information",
                "description": "Data that can be used to identify a specific individual",
                "pattern": r".*(?:ssn|social|passport|license|customer_id|name|email|phone|address).*",
                "sensitivity_level": "RESTRICTED",
                "pii_category": "Direct Identifier",
                "compliance_tags": ["GDPR", "CCPA", "PCI"],
                "auto_apply": True
            },
            {
                "name": "Financial Data",
                "description": "Financial information including balances, transactions, revenue",
                "pattern": r".*(?:balance|amount|revenue|expense|profit|payment|loan|investment).*",
                "sensitivity_level": "CONFIDENTIAL",
                "pii_category": None,
                "compliance_tags": ["SOX", "Financial"],
                "auto_apply": True
            },
            {
                "name": "Customer Data",
                "description": "Customer information and preferences",
                "pattern": r".*(?:customer|account|kyc).*",
                "sensitivity_level": "CONFIDENTIAL",
                "pii_category": "Quasi Identifier",
                "compliance_tags": ["GDPR", "Customer Privacy"],
                "auto_apply": True
            },
            {
                "name": "Operational Metrics",
                "description": "Business operational data and KPIs",
                "pattern": r".*(?:metric|kpi|performance|status|log).*",
                "sensitivity_level": "INTERNAL",
                "pii_category": None,
                "compliance_tags": ["Business Intelligence"],
                "auto_apply": False
            },
            {
                "name": "Public Reference Data",
                "description": "Publicly available reference information",
                "pattern": r".*(?:currency|country|type|category).*",
                "sensitivity_level": "PUBLIC",
                "pii_category": None,
                "compliance_tags": [],
                "auto_apply": True
            },
            {
                "name": "Risk Data",
                "description": "Risk assessment and fraud data",
                "pattern": r".*(?:risk|fraud|score|alert).*",
                "sensitivity_level": "RESTRICTED",
                "pii_category": None,
                "compliance_tags": ["AML", "Fraud Prevention"],
                "auto_apply": True
            },
        ]
        
        classification_map = {}
        for class_data in classifications:
            compliance_tags_json = json.dumps(class_data["compliance_tags"])
            classification = DataClassification(
                name=class_data["name"],
                description=class_data["description"],
                pattern=class_data["pattern"],
                sensitivity_level=class_data["sensitivity_level"],
                pii_category=class_data["pii_category"],
                compliance_tags=compliance_tags_json,
                is_active=True,
                auto_apply=class_data["auto_apply"]
            )
            db.add(classification)
            db.flush()
            classification_map[class_data["name"]] = classification
        
        # --- Quality Dimensions (UNCHANGED) ---
        print("📏 Creating quality dimensions...")
        quality_dimensions = [
            {"name": "Completeness", "description": "Percentage of non-null values", "category": "Validity", "weight": 0.3},
            {"name": "Accuracy", "description": "Correctness of data values", "category": "Validity", "weight": 0.25},
            {"name": "Consistency", "description": "Data consistency across systems", "category": "Validity", "weight": 0.2},
            {"name": "Timeliness", "description": "How up-to-date the data is", "category": "Currency", "weight": 0.15},
            {"name": "Uniqueness", "description": "Absence of duplicate records", "category": "Validity", "weight": 0.1},
            {"name": "Validity", "description": "Conformance to defined business rules", "category": "Validity", "weight": 0.2},
            {"name": "Integrity", "description": "Referential integrity checks", "category": "Validity", "weight": 0.15},
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
        
        # --- Business Glossary (UNCHANGED) ---
        print("📚 Creating business glossary entries...")
        glossary_terms = [
            {
                "term": "Customer Lifetime Value",
                "definition": "The predicted net profit attributed to the entire future relationship with a customer",
                "business_definition": "A key metric for customer profitability and retention strategies",
                "technical_definition": "SUM(transactions.amount) + projected_future_value - acquisition_cost",
                "category": "Customer Management",
                "synonyms": "CLV, Lifetime Value",
                "domain": existing_domains[0] if existing_domains else None
            },
            {
                "term": "Loan-to-Value Ratio",
                "definition": "The ratio of the loan amount to the appraised value of the asset",
                "business_definition": "A risk assessment metric for lending decisions",
                "technical_definition": "loan.principal_amount / asset_appraised_value * 100",
                "category": "Loan Management",
                "synonyms": "LTV Ratio",
                "domain": existing_domains[3] if len(existing_domains) > 3 else None
            },
            {
                "term": "Fraud Detection Score",
                "definition": "A numerical score indicating the likelihood of fraudulent activity",
                "business_definition": "Used to flag potentially fraudulent transactions for review",
                "technical_definition": "ML model output between 0-1 based on transaction features",
                "category": "Risk Management",
                "synonyms": "Fraud Score, Risk Score",
                "domain": existing_domains[2] if len(existing_domains) > 2 else None
            },
            {
                "term": "Net Interest Margin",
                "definition": "The difference between interest income generated and interest paid",
                "business_definition": "A profitability metric for banking operations",
                "technical_definition": "(interest_income - interest_expense) / average_earning_assets",
                "category": "Finance",
                "synonyms": "NIM",
                "domain": existing_domains[4] if len(existing_domains) > 4 else None
            },
            {
                "term": "KYC Verification",
                "definition": "Know Your Customer process for identity verification",
                "business_definition": "Regulatory requirement to prevent money laundering",
                "technical_definition": "Verification of customer documents and data against standards",
                "category": "Compliance",
                "synonyms": "Customer Due Diligence, CDD",
                "domain": existing_domains[5] if len(existing_domains) > 5 else None
            },
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
        
        # --- Lineage Jobs and Runs (UNCHANGED) ---
        print("🔄 Creating lineage jobs...")
        lineage_jobs = [
            {
                "name": "Customer Data ETL Pipeline",
                "description": "Daily ETL job that processes customer profile data",
                "external_job_id": "cust_etl_001",
                "job_type": "ETL",
                "schedule": "0 2 * * *",  # Daily at 2 AM
                "is_scheduled": True,
                "job_config": {"source_system": "Core", "target_schema": "customers", "batch_size": 10000}
            },
            {
                "name": "Transaction Analytics Pipeline",
                "description": "Processes transaction and payment data",
                "external_job_id": "trans_analytics_001",
                "job_type": "Analytics",
                "schedule": "0 4 * * *",  # Daily at 4 AM
                "is_scheduled": True,
                "job_config": {"source_system": "Transactions", "target_schema": "analytics", "aggregation_level": "daily"}
            },
            {
                "name": "Risk Data Sync",
                "description": "Syncs risk assessment data with operational systems",
                "external_job_id": "risk_sync_001",
                "job_type": "Sync",
                "schedule": "0 */2 * * *",  # Every 2 hours
                "is_scheduled": True,
                "job_config": {"source_system": "Risk", "sync_type": "incremental"}
            },
            {
                "name": "Loan Processing Pipeline",
                "description": "Processes loan applications and payments",
                "external_job_id": "loan_proc_001",
                "job_type": "ETL",
                "schedule": "0 3 * * *",  # Daily at 3 AM
                "is_scheduled": True,
                "job_config": {"source_system": "Loans", "target_schema": "finance"}
            },
            {
                "name": "Compliance Audit Pipeline",
                "description": "Generates compliance reports and logs",
                "external_job_id": "comp_audit_001",
                "job_type": "Analytics",
                "schedule": "0 5 * * *",  # Daily at 5 AM
                "is_scheduled": True,
                "job_config": {"source_system": "Compliance", "report_type": "daily"}
            },
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
            for i in range(7):  # 7 recent runs per job
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
        
 
        # --- Lineage Edges, Impact Analysis, and Column Stats (UNCHANGED) ---
        print("🔗 Creating lineage edges...")
        if len(existing_tables) >= 10 and len(existing_columns) >= 50:
            
            # First, let's create a mapping of table names to table objects for safer access
            table_name_map = {table.name: table for table in existing_tables}
            column_name_map = {}
            
            for column in existing_columns:
                if column.table_id not in column_name_map:
                    column_name_map[column.table_id] = {}
                column_name_map[column.table_id][column.name] = column
            
            # Create more realistic lineage relationships using table names instead of indices
            lineage_relationships = [
                # Customer Management Domain Lineages
                {
                    "source_table": table_name_map["customers"],
                    "target_table": "accounts",
                    "transformation_logic": "SELECT customer_id, account_type FROM customers WHERE kyc_status = 'VERIFIED'",
                    "transformation_type": "filter_projection",
                    "confidence_score": 95,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": None,
                    "target_column": None
                },
                {
                    "source_table": "customers",
                    "target_table": "customer_contacts",
                    "transformation_logic": "Initial insert from Core Banking",
                    "transformation_type": "etl_pipeline",
                    "confidence_score": 85,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": None,
                    "target_column": None
                },
                {
                    "source_table": "sales_activity_log",
                    "target_table": "customer_contacts",
                    "transformation_logic": "Enrich customer contacts with sales CRM data",
                    "transformation_type": "enrichment",
                    "confidence_score": 85,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "customer_id",
                    "target_column": "customer_id"
                },
                {
                    "source_table": "customers",
                    "target_table": "customer_preferences",
                    "transformation_logic": "Copy customer ID and initialize default preferences to MongoDB",
                    "transformation_type": "initialization",
                    "confidence_score": 95,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "customer_id",
                    "target_column": "customer_id"
                },
                {
                    "source_table": "customer_contacts",
                    "target_table": "customer_preferences",
                    "transformation_logic": "Update MongoDB preferences based on contact history",
                    "transformation_type": "update",
                    "confidence_score": 85,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "preferred_contact_method",
                    "target_column": "notification_channel"
                },
                {
                    "source_table": "customers",
                    "target_table": "customer_address_history",
                    "transformation_logic": "CDC: Record address change as a new history entry in RDS",
                    "transformation_type": "cdc",
                    "confidence_score": 98,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "address",
                    "target_column": "old_address"
                },
                
                # Transaction Processing Domain Lineages
                {
                    "source_table": "accounts",
                    "target_table": "transactions",
                    "transformation_logic": "Transaction origination linked to account ID",
                    "transformation_type": "join",
                    "confidence_score": 90,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": None,
                    "target_column": None
                },
                {
                    "source_table": "transactions",
                    "target_table": "payments",
                    "transformation_logic": "Filter transactions of type 'PAYMENT' or derived from recurring schedules",
                    "transformation_type": "filter",
                    "confidence_score": 92,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": None,
                    "target_column": None
                },
                {
                    "source_table": "recurring_transactions",
                    "target_table": "payments",
                    "transformation_logic": "Generate payment records from recurring transaction schedules in MySQL",
                    "transformation_type": "generation",
                    "confidence_score": 90,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "recurring_id",
                    "target_column": "transaction_id" # Assumes a new transaction is generated/logged
                },
                {
                    "source_table": "transactions",
                    "target_table": "transaction_categories",
                    "transformation_logic": "Categorize transactions based on merchant codes (Databricks)",
                    "transformation_type": "classification",
                    "confidence_score": 80,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "description",
                    "target_column": "category_name"
                },
                {
                    "source_table": "transactions",
                    "target_table": "transaction_analytics",
                    "transformation_logic": "Aggregate transaction data into Redshift for BI",
                    "transformation_type": "aggregation",
                    "confidence_score": 88,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "amount",
                    "target_column": "total_volume"
                },
                {
                    "source_table": "transactions",
                    "target_table": "daily_transaction_summary",
                    "transformation_logic": "Aggregate daily transactions to Redshift for summary reports",
                    "transformation_type": "aggregation",
                    "confidence_score": 95,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "amount",
                    "target_column": "total_volume"
                },
                
                # Risk Management Domain Lineages
                {
                    "source_table": "customers",
                    "target_table": "credit_scores",
                    "transformation_logic": "Extract PII/customer data for score calculation in Redshift",
                    "transformation_type": "projection",
                    "confidence_score": 92,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "ssn",
                    "target_column": None
                },
                {
                    "source_table": "transactions",
                    "target_table": "transaction_risk_logs",
                    "transformation_logic": "Real-time risk scoring and logging in Oracle",
                    "transformation_type": "generation",
                    "confidence_score": 92,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "transaction_id",
                    "target_column": "transaction_id"
                },
                {
                    "source_table": "fraud_alerts",
                    "target_table": "transaction_risk_logs",
                    "transformation_logic": "Enrich Oracle logs with fraud alert details (Redshift -> Oracle)",
                    "transformation_type": "enrichment",
                    "confidence_score": 88,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "transaction_id",
                    "target_column": "transaction_id"
                },
                {
                    "source_table": "transaction_risk_logs",
                    "target_table": "risk_scores",
                    "transformation_logic": "Aggregate logs to compute comprehensive risk scores in Redshift",
                    "transformation_type": "aggregation",
                    "confidence_score": 90,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "transaction_id",
                    "target_column": "account_id"
                },
                {
                    "source_table": "compliance_risk_flags",
                    "target_table": "fraud_alerts",
                    "transformation_logic": "Generate fraud alerts from high-severity Databricks risk flags into Redshift",
                    "transformation_type": "generation",
                    "confidence_score": 90,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "customer_id",
                    "target_column": None 
                },

                # Loan Management Domain Lineages
                {
                    "source_table": "customers",
                    "target_table": "loan_applications",
                    "transformation_logic": "Extract customer data for loan underwriting in RDS (PostgreSQL)",
                    "transformation_type": "projection",
                    "confidence_score": 90,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "customer_id",
                    "target_column": "customer_id"
                },
                {
                    "source_table": "loan_applications",
                    "target_table": "loans",
                    "transformation_logic": "WHERE application_status = 'APPROVED' (Final loan creation in RDS)",
                    "transformation_type": "filter",
                    "confidence_score": 92,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "application_status",
                    "target_column": None
                },
                {
                    "source_table": "loans",
                    "target_table": "loan_payments",
                    "transformation_logic": "Record payments against loans in RDS",
                    "transformation_type": "projection",
                    "confidence_score": 97,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "loan_id",
                    "target_column": "loan_id"
                },
                {
                    "source_table": "loans",
                    "target_table": "loan_collateral",
                    "transformation_logic": "Extract collateral details linked to loan in RDS",
                    "transformation_type": "extraction",
                    "confidence_score": 95,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "loan_id",
                    "target_column": "loan_id"
                },
                
                # Finance Domain Lineages
                {
                    "source_table": "financial_journals",
                    "target_table": "financial_reports",
                    "transformation_logic": "Aggregate ERP journals for financial reporting in Redshift (Revenue/Expense)",
                    "transformation_type": "aggregation",
                    "confidence_score": 90,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "debit",
                    "target_column": "revenue" 
                },
                {
                    "source_table": "expense_ledger",
                    "target_table": "financial_reports",
                    "transformation_logic": "SUM(amount) as expenses in Redshift",
                    "transformation_type": "aggregation",
                    "confidence_score": 98,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "amount",
                    "target_column": "expenses"
                },
                {
                    "source_table": "financial_reports",
                    "target_table": "budget_allocations",
                    "transformation_logic": "Derive budget from Redshift reports for Redshift budget table",
                    "transformation_type": "derivation",
                    "confidence_score": 88,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "department",
                    "target_column": "department"
                },
                {
                    "source_table": "treasury_positions",
                    "target_table": "cash_flow_projections",
                    "transformation_logic": "Project cash flows based on Redshift positions",
                    "transformation_type": "projection",
                    "confidence_score": 90,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "amount",
                    "target_column": "inflow_amount"
                },
                
                # Compliance Domain Lineages
                {
                    "source_table": "customers",
                    "target_table": "watchlist_screening",
                    "transformation_logic": "Extract PII for AML watchlist screening in Oracle DB",
                    "transformation_type": "extraction",
                    "confidence_score": 95,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "ssn",
                    "target_column": "customer_id"
                },
                {
                    "source_table": "watchlist_screening",
                    "target_table": "regulatory_filings",
                    "transformation_logic": "Include watchlist hit details in regulatory filings (RDS)",
                    "transformation_type": "enrichment",
                    "confidence_score": 92,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "is_hit",
                    "target_column": None
                },
                {
                    "source_table": "kyc_documents",
                    "target_table": "compliance_risk_flags",
                    "transformation_logic": "Generate compliance risk flags based on KYC verification issues (Databricks)",
                    "transformation_type": "generation",
                    "confidence_score": 90,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "verification_status",
                    "target_column": "flag_type"
                },
                
                # Investment Services Domain Lineages
                {
                    "source_table": "market_data_feed",
                    "target_table": "security_prices",
                    "transformation_logic": "Clean and aggregate S3 raw market data to get daily closing price in Redshift",
                    "transformation_type": "aggregation",
                    "confidence_score": 92,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "bid_price",
                    "target_column": "closing_price"
                },
                {
                    "source_table": "security_prices",
                    "target_table": "portfolio_performance",
                    "transformation_logic": "Use closing prices to re-value portfolios in PostgreSQL",
                    "transformation_type": "calculation",
                    "confidence_score": 95,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "closing_price",
                    "target_column": "return_percentage"
                },
                
                # Operations Domain Lineages
                {
                    "source_table": "transactions",
                    "target_table": "atm_transactions",
                    "transformation_logic": "Filter transactions for ATM-specific activities (Databricks)",
                    "transformation_type": "filter",
                    "confidence_score": 95,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "transaction_id",
                    "target_column": "transaction_id"
                },
                {
                    "source_table": "atm_transactions",
                    "target_table": "settlements",
                    "transformation_logic": "Generate settlement records from Databricks ATM logs to MySQL",
                    "transformation_type": "generation",
                    "confidence_score": 92,
                    "lineage_type": "TABLE_TO_TABLE",
                    "source_column": "transaction_id",
                    "target_column": "transaction_id"
                },

                # Column-level lineages (Representative Sample)
                {
                    "source_table": "customers",
                    "target_table": "accounts",
                    "transformation_logic": "Direct mapping",
                    "transformation_type": "copy",
                    "confidence_score": 100,
                    "lineage_type": "COLUMN_TO_COLUMN",
                    "source_column": "customer_id",
                    "target_column": "customer_id"
                },
                {
                    "source_table": "accounts",
                    "target_table": "transactions",
                    "transformation_logic": "Direct mapping",
                    "transformation_type": "copy",
                    "confidence_score": 100,
                    "lineage_type": "COLUMN_TO_COLUMN",
                    "source_column": "account_id",
                    "target_column": "account_id"
                },
                {
                    "source_table": "transactions",
                    "target_table": "financial_reports",
                    "transformation_logic": "SUM(amount) as revenue in Redshift",
                    "transformation_type": "aggregation",
                    "confidence_score": 98,
                    "lineage_type": "COLUMN_TO_COLUMN",
                    "source_column": "amount",
                    "target_column": "revenue"
                },
            ]
                
            # Now safely create the edges
            for rel in lineage_relationships:
                # --- PREVIOUS FIX FOR TABLES ---
                # If the table is a string, look it up in the map
                if isinstance(rel["source_table"], str):
                    rel["source_table"] = table_name_map.get(rel["source_table"])
                if isinstance(rel["target_table"], str):
                    rel["target_table"] = table_name_map.get(rel["target_table"])

                # Skip if source or target table doesn't exist after lookup
                if not rel["source_table"] or not rel["target_table"]:
                    print(f"⚠️  Skipping lineage: missing table for a relationship.")
                    continue

                # --- NEW FIX FOR COLUMNS ---
                if isinstance(rel.get("source_column"), str):
                    source_table_id = rel["source_table"].id
                    column_name = rel["source_column"]
                    rel["source_column"] = column_name_map.get(source_table_id, {}).get(column_name)

                if isinstance(rel.get("target_column"), str):
                    target_table_id = rel["target_table"].id
                    column_name = rel["target_column"]
                    rel["target_column"] = column_name_map.get(target_table_id, {}).get(column_name)
                    
                edge = LineageEdge(
                    source_table_id=rel["source_table"].id,
                    target_table_id=rel["target_table"].id,
                    source_column_id=rel["source_column"].id if rel["source_column"] else None,
                    target_column_id=rel["target_column"].id if rel["target_column"] else None,
                    lineage_type=rel["lineage_type"],
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
            # This print statement is only executed once, using the last rel object
            print(f"✅ Created lineage: {rel['source_table'].name} -> {rel['target_table'].name}") 

        # Create lineage impact analysis
        print("📊 Creating lineage impact analysis...")
        for table in existing_tables:  # For all tables
            analysis = LineageImpactAnalysis(
                table_id=table.id,
                upstream_table_count=random.randint(0, 5),
                upstream_column_count=random.randint(0, 15),
                max_upstream_depth=random.randint(1, 4),
                downstream_table_count=random.randint(1, 7),
                downstream_column_count=random.randint(5, 25),
                max_downstream_depth=random.randint(1, 5),
                is_critical_path=random.choice([True, False]),
                criticality_score=random.randint(1, 10),
                impact_radius=random.randint(1, 20),
                upstream_tables=[{"id": t.id, "name": t.name} for t in existing_tables[:3]],
                downstream_tables=[{"id": t.id, "name": t.name} for t in existing_tables[3:7]],
                analysis_version="1.0"
            )
            db.add(analysis)
        
        # Create column statistics for existing columns
        print("📈 Creating column statistics...")
        for column in existing_columns:  # For all columns
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
        
        # --- Quality Rules (EXPANDED TO ALL TABLES) ---
        
        print("✅ Creating quality rules for ALL TABLES...")
        quality_rules = []
        rule_id_counter = 1 
        
        # Fetch the original column metadata for reliable PK/column finding
        all_table_metadata = db.query(Table, Column).join(Column).all()
        table_to_column_data = {}
        for table, column in all_table_metadata:
             if table.id not in table_to_column_data:
                 table_to_column_data[table.id] = []
             table_to_column_data[table.id].append({
                 "name": column.name,
                 "data_type": column.data_type,
                 "is_primary_key": column.is_primary_key
             })
        
        
        for table in existing_tables:
            table_column_data = table_to_column_data.get(table.id, [])
            if not table_column_data:
                continue

            # Use the local helper function defined above to get column info
            pk_column = get_pk_or_first_column({"columns": table_column_data})
            amount_col = next((c["name"] for c in table_column_data if "amount" in c["name"].lower() or "balance" in c["name"].lower()), None)
            date_cols = [c["name"] for c in table_column_data if "date" in c["name"].lower() or "timestamp" in c["name"].lower()]
            freshness_col = date_cols[0] if date_cols else None 

            # 1. COMPLETENESS (NULL CHECK on PK/First Column) - CRITICAL
            quality_rules.append({
                "name": f"{table.name[:15]} - PK Not Null",
                "description": f"Mandatory check for NULLs on {pk_column['name']}",
                "table": table,
                "rule_type": "NULL_CHECK",
                "rule_config": {"column": pk_column["name"]},
                "severity": "CRITICAL",
                "is_blocking": True
            })

            # 2. UNIQUENESS (UNIQUE CHECK on PK/First Column) - CRITICAL
            if pk_column["type"] == "PK":
                quality_rules.append({
                    "name": f"{table.name[:15]} - PK Uniqueness",
                    "description": f"Primary Key uniqueness check on {pk_column['name']}",
                    "table": table,
                    "rule_type": "UNIQUE_CHECK",
                    "rule_config": {"column": pk_column["name"]},
                    "severity": "CRITICAL",
                    "is_blocking": True
                })

            # 3. TIMELINESS (FRESHNESS Check) - MEDIUM
            if freshness_col:
                quality_rules.append({
                    "name": f"{table.name[:15]} - Freshness",
                    "description": f"Data must be updated within the last 72 hours using {freshness_col}",
                    "table": table,
                    "rule_type": "FRESHNESS",
                    "rule_config": {"column": freshness_col, "max_age_hours": 72},
                    "severity": "MEDIUM",
                    "is_blocking": False
                })
            
            # 4. VALIDITY (RANGE Check - on amount columns) - HIGH
            if amount_col:
                 quality_rules.append({
                    "name": f"{table.name[:15]} - Amount Positive",
                    "description": f"Check that {amount_col} is non-negative.",
                    "table": table,
                    "rule_type": "RANGE_CHECK",
                    "rule_config": {"column": amount_col, "min_value": 0},
                    "severity": "HIGH",
                    "is_blocking": False
                })
            
            # 5. CONSISTENCY (Placeholder rule for Consistency dimension) - MEDIUM
            if len(date_cols) >= 2:
                quality_rules.append({
                    "name": f"{table.name[:15]} - Date Consistency",
                    "description": f"Check that {date_cols[0]} is before {date_cols[1]}",
                    "table": table,
                    "rule_type": "CONSISTENCY",
                    "rule_config": {"columns": [date_cols[0], date_cols[1]], "logic": f"{date_cols[0]} < {date_cols[1]}"},
                    "severity": "MEDIUM",
                    "is_blocking": False
                })

            # 6. ACCURACY (Placeholder rule for Accuracy dimension) - MEDIUM
            if amount_col:
                quality_rules.append({
                    "name": f"{table.name[:15]} - Accuracy Sum",
                    "description": f"Verify {amount_col} sum is within historical deviation",
                    "table": table,
                    "rule_type": "CUSTOM_SQL",
                    "rule_config": {"sql": f"SELECT SUM({amount_col}) FROM {table.name} WHERE TRUE"},
                    "severity": "MEDIUM",
                    "is_blocking": False
                })
        
        rule_map = {}
        for rule_data in quality_rules:
            if rule_data["table"]:
                # Re-fetch the table object to ensure it's in the current session
                table_obj = db.query(Table).get(rule_data["table"].id)
                
                rule = QualityRule(
                    id=rule_id_counter, # Force ID to be sequential and unique
                    name=rule_data["name"],
                    description=rule_data["description"],
                    table_id=table_obj.id,
                    rule_type=rule_data["rule_type"],
                    rule_config=rule_data["rule_config"],
                    severity=rule_data["severity"],
                    is_active=True,
                    is_blocking=rule_data.get("is_blocking", False),
                    check_frequency="daily",
                    created_by=random.choice(existing_users).id,
                    owner_id=random.choice(existing_users).id
                )
                db.add(rule)
                db.flush()
                rule_map[rule_data["name"]] = rule
                rule_id_counter += 1


        # --- Quality Results (CONTROLLED FAILURE LOGIC) ---
        
        # Rule Types that MUST PASS the latest run to ensure non-zero dimension scores
        GUARANTEED_PASS_RULE_TYPES = [
            "UNIQUE_CHECK", "CUSTOM_SQL", "FRESHNESS", "CONSISTENCY", 
            "REFERENCE_CHECK", "FORMAT_CHECK"
        ]

        # Target IDs for deliberate dashboard metric failure scenarios
        CRITICAL_FAILURE_RULE = next((r for r in rule_map.values() if r.rule_type == 'NULL_CHECK' and r.severity == 'CRITICAL'), None)
        WARNING_FAILURE_RULE = next((r for r in rule_map.values() if r.rule_type == 'RANGE_CHECK' and r.severity == 'HIGH'), None)
        
        
        print(f"📊 Creating {len(rule_map)} quality results with controlled scenario failures...")
        
        for rule in rule_map.values():
            rule_type_str = rule.rule_type 
            
            for i in range(10):  # 10 days of results
                
                is_latest_run = (i == 0)
                result_status = "PASSED"
                result_score = random.uniform(0.90, 1.0) # Default score range
                
                if is_latest_run:
                    # SCENARIO A: Force the CRITICAL failure (for Critical Unresolved Alerts metric)
                    if CRITICAL_FAILURE_RULE and rule.id == CRITICAL_FAILURE_RULE.id: 
                        result_status = "FAILED"
                        result_score = random.uniform(0.70, 0.79) # Low score
                    
                    # SCENARIO B: Force the HIGH warning (for Tables with Issues metric)
                    elif WARNING_FAILURE_RULE and rule.id == WARNING_FAILURE_RULE.id: 
                        result_status = "WARNING"
                        result_score = random.uniform(0.80, 0.89) # Medium score
                    
                    # SCENARIO C: Force all other core dimensions to PASS (to ensure non-zero dimension scores)
                    elif rule_type_str in GUARANTEED_PASS_RULE_TYPES:
                        result_status = "PASSED"
                        result_score = random.uniform(0.95, 0.999) # Very high score
                    
                    # Default for any other scenario
                    else:
                         result_status = "PASSED"
                         result_score = random.uniform(0.90, 0.99)
                    
                else:
                    # HISTORICAL RUN LOGIC (i > 0): Keep historical data randomized
                    result_status = random.choice(["PASSED", "PASSED", "PASSED", "WARNING", "FAILED"])
                    if result_status != "PASSED":
                         result_score = random.uniform(0.70, 0.90)
                    else:
                         result_score = random.uniform(0.90, 1.0)
                
                
                result = QualityResult(
                    rule_id=rule.id,
                    check_id=f"check_{rule.id}_{datetime.utcnow().strftime('%Y%m%d')}_{i:03d}",
                    started_at=datetime.utcnow() - timedelta(days=i+1),
                    completed_at=datetime.utcnow() - timedelta(days=i+1) + timedelta(minutes=random.randint(1, 30)),
                    status=result_status, 
                    score=result_score,
                    passed_count=random.randint(800, 1000) if result_status == "PASSED" else random.randint(700, 800),
                    failed_count=random.randint(1, 50) if result_status != "PASSED" else 0,
                    total_count=random.randint(850, 1000),
                    measured_value=str(result_score),
                    expected_value="1.0",
                    execution_context={"check_type": "automated", "version": "1.0"}
                )
                db.add(result)
                db.flush()
                
                # Create alerts for failed results
                if result.status != "PASSED" and is_latest_run:
                    
                    # Determine resolved status: Force CRITICAL alerts to be UNRESOLVED for dashboard metric
                    is_resolved_status = False if rule.severity == 'CRITICAL' else True
                    
                    alert = QualityAlert(
                        rule_id=rule.id,
                        result_id=result.id,
                        alert_type="QUALITY_FAILURE",
                        severity=rule.severity,
                        message=f"Quality rule '{rule.name}' failed with status {result.status} ({int((1 - result.score) * 100)}% failure rate).",
                        recipients=[f"admin@bank.com", f"dq-team@bank.com"],
                        is_resolved=is_resolved_status, # Controlled failure for dashboard metric
                        notification_sent=True,
                        notification_sent_at=result.completed_at + timedelta(minutes=5)
                    )
                    db.add(alert)
        
        # --- Data Retention Policies (UNCHANGED) ---
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
                "applies_to_domains": ["Operations"],
                "regulatory_basis": "Internal audit requirements"
            },
            {
                "name": "Compliance Data Policy",
                "description": "Compliance records retained for 5 years",
                "retention_period_days": 1825,  # 5 years
                "applies_to_tags": ["Compliance"],
                "regulatory_basis": "AML regulations"
            },
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
        
        # --- Access Requests (UNCHANGED) ---
        print("🔐 Creating access requests...")
        for i in range(20):
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
        
        # --- Compliance Reports (UNCHANGED) ---
        print("📋 Creating compliance reports...")
        compliance_reports = [
            {
                "name": "Q4 2024 GDPR Compliance Report",
                "report_type": "GDPR_COMPLIANCE",
                "period_start": datetime(2024, 10, 1),
                "period_end": datetime(2024, 12, 31),
                "scope_domains": ["Customer Management", "Compliance"],
                "status": "completed"
            },
            {
                "name": "SOX Controls Assessment 2024",
                "report_type": "SOX_COMPLIANCE",
                "period_start": datetime(2024, 1, 1), 
                "period_end": datetime(2024, 12, 31),
                "scope_domains": ["Finance"],
                "status": "in_progress"
            },
            {
                "name": "AML Annual Report 2024",
                "report_type": "AML_COMPLIANCE",
                "period_start": datetime(2024, 1, 1),
                "period_end": datetime(2024, 12, 31),
                "scope_domains": ["Risk Management", "Compliance"],
                "status": "completed"
            },
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
        
        # --- Audit Logs (UNCHANGED) ---
        print("📝 Creating audit logs...")
        actions = ["CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "SEARCH", "TAG_ADD"]
        resource_types = ["TABLE", "DOMAIN", "TAG", "USER", "DATA_SOURCE"]
        
        for i in range(100):
            log = AuditLog(
                user_id=random.choice(existing_users).id,
                action=random.choice(actions),
                resource_type=random.choice(resource_types),
                resource_id=random.randint(1, 50),
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
        print(f"  • Access Requests: 20")
        print(f"  • Audit Logs: 100")
        
        print("\n🔗 Lineage Relationships Created:")
        print(f"  • {len(lineage_relationships) if 'lineage_relationships' in locals() else 0} lineage edges (table and column level)")
        print(f"  • Impact analysis for {len(existing_tables)} tables")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating comprehensive seed data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_comprehensive_seed_data()








# import sys
# import os
# sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# from datetime import datetime, timedelta
# import random
# import uuid
# import json
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy import create_engine

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
#         print("🚀 Creating comprehensive seed data for MetaPortal...")
        
#         # Get existing data
#         existing_users = db.query(User).all()
#         existing_domains = db.query(Domain).all()
#         existing_data_sources = db.query(DataSource).all()
#         existing_tables = db.query(Table).all()
#         existing_columns = db.query(Column).all()
#         existing_tags = db.query(Tag).all()
        
#         print(f"📊 Found existing data: {len(existing_users)} users, {len(existing_domains)} domains, {len(existing_data_sources)} data sources, {len(existing_tables)} tables")
        
#         if not existing_users:
#             print("❌ No existing users found. Please run the basic sample data script first.")
#             return
        
#         # Create data classifications
#         print("🏷️ Creating data classifications...")
#         classifications = [
#             {
#                 "name": "PII - Personal Identifiable Information",
#                 "description": "Data that can be used to identify a specific individual",
#                 "pattern": r".*(?:ssn|social|passport|license|customer_id|name|email|phone|address).*",
#                 "sensitivity_level": "RESTRICTED",
#                 "pii_category": "Direct Identifier",
#                 "compliance_tags": ["GDPR", "CCPA", "PCI"],
#                 "auto_apply": True
#             },
#             {
#                 "name": "Financial Data",
#                 "description": "Financial information including balances, transactions, revenue",
#                 "pattern": r".*(?:balance|amount|revenue|expense|profit|payment|loan|investment).*",
#                 "sensitivity_level": "CONFIDENTIAL",
#                 "pii_category": None,
#                 "compliance_tags": ["SOX", "Financial"],
#                 "auto_apply": True
#             },
#             {
#                 "name": "Customer Data",
#                 "description": "Customer information and preferences",
#                 "pattern": r".*(?:customer|account|kyc).*",
#                 "sensitivity_level": "CONFIDENTIAL",
#                 "pii_category": "Quasi Identifier",
#                 "compliance_tags": ["GDPR", "Customer Privacy"],
#                 "auto_apply": True
#             },
#             {
#                 "name": "Operational Metrics",
#                 "description": "Business operational data and KPIs",
#                 "pattern": r".*(?:metric|kpi|performance|status|log).*",
#                 "sensitivity_level": "INTERNAL",
#                 "pii_category": None,
#                 "compliance_tags": ["Business Intelligence"],
#                 "auto_apply": False
#             },
#             {
#                 "name": "Public Reference Data",
#                 "description": "Publicly available reference information",
#                 "pattern": r".*(?:currency|country|type|category).*",
#                 "sensitivity_level": "PUBLIC",
#                 "pii_category": None,
#                 "compliance_tags": [],
#                 "auto_apply": True
#             },
#             {
#                 "name": "Risk Data",
#                 "description": "Risk assessment and fraud data",
#                 "pattern": r".*(?:risk|fraud|score|alert).*",
#                 "sensitivity_level": "RESTRICTED",
#                 "pii_category": None,
#                 "compliance_tags": ["AML", "Fraud Prevention"],
#                 "auto_apply": True
#             },
#         ]
        
#         classification_map = {}
#         for class_data in classifications:
#             compliance_tags_json = json.dumps(class_data["compliance_tags"])
#             classification = DataClassification(
#                 name=class_data["name"],
#                 description=class_data["description"],
#                 pattern=class_data["pattern"],
#                 sensitivity_level=class_data["sensitivity_level"],
#                 pii_category=class_data["pii_category"],
#                 # compliance_tags=class_data["compliance_tags"],
#                 compliance_tags=compliance_tags_json,
#                 is_active=True,
#                 auto_apply=class_data["auto_apply"]
#             )
#             db.add(classification)
#             db.flush()
#             classification_map[class_data["name"]] = classification
        
#         # Create quality dimensions
#         print("📏 Creating quality dimensions...")
#         quality_dimensions = [
#             {"name": "Completeness", "description": "Percentage of non-null values", "category": "Validity", "weight": 0.3},
#             {"name": "Accuracy", "description": "Correctness of data values", "category": "Validity", "weight": 0.25},
#             {"name": "Consistency", "description": "Data consistency across systems", "category": "Validity", "weight": 0.2},
#             {"name": "Timeliness", "description": "How up-to-date the data is", "category": "Currency", "weight": 0.15},
#             {"name": "Uniqueness", "description": "Absence of duplicate records", "category": "Validity", "weight": 0.1},
#             {"name": "Validity", "description": "Conformance to defined business rules", "category": "Validity", "weight": 0.2},
#             {"name": "Integrity", "description": "Referential integrity checks", "category": "Validity", "weight": 0.15},
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
#                 "term": "Customer Lifetime Value",
#                 "definition": "The predicted net profit attributed to the entire future relationship with a customer",
#                 "business_definition": "A key metric for customer profitability and retention strategies",
#                 "technical_definition": "SUM(transactions.amount) + projected_future_value - acquisition_cost",
#                 "category": "Customer Management",
#                 "synonyms": "CLV, Lifetime Value",
#                 "domain": existing_domains[0] if existing_domains else None
#             },
#             {
#                 "term": "Loan-to-Value Ratio",
#                 "definition": "The ratio of the loan amount to the appraised value of the asset",
#                 "business_definition": "A risk assessment metric for lending decisions",
#                 "technical_definition": "loan.principal_amount / asset_appraised_value * 100",
#                 "category": "Loan Management",
#                 "synonyms": "LTV Ratio",
#                 "domain": existing_domains[3] if len(existing_domains) > 3 else None
#             },
#             {
#                 "term": "Fraud Detection Score",
#                 "definition": "A numerical score indicating the likelihood of fraudulent activity",
#                 "business_definition": "Used to flag potentially fraudulent transactions for review",
#                 "technical_definition": "ML model output between 0-1 based on transaction features",
#                 "category": "Risk Management",
#                 "synonyms": "Fraud Score, Risk Score",
#                 "domain": existing_domains[2] if len(existing_domains) > 2 else None
#             },
#             {
#                 "term": "Net Interest Margin",
#                 "definition": "The difference between interest income generated and interest paid",
#                 "business_definition": "A profitability metric for banking operations",
#                 "technical_definition": "(interest_income - interest_expense) / average_earning_assets",
#                 "category": "Finance",
#                 "synonyms": "NIM",
#                 "domain": existing_domains[4] if len(existing_domains) > 4 else None
#             },
#             {
#                 "term": "KYC Verification",
#                 "definition": "Know Your Customer process for identity verification",
#                 "business_definition": "Regulatory requirement to prevent money laundering",
#                 "technical_definition": "Verification of customer documents and data against standards",
#                 "category": "Compliance",
#                 "synonyms": "Customer Due Diligence, CDD",
#                 "domain": existing_domains[5] if len(existing_domains) > 5 else None
#             },
#         ]
        
#         for term_data in glossary_terms:
#             term = BusinessGlossary(
#                 term=term_data["term"],
#                 definition=term_data["definition"],
#                 business_definition=term_data["business_definition"],
#                 technical_definition=term_data["technical_definition"],
#                 owner_id=random.choice(existing_users).id,
#                 approved_by=random.choice(existing_users).id,
#                 is_approved=True,
#                 synonyms=term_data["synonyms"],
#                 category=term_data["category"],
#                 domain_id=term_data["domain"].id if term_data["domain"] else None,
#                 is_active=True,
#                 approved_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
#             )
#             db.add(term)
        
#         # Create lineage jobs
#         print("🔄 Creating lineage jobs...")
#         lineage_jobs = [
#             {
#                 "name": "Customer Data ETL Pipeline",
#                 "description": "Daily ETL job that processes customer profile data",
#                 "external_job_id": "cust_etl_001",
#                 "job_type": "ETL",
#                 "schedule": "0 2 * * *",  # Daily at 2 AM
#                 "is_scheduled": True,
#                 "job_config": {"source_system": "Core", "target_schema": "customers", "batch_size": 10000}
#             },
#             {
#                 "name": "Transaction Analytics Pipeline",
#                 "description": "Processes transaction and payment data",
#                 "external_job_id": "trans_analytics_001",
#                 "job_type": "Analytics",
#                 "schedule": "0 4 * * *",  # Daily at 4 AM
#                 "is_scheduled": True,
#                 "job_config": {"source_system": "Transactions", "target_schema": "analytics", "aggregation_level": "daily"}
#             },
#             {
#                 "name": "Risk Data Sync",
#                 "description": "Syncs risk assessment data with operational systems",
#                 "external_job_id": "risk_sync_001",
#                 "job_type": "Sync",
#                 "schedule": "0 */2 * * *",  # Every 2 hours
#                 "is_scheduled": True,
#                 "job_config": {"source_system": "Risk", "sync_type": "incremental"}
#             },
#             {
#                 "name": "Loan Processing Pipeline",
#                 "description": "Processes loan applications and payments",
#                 "external_job_id": "loan_proc_001",
#                 "job_type": "ETL",
#                 "schedule": "0 3 * * *",  # Daily at 3 AM
#                 "is_scheduled": True,
#                 "job_config": {"source_system": "Loans", "target_schema": "finance"}
#             },
#             {
#                 "name": "Compliance Audit Pipeline",
#                 "description": "Generates compliance reports and logs",
#                 "external_job_id": "comp_audit_001",
#                 "job_type": "Analytics",
#                 "schedule": "0 5 * * *",  # Daily at 5 AM
#                 "is_scheduled": True,
#                 "job_config": {"source_system": "Compliance", "report_type": "daily"}
#             },
#         ]
        
#         job_map = {}
#         for job_data in lineage_jobs:
#             job = LineageJob(
#                 name=job_data["name"],
#                 description=job_data["description"],
#                 external_job_id=job_data["external_job_id"],
#                 job_type=job_data["job_type"],
#                 schedule=job_data["schedule"],
#                 is_scheduled=job_data["is_scheduled"],
#                 last_run_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
#                 next_run_at=datetime.utcnow() + timedelta(hours=random.randint(1, 24)),
#                 last_run_status="success",
#                 job_config=job_data["job_config"],
#                 owner_id=random.choice(existing_users).id,
#                 is_active=True
#             )
#             db.add(job)
#             db.flush()
#             job_map[job_data["name"]] = job
        
#         # Create lineage job runs
#         print("▶️ Creating lineage job runs...")
#         for job in job_map.values():
#             for i in range(7):  # 7 recent runs per job
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
        
 
#         # Create lineage edges to show data flow relationships (table-to-table and column-to-column)
#         print("🔗 Creating lineage edges...")
#         if len(existing_tables) >= 10 and len(existing_columns) >= 50:
            
#             # First, let's create a mapping of table names to table objects for safer access
#             table_name_map = {table.name: table for table in existing_tables}
#             column_name_map = {}
            
#             for column in existing_columns:
#                 if column.table_id not in column_name_map:
#                     column_name_map[column.table_id] = {}
#                 column_name_map[column.table_id][column.name] = column
            
#             # Create more realistic lineage relationships using table names instead of indices
#             lineage_relationships = [
#                 # Customer Management Domain Lineages
#                 {
#                     "source_table": table_name_map["customers"],
#                     "target_table": "accounts",
#                     "transformation_logic": "SELECT customer_id, account_type FROM customers WHERE kyc_status = 'VERIFIED'",
#                     "transformation_type": "filter_projection",
#                     "confidence_score": 95,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": None,
#                     "target_column": None
#                 },
#                 {
#                     "source_table": "customers",
#                     "target_table": "customer_contacts",
#                     "transformation_logic": "Initial insert from Core Banking",
#                     "transformation_type": "etl_pipeline",
#                     "confidence_score": 85,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": None,
#                     "target_column": None
#                 },
#                 {
#                     "source_table": "sales_activity_log",
#                     "target_table": "customer_contacts",
#                     "transformation_logic": "Enrich customer contacts with sales CRM data",
#                     "transformation_type": "enrichment",
#                     "confidence_score": 85,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "customer_id",
#                     "target_column": "customer_id"
#                 },
#                 {
#                     "source_table": "customers",
#                     "target_table": "customer_preferences",
#                     "transformation_logic": "Copy customer ID and initialize default preferences to MongoDB",
#                     "transformation_type": "initialization",
#                     "confidence_score": 95,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "customer_id",
#                     "target_column": "customer_id"
#                 },
#                 {
#                     "source_table": "customer_contacts",
#                     "target_table": "customer_preferences",
#                     "transformation_logic": "Update MongoDB preferences based on contact history",
#                     "transformation_type": "update",
#                     "confidence_score": 85,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "preferred_contact_method",
#                     "target_column": "notification_channel"
#                 },
#                 {
#                     "source_table": "customers",
#                     "target_table": "customer_address_history",
#                     "transformation_logic": "CDC: Record address change as a new history entry in RDS",
#                     "transformation_type": "cdc",
#                     "confidence_score": 98,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "address",
#                     "target_column": "old_address"
#                 },
                
#                 # Transaction Processing Domain Lineages
#                 {
#                     "source_table": "accounts",
#                     "target_table": "transactions",
#                     "transformation_logic": "Transaction origination linked to account ID",
#                     "transformation_type": "join",
#                     "confidence_score": 90,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": None,
#                     "target_column": None
#                 },
#                 {
#                     "source_table": "transactions",
#                     "target_table": "payments",
#                     "transformation_logic": "Filter transactions of type 'PAYMENT' or derived from recurring schedules",
#                     "transformation_type": "filter",
#                     "confidence_score": 92,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": None,
#                     "target_column": None
#                 },
#                 {
#                     "source_table": "recurring_transactions",
#                     "target_table": "payments",
#                     "transformation_logic": "Generate payment records from recurring transaction schedules in MySQL",
#                     "transformation_type": "generation",
#                     "confidence_score": 90,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "recurring_id",
#                     "target_column": "transaction_id" # Assumes a new transaction is generated/logged
#                 },
#                 {
#                     "source_table": "transactions",
#                     "target_table": "transaction_categories",
#                     "transformation_logic": "Categorize transactions based on merchant codes (Databricks)",
#                     "transformation_type": "classification",
#                     "confidence_score": 80,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "description",
#                     "target_column": "category_name"
#                 },
#                 {
#                     "source_table": "transactions",
#                     "target_table": "transaction_analytics",
#                     "transformation_logic": "Aggregate transaction data into Redshift for BI",
#                     "transformation_type": "aggregation",
#                     "confidence_score": 88,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "amount",
#                     "target_column": "total_volume"
#                 },
#                 {
#                     "source_table": "transactions",
#                     "target_table": "daily_transaction_summary",
#                     "transformation_logic": "Aggregate daily transactions to Redshift for summary reports",
#                     "transformation_type": "aggregation",
#                     "confidence_score": 95,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "amount",
#                     "target_column": "total_volume"
#                 },
                
#                 # Risk Management Domain Lineages
#                 {
#                     "source_table": "customers",
#                     "target_table": "credit_scores",
#                     "transformation_logic": "Extract PII/customer data for score calculation in Redshift",
#                     "transformation_type": "projection",
#                     "confidence_score": 92,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "ssn",
#                     "target_column": None
#                 },
#                 {
#                     "source_table": "transactions",
#                     "target_table": "transaction_risk_logs",
#                     "transformation_logic": "Real-time risk scoring and logging in Oracle",
#                     "transformation_type": "generation",
#                     "confidence_score": 92,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "transaction_id",
#                     "target_column": "transaction_id"
#                 },
#                 {
#                     "source_table": "fraud_alerts",
#                     "target_table": "transaction_risk_logs",
#                     "transformation_logic": "Enrich Oracle logs with fraud alert details (Redshift -> Oracle)",
#                     "transformation_type": "enrichment",
#                     "confidence_score": 88,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "transaction_id",
#                     "target_column": "transaction_id"
#                 },
#                 {
#                     "source_table": "transaction_risk_logs",
#                     "target_table": "risk_scores",
#                     "transformation_logic": "Aggregate logs to compute comprehensive risk scores in Redshift",
#                     "transformation_type": "aggregation",
#                     "confidence_score": 90,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "transaction_id",
#                     "target_column": "account_id"
#                 },
#                 {
#                     "source_table": "compliance_risk_flags",
#                     "target_table": "fraud_alerts",
#                     "transformation_logic": "Generate fraud alerts from high-severity Databricks risk flags into Redshift",
#                     "transformation_type": "generation",
#                     "confidence_score": 90,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "customer_id",
#                     "target_column": None 
#                 },

#                 # Loan Management Domain Lineages
#                 {
#                     "source_table": "customers",
#                     "target_table": "loan_applications",
#                     "transformation_logic": "Extract customer data for loan underwriting in RDS (PostgreSQL)",
#                     "transformation_type": "projection",
#                     "confidence_score": 90,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "customer_id",
#                     "target_column": "customer_id"
#                 },
#                 {
#                     "source_table": "loan_applications",
#                     "target_table": "loans",
#                     "transformation_logic": "WHERE application_status = 'APPROVED' (Final loan creation in RDS)",
#                     "transformation_type": "filter",
#                     "confidence_score": 92,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "application_status",
#                     "target_column": None
#                 },
#                 {
#                     "source_table": "loans",
#                     "target_table": "loan_payments",
#                     "transformation_logic": "Record payments against loans in RDS",
#                     "transformation_type": "projection",
#                     "confidence_score": 97,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "loan_id",
#                     "target_column": "loan_id"
#                 },
#                 {
#                     "source_table": "loans",
#                     "target_table": "loan_collateral",
#                     "transformation_logic": "Extract collateral details linked to loan in RDS",
#                     "transformation_type": "extraction",
#                     "confidence_score": 95,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "loan_id",
#                     "target_column": "loan_id"
#                 },
                
#                 # Finance Domain Lineages
#                 {
#                     "source_table": "financial_journals",
#                     "target_table": "financial_reports",
#                     "transformation_logic": "Aggregate ERP journals for financial reporting in Redshift (Revenue/Expense)",
#                     "transformation_type": "aggregation",
#                     "confidence_score": 90,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "debit",
#                     "target_column": "revenue" 
#                 },
#                 {
#                     "source_table": "expense_ledger",
#                     "target_table": "financial_reports",
#                     "transformation_logic": "SUM(amount) as expenses in Redshift",
#                     "transformation_type": "aggregation",
#                     "confidence_score": 98,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "amount",
#                     "target_column": "expenses"
#                 },
#                 {
#                     "source_table": "financial_reports",
#                     "target_table": "budget_allocations",
#                     "transformation_logic": "Derive budget from Redshift reports for Redshift budget table",
#                     "transformation_type": "derivation",
#                     "confidence_score": 88,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "department",
#                     "target_column": "department"
#                 },
#                 {
#                     "source_table": "treasury_positions",
#                     "target_table": "cash_flow_projections",
#                     "transformation_logic": "Project cash flows based on Redshift positions",
#                     "transformation_type": "projection",
#                     "confidence_score": 90,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "amount",
#                     "target_column": "inflow_amount"
#                 },
                
#                 # Compliance Domain Lineages
#                 {
#                     "source_table": "customers",
#                     "target_table": "watchlist_screening",
#                     "transformation_logic": "Extract PII for AML watchlist screening in Oracle DB",
#                     "transformation_type": "extraction",
#                     "confidence_score": 95,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "ssn",
#                     "target_column": "customer_id"
#                 },
#                 {
#                     "source_table": "watchlist_screening",
#                     "target_table": "regulatory_filings",
#                     "transformation_logic": "Include watchlist hit details in regulatory filings (RDS)",
#                     "transformation_type": "enrichment",
#                     "confidence_score": 92,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "is_hit",
#                     "target_column": None
#                 },
#                 {
#                     "source_table": "kyc_documents",
#                     "target_table": "compliance_risk_flags",
#                     "transformation_logic": "Generate compliance risk flags based on KYC verification issues (Databricks)",
#                     "transformation_type": "generation",
#                     "confidence_score": 90,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "verification_status",
#                     "target_column": "flag_type"
#                 },
                
#                 # Investment Services Domain Lineages
#                 {
#                     "source_table": "market_data_feed",
#                     "target_table": "security_prices",
#                     "transformation_logic": "Clean and aggregate S3 raw market data to get daily closing price in Redshift",
#                     "transformation_type": "aggregation",
#                     "confidence_score": 92,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "bid_price",
#                     "target_column": "closing_price"
#                 },
#                 {
#                     "source_table": "security_prices",
#                     "target_table": "portfolio_performance",
#                     "transformation_logic": "Use closing prices to re-value portfolios in PostgreSQL",
#                     "transformation_type": "calculation",
#                     "confidence_score": 95,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "closing_price",
#                     "target_column": "return_percentage"
#                 },
                
#                 # Operations Domain Lineages
#                 {
#                     "source_table": "transactions",
#                     "target_table": "atm_transactions",
#                     "transformation_logic": "Filter transactions for ATM-specific activities (Databricks)",
#                     "transformation_type": "filter",
#                     "confidence_score": 95,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "transaction_id",
#                     "target_column": "transaction_id"
#                 },
#                 {
#                     "source_table": "atm_transactions",
#                     "target_table": "settlements",
#                     "transformation_logic": "Generate settlement records from Databricks ATM logs to MySQL",
#                     "transformation_type": "generation",
#                     "confidence_score": 92,
#                     "lineage_type": "TABLE_TO_TABLE",
#                     "source_column": "transaction_id",
#                     "target_column": "transaction_id"
#                 },

#                 # Column-level lineages (Representative Sample)
#                 {
#                     "source_table": "customers",
#                     "target_table": "accounts",
#                     "transformation_logic": "Direct mapping",
#                     "transformation_type": "copy",
#                     "confidence_score": 100,
#                     "lineage_type": "COLUMN_TO_COLUMN",
#                     "source_column": "customer_id",
#                     "target_column": "customer_id"
#                 },
#                 {
#                     "source_table": "accounts",
#                     "target_table": "transactions",
#                     "transformation_logic": "Direct mapping",
#                     "transformation_type": "copy",
#                     "confidence_score": 100,
#                     "lineage_type": "COLUMN_TO_COLUMN",
#                     "source_column": "account_id",
#                     "target_column": "account_id"
#                 },
#                 {
#                     "source_table": "transactions",
#                     "target_table": "financial_reports",
#                     "transformation_logic": "SUM(amount) as revenue in Redshift",
#                     "transformation_type": "aggregation",
#                     "confidence_score": 98,
#                     "lineage_type": "COLUMN_TO_COLUMN",
#                     "source_column": "amount",
#                     "target_column": "revenue"
#                 },
#             ]
                
#                 # Column-level lineages - Only create if columns exist
            
#             # Now safely create the edges
#             # for rel in lineage_relationships:
#             #     # Skip if source or target table doesn't exist
#             #     if not rel["source_table"] or not rel["target_table"]:
#             #         print(f"⚠️  Skipping lineage: missing table")
#             #         continue
#             for rel in lineage_relationships:
#                 # --- PREVIOUS FIX FOR TABLES ---
#                 # If the table is a string, look it up in the map
#                 if isinstance(rel["source_table"], str):
#                     rel["source_table"] = table_name_map.get(rel["source_table"])
#                 if isinstance(rel["target_table"], str):
#                     rel["target_table"] = table_name_map.get(rel["target_table"])

#                 # Skip if source or target table doesn't exist after lookup
#                 if not rel["source_table"] or not rel["target_table"]:
#                     print(f"⚠️  Skipping lineage: missing table for a relationship.")
#                     continue

#                 # --- NEW FIX FOR COLUMNS ---
#                 # If the column is a string, look it up in the nested column map
#                 if isinstance(rel.get("source_column"), str):
#                     source_table_id = rel["source_table"].id
#                     column_name = rel["source_column"]
#                     rel["source_column"] = column_name_map.get(source_table_id, {}).get(column_name)

#                 if isinstance(rel.get("target_column"), str):
#                     target_table_id = rel["target_table"].id
#                     column_name = rel["target_column"]
#                     rel["target_column"] = column_name_map.get(target_table_id, {}).get(column_name)
#                 # --- END OF FIXES ---
                    
#                 edge = LineageEdge(
#                     source_table_id=rel["source_table"].id,
#                     target_table_id=rel["target_table"].id,
#                     source_column_id=rel["source_column"].id if rel["source_column"] else None,
#                     target_column_id=rel["target_column"].id if rel["target_column"] else None,
#                     lineage_type=rel["lineage_type"],
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
#         print(f"✅ Created lineage: {rel['source_table'].name} -> {rel['target_table'].name}")
#         # Create lineage impact analysis
#         print("📊 Creating lineage impact analysis...")
#         for table in existing_tables:  # For all tables
#             analysis = LineageImpactAnalysis(
#                 table_id=table.id,
#                 upstream_table_count=random.randint(0, 5),
#                 upstream_column_count=random.randint(0, 15),
#                 max_upstream_depth=random.randint(1, 4),
#                 downstream_table_count=random.randint(1, 7),
#                 downstream_column_count=random.randint(5, 25),
#                 max_downstream_depth=random.randint(1, 5),
#                 is_critical_path=random.choice([True, False]),
#                 criticality_score=random.randint(1, 10),
#                 impact_radius=random.randint(1, 20),
#                 upstream_tables=[{"id": t.id, "name": t.name} for t in existing_tables[:3]],
#                 downstream_tables=[{"id": t.id, "name": t.name} for t in existing_tables[3:7]],
#                 analysis_version="1.0"
#             )
#             db.add(analysis)
        
#         # Create column statistics for existing columns
#         print("📈 Creating column statistics...")
#         for column in existing_columns:  # For all columns
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
#     # 1. COMPLETENESS (NULL_CHECK)
#     {
#         "name": "Customer ID Not Null",
#         "description": "Customer ID must not be null (Critical for joins)",
#         "table": existing_tables[0] if existing_tables else None,
#         "rule_type": "NULL_CHECK",
#         "rule_config": {"column": "customer_id"},
#         "severity": "CRITICAL",
#         "is_blocking": True
#     },
    
#     # 2. UNIQUENESS (UNIQUE_CHECK) - NEW RULE FOR UNIQUENESS
#     {
#         "name": "Customer SSN Uniqueness",
#         "description": "Social Security Number must be unique across all customer records",
#         "table": existing_tables[0] if existing_tables else None,
#         "rule_type": "UNIQUE_CHECK",
#         "rule_config": {"column": "ssn"},
#         "severity": "CRITICAL",
#         "is_blocking": True
#     },
    
#     # 3. VALIDITY (FORMAT_CHECK)
#     {
#         "name": "Email Format Validation",
#         "description": "Email addresses must be in valid format",
#         "table": existing_tables[0] if existing_tables else None,
#         "rule_type": "FORMAT_CHECK",
#         "rule_config": {"column": "email", "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"},
#         "severity": "HIGH",
#         "is_blocking": False
#     },
#     # 4. VALIDITY (RANGE_CHECK)
#     {
#         "name": "Credit Score Range",
#         "description": "Credit scores must be between 300 and 850",
#         "table": existing_tables[4] if len(existing_tables) > 4 else None,
#         "rule_type": "RANGE_CHECK",
#         "rule_config": {"column": "score", "min_value": 300, "max_value": 850},
#         "severity": "HIGH",
#         "is_blocking": False
#     },
#     # 5. INTEGRITY (REFERENCE_CHECK) - NEW RULE FOR INTEGRITY
#     {
#         "name": "Transaction Account ID Integrity",
#         "description": "Every transaction's account_id must exist in the accounts table (Foreign Key Check)",
#         "table": existing_tables[2] if len(existing_tables) > 2 else None,
#         "rule_type": "REFERENCE_CHECK",
#         "rule_config": {"column": "account_id", "target_table": "accounts", "target_column": "id"},
#         "severity": "HIGH",
#         "is_blocking": True
#     },

#     # 6. CONSISTENCY (CONSISTENCY) - NEW RULE FOR CONSISTENCY
#     {
#         "name": "Loan Date Consistency",
#         "description": "Loan start_date must be before end_date",
#         "table": existing_tables[6] if len(existing_tables) > 6 else None,
#         "rule_type": "CONSISTENCY",
#         "rule_config": {"columns": ["start_date", "end_date"], "logic": "start_date < end_date"},
#         "severity": "MEDIUM",
#         "is_blocking": False
#     },

#     # 7. TIMELINESS (FRESHNESS) - NEW RULE FOR TIMELINESS
#     {
#         "name": "Accounts Freshness Check",
#         "description": "The accounts table must have been updated within the last 48 hours",
#         "table": existing_tables[1] if len(existing_tables) > 1 else None,
#         "rule_type": "FRESHNESS",
#         "rule_config": {"column": "last_updated_at", "max_age_hours": 48},
#         "severity": "MEDIUM",
#         "is_blocking": False
#     },
    
#     # 8. ACCURACY (CUSTOM_SQL)
#     {
#         "name": "Transaction Amount Positive",
#         "description": "Transaction amounts must be positive for deposits (Business Logic Check)",
#         "table": existing_tables[2] if len(existing_tables) > 2 else None,
#         "rule_type": "CUSTOM_SQL",
#         "rule_config": {"sql": "amount > 0 WHERE transaction_type = 'DEPOSIT'"},
#         "severity": "MEDIUM",
#         "is_blocking": False
#     },
# ]
        
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
#                     is_blocking=rule_data.get("is_blocking", False),
#                     check_frequency="daily",
#                     last_check_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
#                     next_check_at=datetime.utcnow() + timedelta(hours=random.randint(1, 24)),
#                     created_by=random.choice(existing_users).id,
#                     owner_id=random.choice(existing_users).id
#                 )
#                 db.add(rule)
#                 db.flush()
#                 rule_map[rule_data["name"]] = rule


#         CRITICAL_PASS_RULE_TYPES = [
#             "NULL_CHECK",      # Maps to Completeness (Fixes Completeness = 0)
#     "REFERENCE_CHECK", # Maps to Integrity (Fixes Integrity = 0)
#     "FORMAT_CHECK",    # Maps to Validity (Ensures Validity increases)
#     "RANGE_CHECK",     # Maps to Validity (Ensures Validity increases)
#     "CUSTOM_SQL",      # Maps to Accuracy
#     "UNIQUE_CHECK",    # Maps to Uniqueness
#     "FRESHNESS",       # Maps to Timeliness
#     "CONSISTENCY"  # Maps to Tim
#             ]
#         print("📊 Creating quality results with forced status...")
#         for rule in rule_map.values():
#             rule_type_str = rule.rule_type 
#             for i in range(10):
#                 is_critical_pass_target = rule_type_str in CRITICAL_PASS_RULE_TYPES
        
#         # We only force the status for the LATEST run (i=0)
#                 if i == 0 and is_critical_pass_target:
#                     result_status = "PASSED"
#                     result_score = random.uniform(0.95, 0.999) 
#                 else:
#             # For historical data (i>0) or other rules, randomize
#                     result_status = random.choice(["PASSED", "PASSED", "PASSED", "WARNING", "FAILED"])
#                     if result_status != "PASSED":
#                         result_score = random.uniform(0.7, 0.95)
#                     else:
#                         result_score = random.uniform(0.7, 1.0) # Full range for passed
                        
                        
#                 result = QualityResult(
#                     rule_id=rule.id,
#                     check_id=f"check_{rule.id}_{datetime.utcnow().strftime('%Y%m%d')}_{i:03d}",
#                     started_at=datetime.utcnow() - timedelta(days=i+1),
#                     completed_at=datetime.utcnow() - timedelta(days=i+1) + timedelta(minutes=random.randint(1, 30)),
#                     status=result_status, 
#                     score=result_score,
#                     passed_count=random.randint(800, 1000),
#                     failed_count=random.randint(0, 50),
#                     total_count=random.randint(850, 1000),
#                     measured_value=str(random.uniform(0.85, 1.0)),
#                     expected_value="1.0",
#                     execution_context={"check_type": "automated", "version": "1.0"}
#                     )
#                 db.add(result)
#                 db.flush()
                
#                 # Create alerts for failed results
#                 if result.status == "FAILED":
#                     alert = QualityAlert(
#                         rule_id=rule.id,
#                         result_id=result.id,
#                         alert_type="QUALITY_FAILURE",
#                         severity=rule.severity,
#                         message=f"Quality rule '{rule.name}' failed with score {result.score:.2f}",
#                         recipients=[f"admin@bank.com", f"dq-team@bank.com"],
#                         is_resolved=random.choice([True, False]),
#                         notification_sent=True,
#                         notification_sent_at=result.completed_at + timedelta(minutes=5)
#                     )
#                     db.add(alert)
        
#         # Create data retention policies
#         print("🗄️ Creating data retention policies...")
#         retention_policies = [
#             {
#                 "name": "PII Data Retention Policy",
#                 "description": "Personal data must be deleted after 7 years of inactivity",
#                 "retention_period_days": 2555,  # ~7 years
#                 "applies_to_tags": ["PII"],
#                 "applies_to_sensitivity": ["RESTRICTED", "CONFIDENTIAL"],
#                 "regulatory_basis": "GDPR Article 5(1)(e) - storage limitation"
#             },
#             {
#                 "name": "Financial Records Policy",
#                 "description": "Financial data must be retained for 10 years",
#                 "retention_period_days": 3653,  # ~10 years
#                 "applies_to_tags": ["Financial"],
#                 "regulatory_basis": "Sarbanes-Oxley Act requirements"
#             },
#             {
#                 "name": "Operational Logs Policy", 
#                 "description": "System logs retained for 2 years",
#                 "retention_period_days": 730,  # 2 years
#                 "applies_to_domains": ["Operations"],
#                 "regulatory_basis": "Internal audit requirements"
#             },
#             {
#                 "name": "Compliance Data Policy",
#                 "description": "Compliance records retained for 5 years",
#                 "retention_period_days": 1825,  # 5 years
#                 "applies_to_tags": ["Compliance"],
#                 "regulatory_basis": "AML regulations"
#             },
#         ]
        
#         for policy_data in retention_policies:
#             policy = DataRetentionPolicy(
#                 name=policy_data["name"],
#                 description=policy_data["description"],
#                 retention_period_days=policy_data["retention_period_days"],
#                 applies_to_domains=policy_data.get("applies_to_domains"),
#                 applies_to_tags=policy_data.get("applies_to_tags"),
#                 applies_to_sensitivity=policy_data.get("applies_to_sensitivity"),
#                 auto_delete_enabled=False,  # Require manual approval
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
#         for i in range(20):
#             request = AccessRequest(
#                 user_id=random.choice(existing_users).id,
#                 table_id=random.choice(existing_tables).id,
#                 reason=f"Need access for analysis project #{i+1}",
#                 business_justification=f"Required for quarterly reporting and compliance analysis",
#                 requested_access_level=random.choice(["READ", "READ_WRITE"]),
#                 duration_days=random.choice([30, 60, 90]),
#                 status=random.choice(["PENDING", "APPROVED", "APPROVED", "APPROVED"]),  # Mostly approved
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
#                 "name": "Q4 2024 GDPR Compliance Report",
#                 "report_type": "GDPR_COMPLIANCE",
#                 "period_start": datetime(2024, 10, 1),
#                 "period_end": datetime(2024, 12, 31),
#                 "scope_domains": ["Customer Management", "Compliance"],
#                 "status": "completed"
#             },
#             {
#                 "name": "SOX Controls Assessment 2024",
#                 "report_type": "SOX_COMPLIANCE",
#                 "period_start": datetime(2024, 1, 1), 
#                 "period_end": datetime(2024, 12, 31),
#                 "scope_domains": ["Finance"],
#                 "status": "in_progress"
#             },
#             {
#                 "name": "AML Annual Report 2024",
#                 "report_type": "AML_COMPLIANCE",
#                 "period_start": datetime(2024, 1, 1),
#                 "period_end": datetime(2024, 12, 31),
#                 "scope_domains": ["Risk Management", "Compliance"],
#                 "status": "completed"
#             },
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
        
#         for i in range(100):
#             log = AuditLog(
#                 user_id=random.choice(existing_users).id,
#                 action=random.choice(actions),
#                 resource_type=random.choice(resource_types),
#                 resource_id=random.randint(1, 50),
#                 resource_name=f"Resource_{random.randint(1, 100)}",
#                 details={"operation": "sample_audit", "metadata": {"source": "api"}},
#                 ip_address=f"192.168.1.{random.randint(1, 254)}",
#                 user_agent="MetaPortal-Client/1.0",
#                 endpoint=f"/api/v1/{random.choice(['tables', 'domains', 'tags'])}",
#                 http_method=random.choice(["GET", "POST", "PUT", "DELETE"]),
#                 status_code=random.choice([200, 201, 404, 500]),
#                 success=random.choice([True, True, True, False]),
#                 created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 168))  # Last 7 days
#             )
#             db.add(log)
        
#         db.commit()
#         print("✅ Comprehensive seed data created successfully!")
        
#         # Print summary
#         print("\n📈 Data Summary:")
#         print(f"  • Data Classifications: {len(classifications)}")
#         print(f"  • Quality Dimensions: {len(quality_dimensions)}")
#         print(f"  • Business Glossary Terms: {len(glossary_terms)}")
#         print(f"  • Lineage Jobs: {len(lineage_jobs)}")
#         print(f"  • Quality Rules: {len(rule_map)}")
#         print(f"  • Retention Policies: {len(retention_policies)}")
#         print(f"  • Compliance Reports: {len(compliance_reports)}")
#         print(f"  • Access Requests: 20")
#         print(f"  • Audit Logs: 100")
        
#         print("\n🔗 Lineage Relationships Created:")
#         print(f"  • {len(lineage_relationships) if 'lineage_relationships' in locals() else 0} lineage edges (table and column level)")
#         print(f"  • Impact analysis for {len(existing_tables)} tables")
        
#     except Exception as e:
#         db.rollback()
#         print(f"❌ Error creating comprehensive seed data: {e}")
#         raise
#     finally:
#         db.close()


# if __name__ == "__main__":
#     create_comprehensive_seed_data()