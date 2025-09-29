#!/usr/bin/env python3
"""
Script to generate sample banking data for MetaPortal.
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from datetime import datetime, timedelta
import random
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Assuming your models are in app.models
# You might need to adjust the import path based on your project structure
from app.models import *
from app.core.database import Base
from app.core.security import SecurityManager
from app.core.config import settings

# Banking sample data
BANK_USERS = [
    {"name": "Alice Sterling", "email": "alice.sterling@megabank.com", "role": "admin"},
    {"name": "Bob Venture", "email": "bob.venture@megabank.com", "role": "data_steward"},
    {"name": "Charlie Fin", "email": "charlie.fin@megabank.com", "role": "data_analyst"},
    {"name": "Diana Prince", "email": "diana.prince@megabank.com", "role": "data_steward"},
    {"name": "Edward Nigma", "email": "edward.nigma@megabank.com", "role": "data_analyst"},
    {"name": "Fiona Glenanne", "email": "fiona.glenanne@megabank.com", "role": "viewer"},
]

BANK_DOMAINS = [
    {"name": "Retail Banking", "description": "Customer accounts, transactions, and personal loans", "color": "#3B82F6"},
    {"name": "Corporate Banking", "description": "Business accounts, commercial loans, and treasury services", "color": "#10B981"},
    {"name": "Risk Management", "description": "Credit risk, market risk, and fraud detection", "color": "#F59E0B"},
    {"name": "Wealth Management", "description": "Investment portfolios, assets, and financial advisory", "color": "#EF4444"},
    {"name": "Compliance", "description": "Regulatory reporting, AML, and KYC data", "color": "#8B5CF6"},
    {"name": "Treasury", "description": "Liquidity management, foreign exchange, and capital markets", "color": "#F97316"},
]

BANK_DATA_SOURCES = [
    {
        "name": "Core Banking System",
        "type": "oracle",
        "description": "Primary system for customer accounts and transactions",
        "connection_config": {
            "host": "core-db.bank.internal",
            "port": 1521,
            "database": "core_banking_prod",
        }
    },
    {
        "name": "Loan Origination System",
        "type": "postgresql",
        "description": "Manages loan applications and approvals",
        "connection_config": {
            "host": "loans-db.bank.internal",
            "port": 5432,
            "database": "loan_origination"
        }
    },
    {
        # Changed from CRM Platform (salesforce/other) to Customer Data Mart (mysql)
        "name": "Customer Data Mart",
        "type": "mysql",
        "description": "MySQL database for customer analytics and reporting.",
        "connection_config": {
            "host": "customer-mart.bank.internal",
            "port": 3306,
            "database": "customer_analytics"
        }
    },
    {
        "name": "Risk Data Warehouse",
        "type": "snowflake",
        "description": "Data warehouse for risk analytics and reporting",
        "connection_config": {
            "account": "megabank.snowflakecomputing.com",
            "database": "RISK_ANALYTICS",
            "warehouse": "RISK_WH"
        }
    },
    {
        # Changed from Compliance Data Lake (s3) to Compliance Data Warehouse (bigquery)
        "name": "Compliance Data Warehouse",
        "type": "bigquery",
        "description": "BigQuery warehouse for regulatory and compliance data",
        "connection_config": {
            "project_id": "megabank-compliance-prod",
            "dataset": "compliance_data"
        }
    }
]

BANK_TABLES = [
    # Retail Banking Domain
    {
        "name": "customers",
        "schema_name": "retail",
        "description": "Individual customer information and demographics",
        "domain": "Retail Banking",
        "data_source": "Core Banking System",
        "sensitivity": "confidential",
        "is_certified": True,
        "columns": [
            {"name": "customer_id", "data_type": "VARCHAR(20)", "is_primary_key": True, "description": "Unique customer identifier"},
            {"name": "first_name", "data_type": "VARCHAR(100)", "is_pii": True, "description": "Customer's first name"},
            {"name": "last_name", "data_type": "VARCHAR(100)", "is_pii": True, "description": "Customer's last name"},
            {"name": "date_of_birth", "data_type": "DATE", "is_pii": True, "description": "Customer's date of birth"},
            {"name": "email_address", "data_type": "VARCHAR(255)", "is_pii": True, "description": "Customer's email address"},
            {"name": "phone_number", "data_type": "VARCHAR(20)", "is_pii": True, "description": "Customer's phone number"},
            {"name": "address", "data_type": "VARCHAR(500)", "is_pii": True, "description": "Customer's home address"},
            {"name": "ssn", "data_type": "VARCHAR(11)", "is_pii": True, "description": "Social Security Number", "sensitivity_level": "restricted"},
            {"name": "join_date", "data_type": "DATE", "description": "Date the customer joined the bank"}
        ]
    },
    {
        "name": "accounts",
        "schema_name": "retail",
        "description": "Customer account details, balances, and types",
        "domain": "Retail Banking",
        "data_source": "Core Banking System",
        "sensitivity": "confidential",
        "columns": [
            {"name": "account_number", "data_type": "VARCHAR(30)", "is_primary_key": True, "description": "Unique account number"},
            {"name": "customer_id", "data_type": "VARCHAR(20)", "is_foreign_key": True, "description": "Reference to the customer"},
            {"name": "account_type", "data_type": "VARCHAR(20)", "description": "Type of account (e.g., Checking, Savings)"},
            {"name": "balance", "data_type": "DECIMAL(15,2)", "description": "Current account balance"},
            {"name": "currency", "data_type": "VARCHAR(3)", "description": "Currency of the account (e.g., USD)"},
            {"name": "open_date", "data_type": "DATE", "description": "Date the account was opened"},
            {"name": "status", "data_type": "VARCHAR(20)", "description": "Account status (e.g., Active, Closed, Frozen)"}
        ]
    },
    {
        "name": "transactions",
        "schema_name": "retail",
        "description": "Customer transaction records",
        "domain": "Retail Banking",
        "data_source": "Core Banking System",
        "sensitivity": "confidential",
        "columns": [
            {"name": "transaction_id", "data_type": "VARCHAR(50)", "is_primary_key": True, "description": "Unique transaction identifier"},
            {"name": "account_number", "data_type": "VARCHAR(30)", "is_foreign_key": True, "description": "Reference to the account"},
            {"name": "transaction_date", "data_type": "TIMESTAMP", "description": "Date and time of the transaction"},
            {"name": "amount", "data_type": "DECIMAL(15,2)", "description": "Transaction amount"},
            {"name": "transaction_type", "data_type": "VARCHAR(20)", "description": "Type of transaction (e.g., Deposit, Withdrawal, Transfer)"},
            {"name": "description", "data_type": "VARCHAR(255)", "description": "Transaction description or merchant name"},
            {"name": "running_balance", "data_type": "DECIMAL(15,2)", "description": "Account balance after the transaction"}
        ]
    },
    # Risk Management Domain
    {
        "name": "credit_scores",
        "schema_name": "risk",
        "description": "Customer credit scores from various bureaus",
        "domain": "Risk Management",
        "data_source": "Risk Data Warehouse",
        "sensitivity": "restricted",
        "columns": [
            {"name": "credit_report_id", "data_type": "VARCHAR(50)", "is_primary_key": True, "description": "Unique credit report identifier"},
            {"name": "customer_id", "data_type": "VARCHAR(20)", "is_foreign_key": True, "description": "Reference to the customer"},
            {"name": "credit_bureau", "data_type": "VARCHAR(50)", "description": "Credit bureau name (e.g., Experian, Equifax)"},
            {"name": "score", "data_type": "INTEGER", "description": "Credit score value"},
            {"name": "report_date", "data_type": "DATE", "description": "Date the credit report was generated"}
        ]
    },
    # Corporate Banking Domain
    {
        "name": "loan_applications",
        "schema_name": "loans",
        "description": "Applications for personal and commercial loans",
        "domain": "Corporate Banking",
        "data_source": "Loan Origination System",
        "sensitivity": "confidential",
        "columns": [
            {"name": "application_id", "data_type": "VARCHAR(50)", "is_primary_key": True, "description": "Unique loan application identifier"},
            {"name": "customer_id", "data_type": "VARCHAR(20)", "is_foreign_key": True, "description": "Reference to the customer"},
            {"name": "loan_type", "data_type": "VARCHAR(50)", "description": "Type of loan (e.g., Mortgage, Auto, Business)"},
            {"name": "requested_amount", "data_type": "DECIMAL(15,2)", "description": "The amount of money requested"},
            {"name": "status", "data_type": "VARCHAR(20)", "description": "Application status (e.g., Pending, Approved, Rejected)"},
            {"name": "application_date", "data_type": "DATE", "description": "Date of the application"},
            {"name": "loan_officer_id", "data_type": "VARCHAR(20)", "description": "ID of the assigned loan officer"}
        ]
    },
    # Compliance Domain
    {
        "name": "aml_alerts",
        "schema_name": "compliance",
        "description": "Anti-Money Laundering (AML) alerts for suspicious transactions",
        "domain": "Compliance",
        "data_source": "Compliance Data Warehouse",
        "sensitivity": "restricted",
        "is_certified": True,
        "columns": [
            {"name": "alert_id", "data_type": "VARCHAR(50)", "is_primary_key": True, "description": "Unique AML alert identifier"},
            {"name": "transaction_id", "data_type": "VARCHAR(50)", "is_foreign_key": True, "description": "Reference to the suspicious transaction"},
            {"name": "customer_id", "data_type": "VARCHAR(20)", "is_foreign_key": True, "description": "Customer associated with the transaction"},
            {"name": "alert_reason", "data_type": "VARCHAR(255)", "description": "Reason for the AML alert"},
            {"name": "alert_date", "data_type": "TIMESTAMP", "description": "Date the alert was generated"},
            {"name": "status", "data_type": "VARCHAR(20)", "description": "Alert status (e.g., Open, Under Review, Closed)"},
            {"name": "assigned_analyst_id", "data_type": "VARCHAR(20)", "description": "ID of the analyst reviewing the alert"}
        ]
    }
]

BANK_TAGS = [
    {"name": "PII", "description": "Personally Identifiable Information", "color": "#EF4444"},
    {"name": "Financial", "description": "Financial transaction or balance data", "color": "#10B981"},
    {"name": "Transactional", "description": "High-volume transactional data", "color": "#3B82F6"},
    {"name": "Credit Risk", "description": "Data related to credit risk assessment", "color": "#F59E0B"},
    {"name": "Compliance", "description": "Data subject to regulatory compliance", "color": "#8B5CF6"},
    {"name": "Customer Data", "description": "Core customer information", "color": "#059669"},
    {"name": "Internal", "description": "Data for internal use", "color": "#6B7280"},
    {"name": "Restricted", "description": "Highly sensitive data requiring strict access controls", "color": "#DC2626"},
]

def create_sample_data():
    """Generate sample banking data."""
    
    # Database connection
    engine = create_engine(os.getenv("DATABASE_URL", settings.database_url))
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("🚀 Generating sample banking data...")
        
        # Create database tables first
        print("🗃️ Creating database tables...")
        Base.metadata.create_all(engine)
        
        # Create users
        print("👥 Creating users...")
        user_map = {}
        for user_data in BANK_USERS:
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                hashed_password=SecurityManager.get_password_hash("password123"),
                role=user_data["role"],
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.flush()
            user_map[user_data["name"]] = user
        
        # Create domains
        print("🏢 Creating domains...")
        domain_map = {}
        for i, domain_data in enumerate(BANK_DOMAINS):
            steward = list(user_map.values())[i % len(user_map)]
            domain = Domain(
                name=domain_data["name"],
                description=domain_data["description"],
                color=domain_data["color"],
                steward_id=steward.id
            )
            db.add(domain)
            db.flush()
            domain_map[domain_data["name"]] = domain
        
        # Create data sources
        print("🔌 Creating data sources...")
        data_source_map = {}
        for ds_data in BANK_DATA_SOURCES:
            data_source = DataSource(
                name=ds_data["name"],
                type=ds_data["type"],
                description=ds_data["description"],
                connection_config=ds_data["connection_config"],
                is_active=True,
                connection_status="success"
            )
            db.add(data_source)
            db.flush()
            data_source_map[ds_data["name"]] = data_source
        
        # Create tags
        print("🏷️ Creating tags...")
        tag_map = {}
        for tag_data in BANK_TAGS:
            tag = Tag(
                name=tag_data["name"],
                description=tag_data["description"],
                color=tag_data["color"],
                is_active=True
            )
            db.add(tag)
            db.flush()
            tag_map[tag_data["name"]] = tag
        
        # Create tables and columns
        print("📊 Creating tables and columns...")
        for table_data in BANK_TABLES:
            domain = domain_map[table_data["domain"]]
            data_source = data_source_map[table_data["data_source"]]
            owner = random.choice(list(user_map.values()))
            
            table = Table(
                name=table_data["name"],
                schema_name=table_data["schema_name"],
                description=table_data["description"],
                data_source_id=data_source.id,
                domain_id=domain.id,
                owner_id=owner.id,
                sensitivity_level=table_data.get("sensitivity", "internal"),
                is_certified=table_data.get("is_certified", False),
                is_active=True
            )
            db.add(table)
            db.flush()
            
            # Create columns
            for i, col_data in enumerate(table_data["columns"]):
                column = Column(
                    table_id=table.id,
                    name=col_data["name"],
                    data_type=col_data["data_type"],
                    description=col_data.get("description", ""),
                    is_primary_key=col_data.get("is_primary_key", False),
                    is_foreign_key=col_data.get("is_foreign_key", False),
                    is_pii=col_data.get("is_pii", False),
                    sensitivity_level=col_data.get("sensitivity_level", "internal"),
                    ordinal_position=i + 1,
                    is_nullable=not col_data.get("is_primary_key", False)
                )
                db.add(column)
            
            # Create table stats
            stats = TableStats(
                table_id=table.id,
                row_count=random.randint(1000, 1000000),
                size_bytes=random.randint(1024*1024, 1024*1024*1024),
                quality_score=random.randint(75, 100),
                query_count_last_30d=random.randint(10, 500),
                unique_users_last_30d=random.randint(3, 20),
                last_updated=datetime.utcnow() - timedelta(days=random.randint(0, 30))
            )
            db.add(stats)
            
            # Add some tags to tables
            relevant_tags = []
            if table_data["name"] == "customers":
                relevant_tags.extend([tag_map["PII"], tag_map["Customer Data"], tag_map["Restricted"]])
            if table_data["name"] == "transactions":
                relevant_tags.extend([tag_map["Financial"], tag_map["Transactional"]])
            if "risk" in table_data["domain"]:
                relevant_tags.extend([tag_map["Credit Risk"]])
            if "compliance" in table_data["domain"]:
                relevant_tags.extend([tag_map["Compliance"], tag_map["Restricted"]])

            # Add tags to table
            for tag in relevant_tags[:3]:  # Limit to 3 tags per table
                table_tag = TableTag(
                    table_id=table.id,
                    tag_id=tag.id,
                    created_by=owner.id
                )
                db.add(table_tag)
        
        db.commit()
        print("✅ Sample data created successfully!")
        
        # Print summary
        print("\n📈 Data Summary:")
        print(f"  • Users: {len(BANK_USERS)}")
        print(f"  • Domains: {len(BANK_DOMAINS)}")
        print(f"  • Data Sources: {len(BANK_DATA_SOURCES)}")
        print(f"  • Tables: {len(BANK_TABLES)}")
        print(f"  • Tags: {len(BANK_TAGS)}")
        
        # Print login info
        print("\n🔐 Login Information:")
        print("  Admin User:")
        print(f"    Email: {BANK_USERS[0]['email']}")
        print("    Password: password123")
        print("\n  Other users have the same password: password123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating sample data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()