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

from app.models import *
from app.core.database import Base
from app.core.security import SecurityManager
from app.core.config import settings

# Banking management sample data
BANK_USERS = [
    {"name": "Alice Johnson", "email": "alice.johnson@bank.com", "role": "admin"},
    {"name": "Bob Williams", "email": "bob.williams@bank.com", "role": "data_steward"},
    {"name": "Charlie Brown", "email": "charlie.brown@bank.com", "role": "data_analyst"},
    {"name": "Diana Miller", "email": "diana.miller@bank.com", "role": "data_steward"},
    {"name": "Edward Davis", "email": "edward.davis@bank.com", "role": "data_analyst"},
    {"name": "Fiona Green", "email": "fiona.green@bank.com", "role": "viewer"},
]

BANK_DOMAINS = [
    {"name": "Retail Banking", "description": "Customer accounts, deposits, withdrawals, transactions, and everyday services", "color": "#3B82F6"},
    {"name": "Lending", "description": "Loan origination, approval workflows, mortgage data, and credit products", "color": "#10B981"},
    {"name": "Wealth Management", "description": "Investment portfolios, financial planning, and high-net-worth services", "color": "#F59E0B"},
    {"name": "Risk & Compliance", "description": "Fraud detection, audit trails, KYC/AML, and regulatory reporting", "color": "#EF4444"},
    {"name": "Financial Marketing", "description": "Trading desks, securities data, derivatives, and capital markets operations", "color": "#8B5CF6"},
    {"name": "Sales and Executive", "description": "Customer segmentation, campaigns, offers, and cross-selling analytics", "color": "#F97316"},
    {"name": "Payments", "description": "Credit/debit card processing, UPI, SWIFT, wire transfers, and settlement", "color": "#0EA5E9"},
    {"name": "Treasury & Liquidity", "description": "Cash flow management, funding, liquidity risk, and hedging strategies", "color": "#14B8A6"},
    {"name": "Customer Service & CRM", "description": "Customer onboarding, service requests, complaints, and engagement tracking", "color": "#6366F1"},
    {"name": "Corporate Banking", "description": "Business accounts, commercial lending, trade finance, and treasury services", "color": "#A855F7"},
    {"name": "Credit Risk Management", "description": "Credit scoring, exposure monitoring, stress testing, and provisioning", "color": "#DC2626"},
    {"name": "Cybersecurity", "description": "Threat monitoring, intrusion detection, incident response, and secure transactions", "color": "#1E3A8A"},
    {"name": "Human Resources & Payroll", "description": "Employee management, payroll processing, benefits, and training records", "color": "#D97706"},
    {"name": "Operations & IT", "description": "Core banking systems, infrastructure management, and technology operations", "color": "#6B7280"},
    {"name": "Regulatory & Legal", "description": "Compliance with local/international banking laws, reporting, and audits", "color": "#9333EA"},
]

BANK_DATA_SOURCES = [
    {
        "name": "Core Banking System",
        "type": "postgresql",
        "description": "Primary system for managing customer accounts, deposits, and transactions",
        "connection_config": {
            "host": "core-db.bank.internal",
            "port": 5432,
            "database": "core_banking",
            "schema": "public"
        }
    },
    {
        "name": "Loan Origination System", 
        "type": "oracle",
        "description": "System for processing, underwriting, and approving loan applications",
        "connection_config": {
            "host": "loan-db.bank.internal",
            "port": 1521,
            "database": "loan_sys"
        }
    },
    {
        "name": "Credit Card Processing",
        "type": "mysql", 
        "description": "Transaction data for credit and debit cards (POS, e-commerce, ATM)",
        "connection_config": {
            "host": "card-db.bank.internal",
            "port": 3306,
            "database": "card_processing"
        }
    },
    {
        "name": "Customer Data Hub",
        "type": "snowflake",
        "description": "Centralized customer information, demographics, and KYC/AML profiles",
        "connection_config": {
            "account": "bank.snowflakecomputing.com",
            "database": "CUSTOMER_HUB",
            "warehouse": "BI_WH"
        }
    },
    {
        "name": "Regulatory Reporting Warehouse",
        "type": "bigquery",
        "description": "Data warehouse for generating Basel III, AML, FATCA, and other compliance reports",
        "connection_config": {
            "project_id": "bank-reporting-prod",
            "dataset": "regulatory_reports"
        }
    },
    {
        "name": "Treasury Management System",
        "type": "postgresql",
        "description": "Liquidity management, cash flow forecasting, and funding positions",
        "connection_config": {
            "host": "treasury-db.bank.internal",
            "port": 5432,
            "database": "treasury_mgmt",
            "schema": "public"
        }
    },
    {
        "name": "Fraud Detection Engine",
        "type": "postgresql",
        "description": "Real-time transaction monitoring and fraud scoring system",
        "connection_config": {
            "host": "fraud-db.bank.internal",
            "port": 5432,
            "database": "fraud_detection",
            "schema": "public",
            "table": "fraud_alerts"
        }
    },
    {
        "name": "Market Data Feed",
        "type": "bigquery",
        "description": "External feed providing stock prices, FX rates, and derivatives market data",
        "connection_config": {
            "project_id": "marketdata-prod",
            "dataset": "market_prices"
        }
    },
    {
        "name": "HR & Payroll System",
        "type": "postgresql",
        "description": "Employee records, payroll, and benefits management",
        "connection_config": {
            "host": "hr-db.bank.internal",
            "port": 5432,
            "database": "hr_payroll",
            "schema": "public"
        }
    },
    {
        "name": "Data Lake",
        "type": "snowflake",
        "description": "Central repository for storing raw log data, batch files, and historical archives",
        "connection_config": {
            "account": "datalake.bank.snowflakecomputing.com",
            "database": "RAW_LAKE",
            "warehouse": "ETL_WH"
        }
    },
    {
        "name": "CRM Platform",
        "type": "mysql",
        "description": "Customer interactions, support tickets, and engagement history",
        "connection_config": {
            "host": "crm-db.bank.internal",
            "port": 3306,
            "database": "crm_data"
        }
    },
    {
        "name": "Payments Gateway",
        "type": "postgresql",
        "description": "Transaction processing system for UPI, SWIFT, NEFT/RTGS payments",
        "connection_config": {
            "host": "payments-db.bank.internal",
            "port": 5432,
            "database": "payments_gateway",
            "schema": "public"
        }
    }
]


BANK_TABLES = [
    # ---------------- Retail Banking Domain ----------------
    {
        "name": "customers",
        "schema_name": "public",
        "description": "Master table of all bank customers",
        "domain": "Retail Banking",
        "data_source": "Core Banking System",
        "sensitivity": "confidential",
        "is_certified": True,
        "columns": [
            {"name": "customer_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique customer identifier"},
            {"name": "first_name", "data_type": "VARCHAR(100)", "is_pii": True, "description": "Customer first name"},
            {"name": "last_name", "data_type": "VARCHAR(100)", "is_pii": True, "description": "Customer last name"},
            {"name": "email", "data_type": "VARCHAR(255)", "is_pii": True, "description": "Customer email address"},
            {"name": "phone", "data_type": "VARCHAR(20)", "is_pii": True, "description": "Customer phone number"},
            {"name": "date_of_birth", "data_type": "DATE", "is_pii": True, "description": "Date of birth"},
            {"name": "social_security_number", "data_type": "VARCHAR(11)", "is_pii": True, "sensitivity_level": "restricted", "description": "U.S. Social Security Number"},
            {"name": "address", "data_type": "VARCHAR(500)", "is_pii": True, "description": "Customer street address"},
            {"name": "created_at", "data_type": "TIMESTAMP", "description": "Date customer record was created"}
        ]
    },
    {
        "name": "accounts",
        "schema_name": "public",
        "description": "Customer bank accounts (checking, savings, etc.)",
        "domain": "Retail Banking",
        "data_source": "Core Banking System",
        "sensitivity": "confidential",
        "is_certified": True,
        "columns": [
            {"name": "account_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique account identifier"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the customer who owns the account"},
            {"name": "account_number", "data_type": "VARCHAR(20)", "is_pii": True, "description": "The unique account number"},
            {"name": "account_type", "data_type": "VARCHAR(20)", "description": "Type of account (e.g., checking, savings, money_market)"},
            {"name": "balance", "data_type": "DECIMAL(18,2)", "description": "Current account balance"},
            {"name": "currency", "data_type": "VARCHAR(3)", "description": "Currency of the account"},
            {"name": "status", "data_type": "VARCHAR(20)", "description": "Account status (e.g., active, closed, dormant)"}
        ]
    },
    {
        "name": "transactions",
        "schema_name": "public",
        "description": "All financial transactions",
        "domain": "Retail Banking",
        "data_source": "Core Banking System",
        "sensitivity": "internal",
        "columns": [
            {"name": "transaction_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique transaction identifier"},
            {"name": "account_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "The account from which the transaction occurred"},
            {"name": "transaction_date", "data_type": "TIMESTAMP", "description": "Timestamp of the transaction"},
            {"name": "amount", "data_type": "DECIMAL(18,2)", "description": "Amount of the transaction"},
            {"name": "transaction_type", "data_type": "VARCHAR(50)", "description": "Type of transaction (e.g., deposit, withdrawal, transfer)"},
            {"name": "description", "data_type": "VARCHAR(255)", "description": "Description of the transaction"}
        ]
    },

    # ---------------- Lending Domain ----------------
    {
        "name": "loans",
        "schema_name": "public",
        "description": "Loan details and payment schedules",
        "domain": "Lending",
        "data_source": "Loan Origination System",
        "sensitivity": "confidential",
        "is_certified": True,
        "columns": [
            {"name": "loan_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique loan identifier"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the customer who took the loan"},
            {"name": "loan_type", "data_type": "VARCHAR(50)", "description": "Type of loan (e.g., mortgage, personal, auto)"},
            {"name": "loan_amount", "data_type": "DECIMAL(18,2)", "description": "Total amount of the loan"},
            {"name": "interest_rate", "data_type": "DECIMAL(5,2)", "description": "Annual interest rate"},
            {"name": "term_months", "data_type": "INTEGER", "description": "Loan term in months"},
            {"name": "start_date", "data_type": "DATE", "description": "Date the loan was originated"},
            {"name": "status", "data_type": "VARCHAR(20)", "description": "Loan status (e.g., active, paid_off, delinquent)"}
        ]
    },
    {
        "name": "credit_cards",
        "schema_name": "public",
        "description": "Credit card account information",
        "domain": "Lending",
        "data_source": "Credit Card Processing",
        "sensitivity": "restricted",
        "columns": [
            {"name": "card_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique credit card identifier"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the cardholder"},
            {"name": "card_number", "data_type": "VARCHAR(16)", "is_pii": True, "sensitivity_level": "restricted", "description": "Credit card number (PCI DSS compliant)"},
            {"name": "card_type", "data_type": "VARCHAR(20)", "description": "Card type (e.g., Visa, Mastercard)"},
            {"name": "credit_limit", "data_type": "DECIMAL(10,2)", "description": "Maximum credit limit"},
            {"name": "outstanding_balance", "data_type": "DECIMAL(10,2)", "description": "Current outstanding balance"}
        ]
    },

    # ---------------- Wealth Management Domain ----------------
    {
        "name": "investment_portfolios",
        "schema_name": "wealth",
        "description": "Customer investment holdings and allocations",
        "domain": "Wealth Management",
        "data_source": "Customer Data Hub",
        "sensitivity": "confidential",
        "columns": [
            {"name": "portfolio_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique portfolio identifier"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the customer"},
            {"name": "asset_class", "data_type": "VARCHAR(50)", "description": "Asset class (e.g., equity, bond, mutual fund)"},
            {"name": "market_value", "data_type": "DECIMAL(18,2)", "description": "Current market value of the holdings"},
            {"name": "last_updated", "data_type": "TIMESTAMP", "description": "Last valuation update time"}
        ]
    },

    # ---------------- Risk & Compliance Domain ----------------
    {
        "name": "fraud_alerts",
        "schema_name": "public",
        "description": "Automated fraud detection alerts",
        "domain": "Risk & Compliance",
        "data_source": "Fraud Detection Engine",
        "sensitivity": "confidential",
        "is_certified": True,
        "columns": [
            {"name": "alert_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique alert identifier"},
            {"name": "transaction_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the suspicious transaction"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Customer associated with the alert"},
            {"name": "alert_timestamp", "data_type": "TIMESTAMP", "description": "Time the alert was triggered"},
            {"name": "alert_reason", "data_type": "VARCHAR(255)", "description": "Reason for the alert"},
            {"name": "status", "data_type": "VARCHAR(20)", "description": "Alert status (e.g., pending, reviewed, closed)"},
            {"name": "analyst_notes", "data_type": "TEXT", "description": "Notes from the fraud analyst"}
        ]
    },
    {
        "name": "aml_flags",
        "schema_name": "reporting",
        "description": "Records of suspicious activity flagged for Anti-Money Laundering (AML) review",
        "domain": "Risk & Compliance",
        "data_source": "Regulatory Reporting Warehouse",
        "sensitivity": "restricted",
        "columns": [
            {"name": "flag_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique AML flag identifier"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the customer"},
            {"name": "flag_date", "data_type": "DATE", "description": "Date the activity was flagged"},
            {"name": "flag_reason", "data_type": "VARCHAR(255)", "description": "Reason for flagging"},
            {"name": "is_sar_filed", "data_type": "BOOLEAN", "description": "Whether a Suspicious Activity Report has been filed"},
            {"name": "reviewer_id", "data_type": "BIGINT", "description": "Reference to the compliance officer who reviewed the flag"}
        ]
    },

    # ---------------- Financial Markets Domain ----------------
    {
        "name": "market_trades",
        "schema_name": "markets",
        "description": "Trade-level data for securities and derivatives",
        "domain": "Financial Marketing",
        "data_source": "Market Data Feed",
        "sensitivity": "internal",
        "columns": [
            {"name": "trade_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique trade identifier"},
            {"name": "instrument", "data_type": "VARCHAR(50)", "description": "Traded instrument (e.g., AAPL, EUR/USD)"},
            {"name": "trade_date", "data_type": "TIMESTAMP", "description": "Trade execution timestamp"},
            {"name": "quantity", "data_type": "DECIMAL(18,4)", "description": "Trade quantity"},
            {"name": "price", "data_type": "DECIMAL(18,4)", "description": "Trade execution price"}
        ]
    },

    # ---------------- Treasury Management Domain ----------------
    {
        "name": "cash_positions",
        "schema_name": "treasury",
        "description": "Bank liquidity and cash flow positions",
        "domain": "Retail Banking",
        "data_source": "Treasury Management System",
        "sensitivity": "confidential",
        "columns": [
            {"name": "position_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique position identifier"},
            {"name": "currency", "data_type": "VARCHAR(3)", "description": "Currency code"},
            {"name": "amount", "data_type": "DECIMAL(18,2)", "description": "Cash position amount"},
            {"name": "as_of_date", "data_type": "DATE", "description": "Valuation date"}
        ]
    },

    # ---------------- Marketing Domain ----------------
    {
        "name": "customer_segments",
        "schema_name": "public",
        "description": "Customer segments for marketing campaigns",
        "domain": "Sales and Executive",
        "data_source": "CRM Platform",
        "sensitivity": "internal",
        "columns": [
            {"name": "segment_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique segment identifier"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the customer"},
            {"name": "segment_name", "data_type": "VARCHAR(100)", "description": "Name of the marketing segment"},
            {"name": "created_at", "data_type": "TIMESTAMP", "description": "Date the customer was assigned to the segment"}
        ]
    },

    # ---------------- Payments Domain ----------------
    {
        "name": "payment_transactions",
        "schema_name": "payments",
        "description": "Payments processed through UPI, SWIFT, NEFT/RTGS",
        "domain": "Retail Banking",
        "data_source": "Payments Gateway",
        "sensitivity": "restricted",
        "columns": [
            {"name": "payment_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique payment identifier"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the payer customer"},
            {"name": "amount", "data_type": "DECIMAL(18,2)", "description": "Payment amount"},
            {"name": "currency", "data_type": "VARCHAR(3)", "description": "Currency code"},
            {"name": "payment_channel", "data_type": "VARCHAR(50)", "description": "Payment channel (e.g., UPI, SWIFT, NEFT)"},
            {"name": "status", "data_type": "VARCHAR(20)", "description": "Payment status (pending, settled, failed)"},
            {"name": "initiated_at", "data_type": "TIMESTAMP", "description": "Payment initiation time"}
        ]
    },

    # ---------------- HR & Payroll Domain ----------------
    {
        "name": "employees",
        "schema_name": "hr",
        "description": "Employee master data",
        "domain": "Risk & Compliance",
        "data_source": "HR & Payroll System",
        "sensitivity": "confidential",
        "columns": [
            {"name": "employee_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique employee identifier"},
            {"name": "first_name", "data_type": "VARCHAR(100)", "is_pii": True, "description": "First name"},
            {"name": "last_name", "data_type": "VARCHAR(100)", "is_pii": True, "description": "Last name"},
            {"name": "department", "data_type": "VARCHAR(100)", "description": "Department name"},
            {"name": "role", "data_type": "VARCHAR(100)", "description": "Job role"},
            {"name": "hire_date", "data_type": "DATE", "description": "Hire date"}
        ]
    }
]

BANK_TAGS = [
    {"name": "PII", "description": "Personally Identifiable Information", "color": "#EF4444"},
    {"name": "Sensitive", "description": "Data requiring special protection", "color": "#DC2626"},
    {"name": "Confidential", "description": "Internal business data", "color": "#F59E0B"},
    {"name": "Financial", "description": "Financial transaction data", "color": "#10B981"},
    {"name": "Transactional", "description": "Data representing a transaction", "color": "#3B82F6"},
    {"name": "Customer", "description": "Customer-related data", "color": "#059669"},
    {"name": "Regulatory", "description": "Data used for regulatory reporting", "color": "#9333EA"},
    {"name": "Core Banking", "description": "Data from the core banking system", "color": "#2563EB"},
    {"name": "Security", "description": "Security-related data", "color": "#F59E0B"},
    {"name": "Analytics", "description": "Data primarily for analytics and BI", "color": "#6B7280"},
    {"name": "Investment", "description": "Investment portfolios and holdings data", "color": "#8B5CF6"},
    {"name": "Portfolio", "description": "Customer portfolio allocations", "color": "#7C3AED"},
    {"name": "Payment", "description": "Payment processing data", "color": "#0EA5E9"},
    {"name": "Settlement", "description": "Clearing and settlement data", "color": "#14B8A6"},
    {"name": "Employee", "description": "Employee master and payroll data", "color": "#F43F5E"},
    {"name": "HR", "description": "Human resources related data", "color": "#F472B6"},
    {"name": "AML", "description": "Anti-Money Laundering related data", "color": "#9333EA"},
    {"name": "Fraud", "description": "Fraud monitoring and alerts", "color": "#EF4444"},
    {"name": "Audit", "description": "Audit and control data", "color": "#F59E0B"},
    {"name": "Market", "description": "Market and trading data", "color": "#8B5CF6"},
    {"name": "Securities", "description": "Data about stocks, bonds, derivatives", "color": "#6D28D9"},
    {"name": "Derivatives", "description": "Derivative trading and positions", "color": "#5B21B6"},
    {"name": "Metadata", "description": "Information about data schema, quality, lineage", "color": "#4B5563"},
    {"name": "Data Lake", "description": "Raw or curated data stored in lake", "color": "#2563EB"},
    {"name": "Streaming", "description": "Streaming or real-time data", "color": "#0284C7"},
]


LINEAGE_JOBS = [
    # Existing jobs
    {"id": 1, "name": 'ETL_Daily_Pipeline', "description": 'Daily ETL process for customer data',"external_job_id": 'etl_daily_001', "job_type": 'airflow', "schedule": '0 0 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,7,0,0), "next_run_at": datetime(2025,9,25,7,0,0),"last_run_status": 'success', "job_config": {}, "owner_id": 1, "is_active": True,"created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
    {"id": 2, "name": 'Loan_Processing_Job', "description": 'Processes loan data aggregation',"external_job_id": 'loan_proc_002', "job_type": 'spark', "schedule": '0 2 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,2,0,0), "next_run_at": datetime(2025,9,25,2,0,0),"last_run_status": 'success', "job_config": {}, "owner_id": 2, "is_active": True,"created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
    {"id": 3, "name": 'Fraud_Detection_Job', "description": 'Detects suspicious transactions',"external_job_id": 'fraud_detect_003', "job_type": 'spark', "schedule": '0 4 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,4,0,0), "next_run_at": datetime(2025,9,25,4,0,0),"last_run_status": 'running', "job_config": {}, "owner_id": 3, "is_active": True,"created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
    {"id": 4, "name": 'Customer_Segmentation', "description": 'Generates customer segments',"external_job_id": 'segm_004', "job_type": 'dbt', "schedule": '0 6 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,6,0,0), "next_run_at": datetime(2025,9,25,6,0,0),"last_run_status": 'success', "job_config": {}, "owner_id": 4, "is_active": True,"created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
    {"id": 5, "name": 'AML_Processing', "description": 'Anti-Money Laundering data processing',"external_job_id": 'aml_proc_005', "job_type": 'airflow', "schedule": '0 8 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,8,0,0), "next_run_at": datetime(2025,9,25,8,0,0),"last_run_status": 'failed', "job_config": {}, "owner_id": 5, "is_active": True,"created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
    {"id": 6, "name": 'Credit_Card_Reconciliation', "description": 'Daily reconciliation of credit card transactions',"external_job_id": 'cc_recon_006', "job_type": 'airflow', "schedule": '30 1 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,1,30,0), "next_run_at": datetime(2025,9,25,1,30,0),"last_run_status": 'success', "job_config": {}, "owner_id": 2, "is_active": True,"created_at": datetime(2025,9,24,8,0,0), "updated_at": datetime(2025,9,24,8,0,0)},
    {"id": 7, "name": 'Mortgage_Portfolio_Update', "description": 'Updates mortgage portfolio metrics and balances',"external_job_id": 'mortgage_port_007', "job_type": 'spark', "schedule": '0 3 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,3,0,0), "next_run_at": datetime(2025,9,25,3,0,0),"last_run_status": 'success', "job_config": {}, "owner_id": 2, "is_active": True,"created_at": datetime(2025,9,24,8,5,0), "updated_at": datetime(2025,9,24,8,5,0)},
    {"id": 8, "name": 'Wealth_Portfolio_Analytics', "description": 'Daily analytics for wealth management portfolios',"external_job_id": 'wealth_analytics_008', "job_type": 'dbt', "schedule": '0 5 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,5,0,0), "next_run_at": datetime(2025,9,25,5,0,0),"last_run_status": 'success', "job_config": {}, "owner_id": 4, "is_active": True,"created_at": datetime(2025,9,24,8,10,0), "updated_at": datetime(2025,9,24,8,10,0)},
    {"id": 9, "name": 'Market_Data_Ingestion', "description": 'Ingests financial market and trading data',"external_job_id": 'market_ingest_009', "job_type": 'spark', "schedule": '0 23 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,23,0,0), "next_run_at": datetime(2025,9,25,23,0,0),"last_run_status": 'running', "job_config": {}, "owner_id": 5, "is_active": True,"created_at": datetime(2025,9,24,8,15,0), "updated_at": datetime(2025,9,24,8,15,0)},
    {"id": 10, "name": 'Regulatory_Report_Generation', "description": 'Generates daily regulatory reports (e.g., Basel, AML)',"external_job_id": 'reg_report_010', "job_type": 'airflow', "schedule": '0 22 * * *',"is_scheduled": True, "last_run_at": datetime(2025,9,24,22,0,0), "next_run_at": datetime(2025,9,25,22,0,0),"last_run_status": 'success', "job_config": {}, "owner_id": 5, "is_active": True,"created_at": datetime(2025,9,24,8,20,0), "updated_at": datetime(2025,9,24,8,20,0)},
]

LINEAGE_EDGES = [
    # ----------------- TABLE_TO_TABLE edges -----------------
    {"id": 1, "source_table_id": 1, "source_column_id": None, "target_table_id": 2, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'MANUAL', "transformation_logic": 'JOIN ON customer_id',"transformation_type": 'join', "job_id": 1, "execution_context": {}, "confidence_score": 100,"is_verified": True, "verified_by": 1, "verified_at": datetime(2025, 9, 24, 8, 0, 0),"is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7), "updated_at": datetime(2025, 9, 24, 7, 48, 7),"last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 2, "source_table_id": 2, "source_column_id": None, "target_table_id": 3, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'ETL_METADATA', "transformation_logic": 'INSERT INTO transactions FROM accounts',"transformation_type": 'insert', "job_id": 1, "execution_context": {"dag_id": "etl_daily"}, "confidence_score": 95,"is_verified": False, "verified_by": None, "verified_at": None, "is_active": True,"created_at": datetime(2025, 9, 24, 7, 48, 7), "updated_at": datetime(2025, 9, 24, 7, 48, 7),"last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 3, "source_table_id": 3, "source_column_id": None, "target_table_id": 4, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'QUERY_LOG', "transformation_logic": 'SELECT * FROM transactions JOIN accounts',"transformation_type": 'select', "job_id": 2, "execution_context": {}, "confidence_score": 90,"is_verified": True, "verified_by": 2, "verified_at": datetime(2025, 9, 24, 9, 0, 0),"is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7), "updated_at": datetime(2025, 9, 24, 7, 48, 7),"last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 4, "source_table_id": 4, "source_column_id": None, "target_table_id": 5, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'MANUAL', "transformation_logic": 'AGGREGATE payments',"transformation_type": 'aggregation', "job_id": 2, "execution_context": {}, "confidence_score": 100,"is_verified": False, "verified_by": None, "verified_at": None, "is_active": True,"created_at": datetime(2025, 9, 24, 7, 48, 7), "updated_at": datetime(2025, 9, 24, 7, 48, 7),"last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 5, "source_table_id": 5, "source_column_id": None, "target_table_id": 6, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'INFERRED', "transformation_logic": 'FILTER suspicious transactions',"transformation_type": 'filter', "job_id": 3, "execution_context": {"spark_job": "fraud_detection"}, "confidence_score": 85,"is_verified": True, "verified_by": 3, "verified_at": datetime(2025, 9, 24, 10, 0, 0), "is_active": True,"created_at": datetime(2025, 9, 24, 7, 48, 7), "updated_at": datetime(2025, 9, 24, 7, 48, 7),"last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 6, "source_table_id": 6, "source_column_id": None, "target_table_id": 7, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'API_REPORTED', "transformation_logic": 'UPDATE aml_flags FROM fraud_alerts',"transformation_type": 'update', "job_id": 3, "execution_context": {}, "confidence_score": 95, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 7, "source_table_id": 7, "source_column_id": None, "target_table_id": 8, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'MANUAL', "transformation_logic": 'JOIN aml_flags WITH segments',"transformation_type": 'join', "job_id": 4, "execution_context": {}, "confidence_score": 100, "is_verified": True,"verified_by": 4, "verified_at": datetime(2025, 9, 24, 11, 0, 0), "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 8, "source_table_id": 1, "source_column_id": None, "target_table_id": 9, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'QUERY_LOG', "transformation_logic": 'SEGMENT customers',"transformation_type": 'aggregation', "job_id": 5, "execution_context": {}, "confidence_score": 95, "is_verified": True,"verified_by": 5, "verified_at": datetime(2025, 9, 24, 12, 0, 0), "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 9, "source_table_id": 9, "source_column_id": None, "target_table_id": 10, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'ETL_METADATA', "transformation_logic": 'MERGE into reporting',"transformation_type": 'merge', "job_id": 6, "execution_context": {}, "confidence_score": 90, "is_verified": True,"verified_by": 6, "verified_at": datetime(2025, 9, 24, 13, 0, 0), "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 10, "source_table_id": 8, "source_column_id": None, "target_table_id": 1, "target_column_id": None,"lineage_type": LineageTypeEnum.TABLE_TO_TABLE, "source_type": 'MANUAL', "transformation_logic": 'FEED BACK TO customers',"transformation_type": 'merge', "job_id": 7, "execution_context": {}, "confidence_score": 95, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},

    # ----------------- COLUMN_TO_COLUMN edges -----------------
    {"id": 11, "source_table_id": None, "source_column_id": 1, "target_table_id": None, "target_column_id": 2,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'MANUAL', "transformation_logic": 'customer_id = account_customer_id',"transformation_type": 'mapping', "job_id": 1, "execution_context": {}, "confidence_score": 100, "is_verified": True,"verified_by": 1, "verified_at": datetime(2025, 9, 24, 8, 0, 0), "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 12, "source_table_id": None, "source_column_id": 2, "target_table_id": None, "target_column_id": 3,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'INFERRED', "transformation_logic": 'amount > threshold',"transformation_type": 'filter', "job_id": 2, "execution_context": {}, "confidence_score": 85, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 13, "source_table_id": None, "source_column_id": 3, "target_table_id": None, "target_column_id": 4,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'QUERY_LOG', "transformation_logic": 'credit_score FROM credit_cards',"transformation_type": 'select', "job_id": 3, "execution_context": {}, "confidence_score": 90, "is_verified": True,"verified_by": 2, "verified_at": datetime(2025, 9, 24, 9, 0, 0), "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 14, "source_table_id": None, "source_column_id": 4, "target_table_id": None, "target_column_id": 5,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'MANUAL', "transformation_logic": 'alert_level TO fraud_alerts',"transformation_type": 'insert', "job_id": 4, "execution_context": {}, "confidence_score": 100, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 15, "source_table_id": None, "source_column_id": 5, "target_table_id": None, "target_column_id": 6,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'INFERRED', "transformation_logic": 'transaction_type = txn_type',"transformation_type": 'mapping', "job_id": 5, "execution_context": {}, "confidence_score": 95, "is_verified": True,"verified_by": 3, "verified_at": datetime(2025, 9, 24, 10, 0, 0), "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 16, "source_table_id": None, "source_column_id": 6, "target_table_id": None, "target_column_id": 7,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'API_REPORTED', "transformation_logic": 'segment_id = customer_segment',"transformation_type": 'mapping', "job_id": 6, "execution_context": {}, "confidence_score": 90, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 17, "source_table_id": None, "source_column_id": 7, "target_table_id": None, "target_column_id": 8,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'MANUAL', "transformation_logic": 'loan_id = credit_loan_id',"transformation_type": 'mapping', "job_id": 7, "execution_context": {}, "confidence_score": 100, "is_verified": True,"verified_by": 4, "verified_at": datetime(2025, 9, 24, 11, 0, 0), "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 18, "source_table_id": None, "source_column_id": 8, "target_table_id": None, "target_column_id": 9,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'QUERY_LOG', "transformation_logic": 'balance = account_balance',"transformation_type": 'mapping', "job_id": 8, "execution_context": {}, "confidence_score": 95, "is_verified": True,"verified_by": 5, "verified_at": datetime(2025, 9, 24, 12, 0, 0), "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 19, "source_table_id": None, "source_column_id": 9, "target_table_id": None, "target_column_id": 10,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'INFERRED', "transformation_logic": 'risk_score = calculated_risk',"transformation_type": 'mapping', "job_id": 9, "execution_context": {}, "confidence_score": 90, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
    {"id": 20, "source_table_id": None, "source_column_id": 10, "target_table_id": None, "target_column_id": 1,"lineage_type": LineageTypeEnum.COLUMN_TO_COLUMN, "source_type": 'API_REPORTED', "transformation_logic": 'customer_segment = segment_id',"transformation_type": 'mapping', "job_id": 10, "execution_context": {}, "confidence_score": 100, "is_verified": True,"verified_by": 6, "verified_at": datetime(2025, 9, 24, 13, 0, 0), "is_active": True, "created_at": datetime(2025, 9, 24, 7, 48, 7),"updated_at": datetime(2025, 9, 24, 7, 48, 7), "last_observed_at": datetime(2025, 9, 24, 7, 48, 7)},
     # ----------------- TABLE_TO_COLUMN -----------------
    {"id": 21, "source_table_id": 2, "source_column_id": None, "target_table_id": None, "target_column_id": 5,"lineage_type": LineageTypeEnum.TABLE_TO_COLUMN, "source_type": 'MANUAL', "transformation_logic": 'accounts.balance TO total_balance',"transformation_type": 'aggregation', "job_id": 6, "execution_context": {}, "confidence_score": 95, "is_verified": True,"verified_by": 2, "verified_at": datetime(2025, 9, 24, 13, 0, 0), "is_active": True,"created_at": datetime(2025, 9, 24, 7, 50, 0), "updated_at": datetime(2025, 9, 24, 7, 50, 0), "last_observed_at": datetime(2025, 9, 24, 7, 50, 0)},
    {"id": 22, "source_table_id": 3, "source_column_id": None, "target_table_id": None, "target_column_id": 6,"lineage_type": LineageTypeEnum.TABLE_TO_COLUMN, "source_type": 'INFERRED', "transformation_logic": 'transactions.amount TO flagged_amount',"transformation_type": 'filter', "job_id": 7, "execution_context": {"spark_job": "fraud_check"}, "confidence_score": 90, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True,"created_at": datetime(2025, 9, 24, 7, 51, 0), "updated_at": datetime(2025, 9, 24, 7, 51, 0), "last_observed_at": datetime(2025, 9, 24, 7, 51, 0)},
    {"id": 23, "source_table_id": 4, "source_column_id": None, "target_table_id": None, "target_column_id": 7,"lineage_type": LineageTypeEnum.TABLE_TO_COLUMN, "source_type": 'QUERY_LOG', "transformation_logic": 'loans.principal TO total_loans',"transformation_type": 'aggregation', "job_id": 8, "execution_context": {}, "confidence_score": 85, "is_verified": True,"verified_by": 3, "verified_at": datetime(2025, 9, 24, 14, 0, 0), "is_active": True,"created_at": datetime(2025, 9, 24, 7, 52, 0), "updated_at": datetime(2025, 9, 24, 7, 52, 0), "last_observed_at": datetime(2025, 9, 24, 7, 52, 0)},
    {"id": 24, "source_table_id": 5, "source_column_id": None, "target_table_id": None, "target_column_id": 8,"lineage_type": LineageTypeEnum.TABLE_TO_COLUMN, "source_type": 'ETL_METADATA', "transformation_logic": 'credit_cards.credit_score TO risk_score',"transformation_type": 'transform', "job_id": 9, "execution_context": {"airflow_dag": "risk_pipeline"}, "confidence_score": 95, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True,"created_at": datetime(2025, 9, 24, 7, 53, 0), "updated_at": datetime(2025, 9, 24, 7, 53, 0), "last_observed_at": datetime(2025, 9, 24, 7, 53, 0)},
    {"id": 25, "source_table_id": 6, "source_column_id": None, "target_table_id": None, "target_column_id": 9,"lineage_type": LineageTypeEnum.TABLE_TO_COLUMN, "source_type": 'MANUAL', "transformation_logic": 'fraud_alerts.alert_level TO alert_status',"transformation_type": 'mapping', "job_id": 10, "execution_context": {}, "confidence_score": 100, "is_verified": True,"verified_by": 4, "verified_at": datetime(2025, 9, 24, 15, 0, 0), "is_active": True,"created_at": datetime(2025, 9, 24, 7, 54, 0), "updated_at": datetime(2025, 9, 24, 7, 54, 0), "last_observed_at": datetime(2025, 9, 24, 7, 54, 0)},
# ----------------- COLUMN_TO_TABLE -----------------
    {"id": 26, "source_table_id": None, "source_column_id": 10, "target_table_id": 7, "target_column_id": None,"lineage_type": LineageTypeEnum.COLUMN_TO_TABLE, "source_type": 'MANUAL', "transformation_logic": 'segment_id TO customer_segments_table',"transformation_type": 'insert', "job_id": 6, "execution_context": {}, "confidence_score": 100, "is_verified": True,"verified_by": 5, "verified_at": datetime(2025, 9, 24, 16, 0, 0), "is_active": True,"created_at": datetime(2025, 9, 24, 7, 55, 0), "updated_at": datetime(2025, 9, 24, 7, 55, 0), "last_observed_at": datetime(2025, 9, 24, 7, 55, 0)},
    {"id": 27, "source_table_id": None, "source_column_id": 11, "target_table_id": 8, "target_column_id": None,"lineage_type": LineageTypeEnum.COLUMN_TO_TABLE, "source_type": 'INFERRED', "transformation_logic": 'transaction_type TO transaction_summary',"transformation_type": 'insert', "job_id": 7, "execution_context": {"spark_job": "transaction_summary"}, "confidence_score": 90, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True,"created_at": datetime(2025, 9, 24, 7, 56, 0), "updated_at": datetime(2025, 9, 24, 7, 56, 0), "last_observed_at": datetime(2025, 9, 24, 7, 56, 0)},
    {"id": 28, "source_table_id": None, "source_column_id": 12, "target_table_id": 9, "target_column_id": None,"lineage_type": LineageTypeEnum.COLUMN_TO_TABLE, "source_type": 'QUERY_LOG', "transformation_logic": 'customer_id TO customer_activity_table',"transformation_type": 'insert', "job_id": 8, "execution_context": {}, "confidence_score": 95, "is_verified": True,"verified_by": 6, "verified_at": datetime(2025, 9, 24, 17, 0, 0), "is_active": True,"created_at": datetime(2025, 9, 24, 7, 57, 0), "updated_at": datetime(2025, 9, 24, 7, 57, 0), "last_observed_at": datetime(2025, 9, 24, 7, 57, 0)},
    {"id": 29, "source_table_id": None, "source_column_id": 13, "target_table_id": 10, "target_column_id": None,"lineage_type": LineageTypeEnum.COLUMN_TO_TABLE, "source_type": 'ETL_METADATA', "transformation_logic": 'amount TO total_payments_table', "transformation_type": 'transform', "job_id": 9, "execution_context": {"airflow_dag": "payments_pipeline"}, "confidence_score": 90, "is_verified": False,"verified_by": None, "verified_at": None, "is_active": True,"created_at": datetime(2025, 9, 24, 7, 58, 0), "updated_at": datetime(2025, 9, 24, 7, 58, 0), "last_observed_at": datetime(2025, 9, 24, 7, 58, 0)},
    {"id": 30, "source_table_id": None, "source_column_id": 14, "target_table_id": 1, "target_column_id": None,"lineage_type": LineageTypeEnum.COLUMN_TO_TABLE, "source_type": 'MANUAL', "transformation_logic": 'loyalty_points TO customer_summary_table',"transformation_type": 'insert', "job_id": 10, "execution_context": {}, "confidence_score": 100, "is_verified": True,"verified_by": 1, "verified_at": datetime(2025, 9, 24, 18, 0, 0), "is_active": True,"created_at": datetime(2025, 9, 24, 7, 59, 0), "updated_at": datetime(2025, 9, 24, 7, 59, 0), "last_observed_at": datetime(2025, 9, 24, 7, 59, 0)},

]


LINEAGE_JOB_RUNS = [
    # Table-to-Table Jobs
    {"id": 1, "job_id": 1, "run_id": 'run_001_20250924', "started_at": datetime(2025,9,24,8,0,0), "ended_at": datetime(2025,9,24,8,15,0), "status": 'success', "tables_processed": 5, "lineage_edges_created": 8, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"pipeline": "daily_transactions"}, "created_at": datetime(2025,9,24,8,15,0)},
    {"id": 2, "job_id": 2, "run_id": 'run_002_20250924', "started_at": datetime(2025,9,24,9,0,0), "ended_at": datetime(2025,9,24,9,30,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 5, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"pipeline": "customer_accounts"}, "created_at": datetime(2025,9,24,9,30,0)},
    {"id": 3, "job_id": 3, "run_id": 'run_003_20250924', "started_at": datetime(2025,9,24,10,0,0), "ended_at": datetime(2025,9,24,10,45,0), "status": 'failed', "tables_processed": 4, "lineage_edges_created": 6, "lineage_edges_updated": 0, "error_message": 'Timeout error', "error_details": {"timeout": 300}, "execution_context": {"pipeline": "loan_processing"}, "created_at": datetime(2025,9,24,10,45,0)},
    {"id": 4, "job_id": 4, "run_id": 'run_004_20250924', "started_at": datetime(2025,9,24,11,0,0), "ended_at": datetime(2025,9,24,11,20,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 3, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"pipeline": "credit_score_update"}, "created_at": datetime(2025,9,24,11,20,0)},
    {"id": 5, "job_id": 5, "run_id": 'run_005_20250924', "started_at": datetime(2025,9,24,12,0,0), "ended_at": None, "status": 'running', "tables_processed": 1, "lineage_edges_created": 0, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"pipeline": "fraud_detection"}, "created_at": datetime(2025,9,24,12,0,0)},
    {"id": 6, "job_id": 6, "run_id": 'run_006_20250924', "started_at": datetime(2025,9,24,13,0,0), "ended_at": datetime(2025,9,24,13,30,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 4, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"pipeline": "payments_reconciliation"}, "created_at": datetime(2025,9,24,13,30,0)},
    {"id": 7, "job_id": 7, "run_id": 'run_007_20250924', "started_at": datetime(2025,9,24,14,0,0), "ended_at": datetime(2025,9,24,14,45,0), "status": 'failed', "tables_processed": 2, "lineage_edges_created": 3, "lineage_edges_updated": 0, "error_message": 'Data mismatch', "error_details": {"field": "account_balance"}, "execution_context": {"pipeline": "transaction_summary"}, "created_at": datetime(2025,9,24,14,45,0)},
    {"id": 8, "job_id": 8, "run_id": 'run_008_20250924', "started_at": datetime(2025,9,24,15,0,0), "ended_at": datetime(2025,9,24,15,20,0), "status": 'success', "tables_processed": 4, "lineage_edges_created": 6, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"pipeline": "customer_loyalty"}, "created_at": datetime(2025,9,24,15,20,0)},
    {"id": 9, "job_id": 9, "run_id": 'run_009_20250924', "started_at": datetime(2025,9,24,16,0,0), "ended_at": datetime(2025,9,24,16,30,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 5, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"pipeline": "investment_portfolio"}, "created_at": datetime(2025,9,24,16,30,0)},
    {"id": 10, "job_id": 10, "run_id": 'run_010_20250924', "started_at": datetime(2025,9,24,17,0,0), "ended_at": None, "status": 'running', "tables_processed": 2, "lineage_edges_created": 0, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"pipeline": "risk_reporting"}, "created_at": datetime(2025,9,24,17,0,0)},

    # Column-to-Column Jobs
    {"id": 11, "job_id": 1, "run_id": 'run_011_20250924', "started_at": datetime(2025,9,24,18,0,0), "ended_at": datetime(2025,9,24,18,15,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 5, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"pipeline": "account_metadata"}, "created_at": datetime(2025,9,24,18,15,0)},
    {"id": 12, "job_id": 2, "run_id": 'run_012_20250924', "started_at": datetime(2025,9,24,19,0,0), "ended_at": datetime(2025,9,24,19,30,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 6, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"pipeline": "loan_metadata"}, "created_at": datetime(2025,9,24,19,30,0)},
    {"id": 13, "job_id": 3, "run_id": 'run_013_20250924', "started_at": datetime(2025,9,24,20,0,0), "ended_at": datetime(2025,9,24,20,20,0), "status": 'failed', "tables_processed": 1, "lineage_edges_created": 2, "lineage_edges_updated": 0, "error_message": 'Column mapping error', "error_details": {"column": "transaction_date"}, "execution_context": {"pipeline": "payments_metadata"}, "created_at": datetime(2025,9,24,20,20,0)},
    {"id": 14, "job_id": 4, "run_id": 'run_014_20250924', "started_at": datetime(2025,9,24,21,0,0), "ended_at": datetime(2025,9,24,21,30,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 3, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"pipeline": "credit_metadata"}, "created_at": datetime(2025,9,24,21,30,0)},
    {"id": 15, "job_id": 5, "run_id": 'run_015_20250924', "started_at": datetime(2025,9,24,22,0,0), "ended_at": None, "status": 'running', "tables_processed": 1, "lineage_edges_created": 0, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"pipeline": "fraud_metadata"}, "created_at": datetime(2025,9,24,22,0,0)},
    {"id": 16, "job_id": 6, "run_id": 'run_016_20250924', "started_at": datetime(2025,9,24,23,0,0), "ended_at": datetime(2025,9,24,23,20,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 4, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"pipeline": "reconciliation_metadata"}, "created_at": datetime(2025,9,24,23,20,0)},
    {"id": 17, "job_id": 7, "run_id": 'run_017_20250925', "started_at": datetime(2025,9,25,0,0,0), "ended_at": datetime(2025,9,25,0,30,0), "status": 'failed', "tables_processed": 2, "lineage_edges_created": 3, "lineage_edges_updated": 0, "error_message": 'Schema mismatch', "error_details": {"column": "customer_id"}, "execution_context": {"pipeline": "transaction_metadata"}, "created_at": datetime(2025,9,25,0,30,0)},
    {"id": 18, "job_id": 8, "run_id": 'run_018_20250925', "started_at": datetime(2025,9,25,1,0,0), "ended_at": datetime(2025,9,25,1,30,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 5, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"pipeline": "loyalty_metadata"}, "created_at": datetime(2025,9,25,1,30,0)},
    {"id": 19, "job_id": 9, "run_id": 'run_019_20250925', "started_at": datetime(2025,9,25,2,0,0), "ended_at": datetime(2025,9,25,2,20,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 4, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"pipeline": "portfolio_metadata"}, "created_at": datetime(2025,9,25,2,20,0)},
    {"id": 20, "job_id": 10, "run_id": 'run_020_20250925', "started_at": datetime(2025,9,25,3,0,0), "ended_at": None, "status": 'running', "tables_processed": 1, "lineage_edges_created": 0, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"pipeline": "risk_metadata"}, "created_at": datetime(2025,9,25,3,0,0)},
]


LINEAGE_IMPACT_ANALYSIS = [
    # Retail Banking Domain
    {"id": 1, "table_id": 1, "upstream_table_count": 0, "upstream_column_count": 0, "max_upstream_depth": 0,
     "downstream_table_count": 5, "downstream_column_count": 2, "max_downstream_depth": 3, "is_critical_path": True,
     "criticality_score": 90, "impact_radius": 3, "upstream_tables": [], "downstream_tables": [2, 3, 4, 9, 10],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    {"id": 2, "table_id": 2, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 1,
     "downstream_table_count": 3, "downstream_column_count": 2, "max_downstream_depth": 3, "is_critical_path": True,
     "criticality_score": 85, "impact_radius": 3, "upstream_tables": [1], "downstream_tables": [3, 5, 6],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    {"id": 3, "table_id": 3, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 2,
     "downstream_table_count": 2, "downstream_column_count": 2, "max_downstream_depth": 2, "is_critical_path": True,
     "criticality_score": 80, "impact_radius": 2, "upstream_tables": [2], "downstream_tables": [4, 6],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    # Lending Domain
    {"id": 4, "table_id": 4, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 3,
     "downstream_table_count": 2, "downstream_column_count": 1, "max_downstream_depth": 2, "is_critical_path": True,
     "criticality_score": 85, "impact_radius": 2, "upstream_tables": [3], "downstream_tables": [5, 8],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    {"id": 5, "table_id": 5, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 4,
     "downstream_table_count": 1, "downstream_column_count": 1, "max_downstream_depth": 1, "is_critical_path": False,
     "criticality_score": 70, "impact_radius": 1, "upstream_tables": [4], "downstream_tables": [6],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    # Wealth Management Domain
    {"id": 6, "table_id": 6, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 5,
     "downstream_table_count": 1, "downstream_column_count": 1, "max_downstream_depth": 1, "is_critical_path": True,
     "criticality_score": 75, "impact_radius": 1, "upstream_tables": [5], "downstream_tables": [7],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    # Risk & Compliance Domain
    {"id": 7, "table_id": 7, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 6,
     "downstream_table_count": 1, "downstream_column_count": 1, "max_downstream_depth": 1, "is_critical_path": True,
     "criticality_score": 80, "impact_radius": 1, "upstream_tables": [6], "downstream_tables": [8],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    {"id": 8, "table_id": 8, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 7,
     "downstream_table_count": 1, "downstream_column_count": 0, "max_downstream_depth": 0, "is_critical_path": False,
     "criticality_score": 65, "impact_radius": 0, "upstream_tables": [7], "downstream_tables": [],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    # Financial Markets Domain
    {"id": 9, "table_id": 9, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 1,
     "downstream_table_count": 1, "downstream_column_count": 0, "max_downstream_depth": 0, "is_critical_path": False,
     "criticality_score": 60, "impact_radius": 0, "upstream_tables": [1], "downstream_tables": [],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    # Treasury Management Domain
    {"id": 10, "table_id": 10, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 1,
     "downstream_table_count": 0, "downstream_column_count": 0, "max_downstream_depth": 0, "is_critical_path": False,
     "criticality_score": 55, "impact_radius": 0, "upstream_tables": [9], "downstream_tables": [],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    # Marketing Domain
    {"id": 11, "table_id": 11, "upstream_table_count": 0, "upstream_column_count": 0, "max_upstream_depth": 0,
     "downstream_table_count": 0, "downstream_column_count": 0, "max_downstream_depth": 0, "is_critical_path": False,
     "criticality_score": 50, "impact_radius": 0, "upstream_tables": [], "downstream_tables": [],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    # Payments Domain
    {"id": 12, "table_id": 12, "upstream_table_count": 0, "upstream_column_count": 0, "max_upstream_depth": 0,
     "downstream_table_count": 0, "downstream_column_count": 0, "max_downstream_depth": 0, "is_critical_path": False,
     "criticality_score": 50, "impact_radius": 0, "upstream_tables": [], "downstream_tables": [],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),
     "updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    # HR & Payroll Domain
    {"id": 13, "table_id": 13, "upstream_table_count": 0, "upstream_column_count": 0, "max_upstream_depth": 0,
     "downstream_table_count": 0, "downstream_column_count": 0, "max_downstream_depth": 0, "is_critical_path": False,
     "criticality_score": 50, "impact_radius": 0, "upstream_tables": [], "downstream_tables": [],
     "analysis_version": '1.1', "last_computed_at": datetime(2025, 9, 26, 7, 37, 0), "created_at": datetime(2025, 9, 26, 7, 37, 0),"updated_at": datetime(2025, 9, 26, 7, 37, 0)},
    ]
def create_sample_data():
    """Generate sample banking data."""
    
    # Database connection
    engine = create_engine(os.getenv("DATABASE_URL", settings.database_url))
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("Generating sample banking data...")
        
        # Create database tables first
        print(" Creating database tables...")
        Base.metadata.create_all(engine)
        
        # --- MODIFICATION 1: Capture all created objects into lists ---
        
        # Create users
        print(" Creating users...")
        user_map = {}
        created_users = []  # List to store user objects in order
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
            created_users.append(user)
        
        # Create domains
        print("Creating domains...")
        domain_map = {}
        for i, domain_data in enumerate(BANK_DOMAINS):
            steward = created_users[i % len(created_users)] # Use the created_users list
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
        print("Creating data sources...")
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
        print(" Creating tags...")
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
        print("Creating tables and columns...")
        created_tables = []
        created_columns = []
        for table_data in BANK_TABLES:
            domain = domain_map[table_data["domain"]]
            data_source = data_source_map[table_data["data_source"]]
            owner = random.choice(created_users)
            
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
            db.flush() # Flush to get table.id
            created_tables.append(table)
            
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
                    sensitivity_level=col_data.get("sensitivity_level", table.sensitivity_level),
                    ordinal_position=i + 1,
                    is_nullable=not col_data.get("is_primary_key", False)
                )
                db.add(column)
                db.flush() # Flush to get column.id
                created_columns.append(column)
            
            # Create table stats
            stats = TableStats(
                table_id=table.id,
                row_count=random.randint(10000, 5000000),
                size_bytes=random.randint(1024*1024*10, 1024*1024*1024*5),
                quality_score=random.randint(85, 100),
                query_count_last_30d=random.randint(50, 2000),
                unique_users_last_30d=random.randint(5, 50),
                last_updated=datetime.utcnow() - timedelta(days=random.randint(0, 15))
            )
            db.add(stats)
            
            # Add some tags to tables
            relevant_tags = []
            if "customer" in table_data["name"].lower() or any(col.get("is_pii") for col in table_data["columns"]):
                relevant_tags.extend([tag_map["PII"], tag_map["Customer"], tag_map["Sensitive"]])
            if "transaction" in table_data["name"].lower():
                relevant_tags.extend([tag_map["Financial"], tag_map["Transactional"], tag_map["Core Banking"]])
            if "loan" in table_data["name"].lower() or "credit_card" in table_data["name"].lower():
                relevant_tags.extend([tag_map["Financial"], tag_map["Confidential"]])
            if "fraud" in table_data["name"].lower() or "aml" in table_data["name"].lower():
                relevant_tags.extend([tag_map["Regulatory"], tag_map["Security"], tag_map["Sensitive"]])
            
            # Add tags to table
            for tag in relevant_tags[:3]:
                table_tag = TableTag(
                    table_id=table.id,
                    tag_id=tag.id,
                    created_by=owner.id
                )
                db.add(table_tag)
        
  
        # --- MODIFICATION 2: Map placeholder owner_id to actual user ID ---
        print(" Creating lineage jobs...")
        created_jobs = []
        for job_entry in LINEAGE_JOBS:
            job_data = job_entry.copy()
            owner_index = job_data["owner_id"] - 1
            if 0 <= owner_index < len(created_users):
                owner_user = created_users[owner_index]
                job_data["owner_id"] = owner_user.id
                job = LineageJob(**job_data)
                db.add(job)
                db.flush()
                created_jobs.append(job)
            else:
                print(f"Warning: Invalid owner_id '{job_entry['owner_id']}' for job '{job_entry['name']}'. Skipping.")

        # --- MODIFICATION 3: Map ALL placeholder FKs in edges to actual IDs ---
        print(" Creating lineage edges...")
        for edge_entry in LINEAGE_EDGES:
            edge_data = edge_entry.copy()
            is_valid = True

            # Map foreign keys by treating hardcoded int as a 1-based index
            fk_map = {
                "source_table_id": created_tables,
                "target_table_id": created_tables,
                "source_column_id": created_columns,
                "target_column_id": created_columns,
                "job_id": created_jobs,
                "verified_by": created_users
            }

            for key, object_list in fk_map.items():
                if edge_data.get(key):
                    index = edge_data[key] - 1
                    if 0 <= index < len(object_list):
                        edge_data[key] = object_list[index].id
                    else:
                        print(f"Warning: Invalid '{key}' with value '{edge_entry[key]}'. Skipping edge.")
                        is_valid = False
                        break
            
            if is_valid:
                edge = LineageEdge(**edge_data)
                db.add(edge)
                db.flush()

        # Create lineage job runs
        print("Creating lineage job runs...")
        for run_data in LINEAGE_JOB_RUNS:
            run = LineageJobRun(**run_data)
            db.add(run)
            db.flush()
        
        # --- MODIFICATION 4: Map placeholder table_id to actual table ID ---
        print("Creating lineage impact analysis...")
        for analysis_entry in LINEAGE_IMPACT_ANALYSIS:
            analysis_data = analysis_entry.copy()
            index = analysis_data["table_id"] - 1
            if 0 <= index < len(created_tables):
                analysis_data["table_id"] = created_tables[index].id
                analysis = LineageImpactAnalysis(**analysis_data)
                db.add(analysis)
                db.flush()
            else:
                print(f"Warning: Invalid table_id '{analysis_entry['table_id']}' in impact analysis. Skipping.")

        db.commit()
        print(" Sample data created successfully!")
        
        # Print summary
        print("\nData Summary:")
        print(f"  • Users: {len(BANK_USERS)}")
        print(f"  • Domains: {len(BANK_DOMAINS)}")
        print(f"  • Data Sources: {len(BANK_DATA_SOURCES)}")
        print(f"  • Tables: {len(BANK_TABLES)}")
        print(f"  • Tags: {len(BANK_TAGS)}")
        print(f"  • Lineage Jobs: {len(LINEAGE_JOBS)}")
        print(f"  • Lineage Edges: {len(LINEAGE_EDGES)}")
        print(f"  • Lineage Job Runs: {len(LINEAGE_JOB_RUNS)}")
        print(f"  • Lineage Impact Analysis: {len(LINEAGE_IMPACT_ANALYSIS)}")
        
        # Print login info
        print("\n Login Information:")
        print("  Admin User:")
        print(f"    Email: {BANK_USERS[0]['email']}")
        print("    Password: password123")
        print("\n  Other users have the same password: password123")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating sample data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()