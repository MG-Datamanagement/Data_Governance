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
    {"name": "Retail Banking", "description": "Customer accounts, transactions, and services", "color": "#3B82F6"},
    {"name": "Lending", "description": "Loan and mortgage data", "color": "#10B981"},
    {"name": "Wealth Management", "description": "Investment portfolios and financial goals", "color": "#F59E0B"},
    {"name": "Risk & Compliance", "description": "Fraud, audit, and regulatory reporting", "color": "#EF4444"},
    {"name": "Financial Markets", "description": "Trading, securities, and market data", "color": "#8B5CF6"},
    {"name": "Marketing", "description": "Customer segmentation and campaign data", "color": "#F97316"},
]

BANK_DATA_SOURCES = [
    {
        "name": "Core Banking System",
        "type": "postgresql",
        "description": "Primary system for managing customer accounts and transactions",
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
        "description": "System for processing and approving loan applications",
        "connection_config": {
            "host": "loan-db.bank.internal",
            "port": 1521,
            "database": "loan_sys"
        }
    },
    {
        "name": "Credit Card Processing",
        "type": "mysql", 
        "description": "Transaction data for credit and debit cards",
        "connection_config": {
            "host": "card-db.bank.internal",
            "port": 3306,
            "database": "card_processing"
        }
    },
    {
        "name": "Customer Data Hub",
        "type": "snowflake",
        "description": "Centralized customer information and demographics",
        "connection_config": {
            "account": "bank.snowflakecomputing.com",
            "database": "CUSTOMER_HUB",
            "warehouse": "BI_WH"
        }
    },
    {
        "name": "Regulatory Reporting Warehouse",
        "type": "bigquery",
        "description": "Data warehouse for generating regulatory reports (e.g., Basel, AML)",
        "connection_config": {
            "project_id": "bank-reporting-prod",
            "dataset": "regulatory_reports"
        }
    }
]

BANK_TABLES = [
    # Retail Banking Domain
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
            {"name": "social_security_number", "data_type": "VARCHAR(11)", "is_pii": True, "description": "U.S. Social Security Number", "sensitivity_level": "restricted"},
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
    # Lending Domain
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
            {"name": "card_number", "data_type": "VARCHAR(16)", "is_pii": True, "description": "Credit card number (PCI DSS compliant)", "sensitivity_level": "restricted"},
            {"name": "card_type", "data_type": "VARCHAR(20)", "description": "Card type (e.g., Visa, Mastercard)"},
            {"name": "credit_limit", "data_type": "DECIMAL(10,2)", "description": "Maximum credit limit"},
            {"name": "outstanding_balance", "data_type": "DECIMAL(10,2)", "description": "Current outstanding balance"}
        ]
    },
    # Risk & Compliance Domain
    {
        "name": "fraud_alerts",
        "schema_name": "public",
        "description": "Automated fraud detection alerts",
        "domain": "Risk & Compliance",
        "data_source": "Core Banking System",
        "sensitivity": "confidential",
        "is_certified": True,
        "columns": [
            {"name": "alert_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique alert identifier"},
            {"name": "transaction_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the suspicious transaction"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Customer associated with the alert"},
            {"name": "alert_timestamp", "data_type": "TIMESTAMP", "description": "Time the alert was triggered"},
            {"name": "alert_reason", "data_type": "VARCHAR(255)", "description": "Reason for the alert (e.g., large_transaction, unusual_location)"},
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
            {"name": "flag_reason", "data_type": "VARCHAR(255)", "description": "Reason for flagging (e.g., large cash deposit, multiple wire transfers)"},
            {"name": "is_sar_filed", "data_type": "BOOLEAN", "description": "Whether a Suspicious Activity Report (SAR) has been filed"},
            {"name": "reviewer_id", "data_type": "BIGINT", "description": "Reference to the compliance officer who reviewed the flag"}
        ]
    },
    # Marketing Domain
    {
        "name": "customer_segments",
        "schema_name": "public",
        "description": "Customer segments for marketing campaigns",
        "domain": "Marketing",
        "data_source": "Customer Data Hub",
        "sensitivity": "internal",
        "columns": [
            {"name": "segment_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique segment identifier"},
            {"name": "customer_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to the customer"},
            {"name": "segment_name", "data_type": "VARCHAR(100)", "description": "Name of the marketing segment"},
            {"name": "created_at", "data_type": "TIMESTAMP", "description": "Date the customer was assigned to the segment"}
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
]

# Lineage jobs data
LINEAGE_JOBS = [
    {"id": 1, "name": 'ETL_Daily_Pipeline', "description": 'Daily ETL process for customer data', "external_job_id": 'etl_daily_001', "job_type": 'airflow', "schedule": '0 0 * * *', "is_scheduled": True, "last_run_at": datetime(2025,9,24,7,0,0), "next_run_at": datetime(2025,9,25,7,0,0), "last_run_status": 'success', "job_config": {}, "owner_id": 1, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
    {"id": 2, "name": 'Loan_Processing_Job', "description": 'Processes loan data aggregation', "external_job_id": 'loan_proc_002', "job_type": 'spark', "schedule": '0 2 * * *', "is_scheduled": True, "last_run_at": datetime(2025,9,24,2,0,0), "next_run_at": datetime(2025,9,25,2,0,0), "last_run_status": 'success', "job_config": {}, "owner_id": 2, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
    {"id": 3, "name": 'Fraud_Detection_Job', "description": 'Detects suspicious transactions', "external_job_id": 'fraud_detect_003', "job_type": 'spark', "schedule": '0 4 * * *', "is_scheduled": True, "last_run_at": datetime(2025,9,24,4,0,0), "next_run_at": datetime(2025,9,25,4,0,0), "last_run_status": 'running', "job_config": {}, "owner_id": 3, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
    {"id": 4, "name": 'Customer_Segmentation', "description": 'Generates customer segments', "external_job_id": 'segm_004', "job_type": 'dbt', "schedule": '0 6 * * *', "is_scheduled": True, "last_run_at": datetime(2025,9,24,6,0,0), "next_run_at": datetime(2025,9,25,6,0,0), "last_run_status": 'success', "job_config": {}, "owner_id": 4, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
    {"id": 5, "name": 'AML_Processing', "description": 'Anti-Money Laundering data processing', "external_job_id": 'aml_proc_005', "job_type": 'airflow', "schedule": '0 8 * * *', "is_scheduled": True, "last_run_at": datetime(2025,9,24,8,0,0), "next_run_at": datetime(2025,9,25,8,0,0), "last_run_status": 'failed', "job_config": {}, "owner_id": 5, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7)},
]

# Lineage edges data
LINEAGE_EDGES = [
    {"id": 1, "source_table_id": 1, "source_column_id": None, "target_table_id": 2, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'MANUAL', "transformation_logic": 'JOIN ON customer_id', "transformation_type": 'join', "job_id": 1, "execution_context": {}, "confidence_score": 100, "is_verified": True, "verified_by": 1, "verified_at": datetime(2025,9,24,8,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 2, "source_table_id": 2, "source_column_id": None, "target_table_id": 3, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'ETL_METADATA', "transformation_logic": 'INSERT INTO transactions FROM accounts', "transformation_type": 'insert', "job_id": 1, "execution_context": {"dag_id": "etl_daily"}, "confidence_score": 95, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 3, "source_table_id": 1, "source_column_id": None, "target_table_id": 4, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'QUERY_LOG', "transformation_logic": 'SELECT * FROM customers JOIN loans', "transformation_type": 'select', "job_id": 2, "execution_context": {}, "confidence_score": 90, "is_verified": True, "verified_by": 2, "verified_at": datetime(2025,9,24,9,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 4, "source_table_id": 4, "source_column_id": None, "target_table_id": 5, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'MANUAL', "transformation_logic": 'AGGREGATE payments', "transformation_type": 'aggregation', "job_id": 2, "execution_context": {}, "confidence_score": 100, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 5, "source_table_id": 3, "source_column_id": None, "target_table_id": 6, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'INFERRED', "transformation_logic": 'FILTER suspicious transactions', "transformation_type": 'filter', "job_id": 3, "execution_context": {"spark_job": "fraud_detection"}, "confidence_score": 85, "is_verified": True, "verified_by": 3, "verified_at": datetime(2025,9,24,10,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 6, "source_table_id": 6, "source_column_id": None, "target_table_id": 7, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'API_REPORTED', "transformation_logic": 'UPDATE aml_flags FROM fraud_alerts', "transformation_type": 'update', "job_id": 3, "execution_context": {}, "confidence_score": 95, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 7, "source_table_id": 1, "source_column_id": None, "target_table_id": 8, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'MANUAL', "transformation_logic": 'SEGMENT customers', "transformation_type": 'aggregation', "job_id": 4, "execution_context": {}, "confidence_score": 100, "is_verified": True, "verified_by": 4, "verified_at": datetime(2025,9,24,11,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 8, "source_table_id": 2, "source_column_id": None, "target_table_id": 6, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'QUERY_LOG', "transformation_logic": 'JOIN accounts WITH fraud_alerts', "transformation_type": 'join', "job_id": 4, "execution_context": {}, "confidence_score": 90, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 9, "source_table_id": 3, "source_column_id": None, "target_table_id": 7, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'ETL_METADATA', "transformation_logic": 'TRANSFORM transactions FOR aml', "transformation_type": 'transform', "job_id": 5, "execution_context": {"airflow_dag": "aml_pipeline"}, "confidence_score": 95, "is_verified": True, "verified_by": 5, "verified_at": datetime(2025,9,24,12,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 10, "source_table_id": 4, "source_column_id": None, "target_table_id": 8, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'MANUAL', "transformation_logic": 'FILTER loans FOR segments', "transformation_type": 'filter', "job_id": 5, "execution_context": {}, "confidence_score": 100, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 11, "source_table_id": None, "source_column_id": 1, "target_table_id": None, "target_column_id": 2, "lineage_type": 'COLUMN_TO_COLUMN', "source_type": 'MANUAL', "transformation_logic": 'customer_id = account_customer_id', "transformation_type": 'mapping', "job_id": 1, "execution_context": {}, "confidence_score": 100, "is_verified": True, "verified_by": 6, "verified_at": datetime(2025,9,24,13,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 12, "source_table_id": None, "source_column_id": 2, "target_table_id": None, "target_column_id": 3, "lineage_type": 'COLUMN_TO_COLUMN', "source_type": 'INFERRED', "transformation_logic": 'amount > threshold', "transformation_type": 'filter', "job_id": 2, "execution_context": {}, "confidence_score": 85, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 13, "source_table_id": 5, "source_column_id": None, "target_table_id": None, "target_column_id": 4, "lineage_type": 'TABLE_TO_COLUMN', "source_type": 'QUERY_LOG', "transformation_logic": 'credit_score FROM credit_cards', "transformation_type": 'select', "job_id": 3, "execution_context": {}, "confidence_score": 90, "is_verified": True, "verified_by": 1, "verified_at": datetime(2025,9,24,14,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 14, "source_table_id": None, "source_column_id": 5, "target_table_id": 6, "target_column_id": None, "lineage_type": 'COLUMN_TO_TABLE', "source_type": 'MANUAL', "transformation_logic": 'alert_level TO fraud_alerts', "transformation_type": 'insert', "job_id": 4, "execution_context": {}, "confidence_score": 100, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 15, "source_table_id": 7, "source_column_id": None, "target_table_id": 8, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'ETL_METADATA', "transformation_logic": 'JOIN aml_flags WITH segments', "transformation_type": 'join', "job_id": 5, "execution_context": {"dbt_model": "customer_risk"}, "confidence_score": 95, "is_verified": True, "verified_by": 2, "verified_at": datetime(2025,9,24,15,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 16, "source_table_id": 1, "source_column_id": None, "target_table_id": 3, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'API_REPORTED', "transformation_logic": 'MERGE customers INTO transactions', "transformation_type": 'merge', "job_id": 1, "execution_context": {}, "confidence_score": 95, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 17, "source_table_id": 2, "source_column_id": None, "target_table_id": 4, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'MANUAL', "transformation_logic": 'accounts TO loans VIA customer', "transformation_type": 'join', "job_id": 2, "execution_context": {}, "confidence_score": 100, "is_verified": True, "verified_by": 3, "verified_at": datetime(2025,9,24,16,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 18, "source_table_id": 3, "source_column_id": None, "target_table_id": 5, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'QUERY_LOG', "transformation_logic": 'transactions FILTER FOR credit_cards', "transformation_type": 'filter', "job_id": 3, "execution_context": {}, "confidence_score": 90, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 19, "source_table_id": 4, "source_column_id": None, "target_table_id": 6, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'INFERRED', "transformation_logic": 'loans AGGREGATE TO fraud_alerts', "transformation_type": 'aggregation', "job_id": 4, "execution_context": {}, "confidence_score": 85, "is_verified": True, "verified_by": 4, "verified_at": datetime(2025,9,24,17,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 20, "source_table_id": 5, "source_column_id": None, "target_table_id": 7, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'ETL_METADATA', "transformation_logic": 'credit_cards TO aml_flags', "transformation_type": 'transform', "job_id": 5, "execution_context": {"spark_job": "card_aml"}, "confidence_score": 95, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 21, "source_table_id": 6, "source_column_id": None, "target_table_id": 8, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'MANUAL', "transformation_logic": 'fraud_alerts SEGMENT FOR marketing', "transformation_type": 'aggregation', "job_id": 1, "execution_context": {}, "confidence_score": 100, "is_verified": True, "verified_by": 5, "verified_at": datetime(2025,9,24,18,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 22, "source_table_id": 7, "source_column_id": None, "target_table_id": 3, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'API_REPORTED', "transformation_logic": 'aml_flags BACK TO transactions', "transformation_type": 'update', "job_id": 2, "execution_context": {}, "confidence_score": 95, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 23, "source_table_id": 8, "source_column_id": None, "target_table_id": 1, "target_column_id": None, "lineage_type": 'TABLE_TO_TABLE', "source_type": 'QUERY_LOG', "transformation_logic": 'segments FEED BACK TO customers', "transformation_type": 'merge', "job_id": 3, "execution_context": {}, "confidence_score": 90, "is_verified": True, "verified_by": 6, "verified_at": datetime(2025,9,24,19,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 24, "source_table_id": None, "source_column_id": 6, "target_table_id": None, "target_column_id": 7, "lineage_type": 'COLUMN_TO_COLUMN', "source_type": 'MANUAL', "transformation_logic": 'segment_id = customer_segment', "transformation_type": 'mapping', "job_id": 4, "execution_context": {}, "confidence_score": 100, "is_verified": False, "verified_by": None, "verified_at": None, "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
    {"id": 25, "source_table_id": 2, "source_column_id": None, "target_table_id": None, "target_column_id": 8, "lineage_type": 'TABLE_TO_COLUMN', "source_type": 'INFERRED', "transformation_logic": 'accounts BALANCE TO total_balance', "transformation_type": 'aggregation', "job_id": 5, "execution_context": {}, "confidence_score": 85, "is_verified": True, "verified_by": 1, "verified_at": datetime(2025,9,24,20,0,0), "is_active": True, "created_at": datetime(2025,9,24,7,48,7), "updated_at": datetime(2025,9,24,7,48,7), "last_observed_at": datetime(2025,9,24,7,48,7)},
]

# Lineage job runs data
LINEAGE_JOB_RUNS = [
    {"id": 1, "job_id": 1, "run_id": 'run_001_20250924', "started_at": datetime(2025,9,24,7,0,0), "ended_at": datetime(2025,9,24,7,15,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 5, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"dag_run_id": "run_001"}, "created_at": datetime(2025,9,24,7,15,0)},
    {"id": 2, "job_id": 1, "run_id": 'run_002_20250925', "started_at": datetime(2025,9,25,7,0,0), "ended_at": datetime(2025,9,25,7,20,0), "status": 'success', "tables_processed": 4, "lineage_edges_created": 6, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"dag_run_id": "run_002"}, "created_at": datetime(2025,9,25,7,20,0)},
    {"id": 3, "job_id": 2, "run_id": 'run_001_20250924', "started_at": datetime(2025,9,24,2,0,0), "ended_at": datetime(2025,9,24,2,30,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 3, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"spark_run_id": "run_001"}, "created_at": datetime(2025,9,24,2,30,0)},
    {"id": 4, "job_id": 2, "run_id": 'run_002_20250925', "started_at": datetime(2025,9,25,2,0,0), "ended_at": None, "status": 'running', "tables_processed": 1, "lineage_edges_created": 0, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"spark_run_id": "run_002"}, "created_at": datetime(2025,9,25,2,0,0)},
    {"id": 5, "job_id": 3, "run_id": 'run_001_20250924', "started_at": datetime(2025,9,24,4,0,0), "ended_at": datetime(2025,9,24,4,45,0), "status": 'success', "tables_processed": 5, "lineage_edges_created": 7, "lineage_edges_updated": 3, "error_message": None, "error_details": None, "execution_context": {"spark_run_id": "run_003"}, "created_at": datetime(2025,9,24,4,45,0)},
    {"id": 6, "job_id": 3, "run_id": 'run_002_20250925', "started_at": datetime(2025,9,25,4,0,0), "ended_at": datetime(2025,9,25,4,50,0), "status": 'failed', "tables_processed": 3, "lineage_edges_created": 2, "lineage_edges_updated": 1, "error_message": 'Timeout error', "error_details": {"timeout": 300}, "execution_context": {"spark_run_id": "run_004"}, "created_at": datetime(2025,9,25,4,50,0)},
    {"id": 7, "job_id": 4, "run_id": 'run_001_20250924', "started_at": datetime(2025,9,24,6,0,0), "ended_at": datetime(2025,9,24,6,25,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 4, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"dbt_run_id": "run_005"}, "created_at": datetime(2025,9,24,6,25,0)},
    {"id": 8, "job_id": 4, "run_id": 'run_002_20250925', "started_at": datetime(2025,9,25,6,0,0), "ended_at": datetime(2025,9,25,6,30,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 5, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"dbt_run_id": "run_006"}, "created_at": datetime(2025,9,25,6,30,0)},
    {"id": 9, "job_id": 5, "run_id": 'run_001_20250924', "started_at": datetime(2025,9,24,8,0,0), "ended_at": datetime(2025,9,24,8,40,0), "status": 'failed', "tables_processed": 4, "lineage_edges_created": 3, "lineage_edges_updated": 0, "error_message": 'Data mismatch', "error_details": {"mismatch": "field_x"}, "execution_context": {"airflow_run_id": "run_007"}, "created_at": datetime(2025,9,24,8,40,0)},
    {"id": 10, "job_id": 5, "run_id": 'run_002_20250925', "started_at": datetime(2025,9,25,8,0,0), "ended_at": None, "status": 'running', "tables_processed": 2, "lineage_edges_created": 0, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"airflow_run_id": "run_008"}, "created_at": datetime(2025,9,25,8,0,0)},
    {"id": 11, "job_id": 1, "run_id": 'run_003_20250925', "started_at": datetime(2025,9,25,7,30,0), "ended_at": datetime(2025,9,25,7,45,0), "status": 'success', "tables_processed": 5, "lineage_edges_created": 8, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"dag_run_id": "run_009"}, "created_at": datetime(2025,9,25,7,45,0)},
    {"id": 12, "job_id": 2, "run_id": 'run_003_20250925', "started_at": datetime(2025,9,25,2,30,0), "ended_at": datetime(2025,9,25,3,0,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 4, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"spark_run_id": "run_010"}, "created_at": datetime(2025,9,25,3,0,0)},
    {"id": 13, "job_id": 3, "run_id": 'run_003_20250925', "started_at": datetime(2025,9,25,4,30,0), "ended_at": datetime(2025,9,25,5,0,0), "status": 'success', "tables_processed": 4, "lineage_edges_created": 6, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"spark_run_id": "run_011"}, "created_at": datetime(2025,9,25,5,0,0)},
    {"id": 14, "job_id": 4, "run_id": 'run_003_20250925', "started_at": datetime(2025,9,25,6,30,0), "ended_at": datetime(2025,9,25,7,0,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 3, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"dbt_run_id": "run_012"}, "created_at": datetime(2025,9,25,7,0,0)},
    {"id": 15, "job_id": 5, "run_id": 'run_003_20250925', "started_at": datetime(2025,9,25,8,30,0), "ended_at": datetime(2025,9,25,9,0,0), "status": 'failed', "tables_processed": 3, "lineage_edges_created": 2, "lineage_edges_updated": 0, "error_message": 'Connection lost', "error_details": {"connection": "db_error"}, "execution_context": {"airflow_run_id": "run_013"}, "created_at": datetime(2025,9,25,9,0,0)},
    {"id": 16, "job_id": 1, "run_id": 'run_004_20250925', "started_at": datetime(2025,9,25,7,45,0), "ended_at": datetime(2025,9,25,8,0,0), "status": 'success', "tables_processed": 4, "lineage_edges_created": 5, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"dag_run_id": "run_014"}, "created_at": datetime(2025,9,25,8,0,0)},
    {"id": 17, "job_id": 2, "run_id": 'run_004_20250925', "started_at": datetime(2025,9,25,3,0,0), "ended_at": datetime(2025,9,25,3,30,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 3, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"spark_run_id": "run_015"}, "created_at": datetime(2025,9,25,3,30,0)},
    {"id": 18, "job_id": 3, "run_id": 'run_004_20250925', "started_at": datetime(2025,9,25,5,0,0), "ended_at": datetime(2025,9,25,5,30,0), "status": 'success', "tables_processed": 5, "lineage_edges_created": 7, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"spark_run_id": "run_016"}, "created_at": datetime(2025,9,25,5,30,0)},
    {"id": 19, "job_id": 4, "run_id": 'run_004_20250925', "started_at": datetime(2025,9,25,7,0,0), "ended_at": datetime(2025,9,25,7,30,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 4, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"dbt_run_id": "run_017"}, "created_at": datetime(2025,9,25,7,30,0)},
    {"id": 20, "job_id": 5, "run_id": 'run_004_20250925', "started_at": datetime(2025,9,25,9,0,0), "ended_at": None, "status": 'running', "tables_processed": 1, "lineage_edges_created": 0, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"airflow_run_id": "run_018"}, "created_at": datetime(2025,9,25,9,0,0)},
    {"id": 21, "job_id": 1, "run_id": 'run_005_20250925', "started_at": datetime(2025,9,25,8,15,0), "ended_at": datetime(2025,9,25,8,30,0), "status": 'success', "tables_processed": 3, "lineage_edges_created": 4, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"dag_run_id": "run_019"}, "created_at": datetime(2025,9,25,8,30,0)},
    {"id": 22, "job_id": 2, "run_id": 'run_005_20250925', "started_at": datetime(2025,9,25,3,30,0), "ended_at": datetime(2025,9,25,4,0,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 2, "lineage_edges_updated": 1, "error_message": None, "error_details": None, "execution_context": {"spark_run_id": "run_020"}, "created_at": datetime(2025,9,25,4,0,0)},
    {"id": 23, "job_id": 3, "run_id": 'run_005_20250925', "started_at": datetime(2025,9,25,5,30,0), "ended_at": datetime(2025,9,25,6,0,0), "status": 'success', "tables_processed": 4, "lineage_edges_created": 5, "lineage_edges_updated": 2, "error_message": None, "error_details": None, "execution_context": {"spark_run_id": "run_021"}, "created_at": datetime(2025,9,25,6,0,0)},
    {"id": 24, "job_id": 4, "run_id": 'run_005_20250925', "started_at": datetime(2025,9,25,7,30,0), "ended_at": datetime(2025,9,25,8,0,0), "status": 'success', "tables_processed": 2, "lineage_edges_created": 3, "lineage_edges_updated": 0, "error_message": None, "error_details": None, "execution_context": {"dbt_run_id": "run_022"}, "created_at": datetime(2025,9,25,8,0,0)},
    {"id": 25, "job_id": 5, "run_id": 'run_005_20250925', "started_at": datetime(2025,9,25,9,30,0), "ended_at": datetime(2025,9,25,10,0,0), "status": 'failed', "tables_processed": 3, "lineage_edges_created": 1, "lineage_edges_updated": 0, "error_message": 'Data validation error', "error_details": {"validation": "field_y"}, "execution_context": {"airflow_run_id": "run_023"}, "created_at": datetime(2025,9,25,10,0,0)},
]

# Lineage impact analysis data
LINEAGE_IMPACT_ANALYSIS = [
    {"id": 1, "table_id": 1, "upstream_table_count": 0, "upstream_column_count": 0, "max_upstream_depth": 0, "downstream_table_count": 3, "downstream_column_count": 1, "max_downstream_depth": 2, "is_critical_path": False, "criticality_score": 60, "impact_radius": 3, "upstream_tables": [], "downstream_tables": [2, 3, 4], "analysis_version": '1.0', "last_computed_at": datetime(2025,9,25,6,0,0), "created_at": datetime(2025,9,25,6,0,0), "updated_at": datetime(2025,9,25,6,0,0)},
    {"id": 2, "table_id": 2, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 1, "downstream_table_count": 2, "downstream_column_count": 1, "max_downstream_depth": 2, "is_critical_path": True, "criticality_score": 85, "impact_radius": 2, "upstream_tables": [1], "downstream_tables": [3, 6], "analysis_version": '1.0', "last_computed_at": datetime(2025,9,25,6,0,0), "created_at": datetime(2025,9,25,6,0,0), "updated_at": datetime(2025,9,25,6,0,0)},
    {"id": 3, "table_id": 3, "upstream_table_count": 2, "upstream_column_count": 1, "max_upstream_depth": 2, "downstream_table_count": 2, "downstream_column_count": 1, "max_downstream_depth": 1, "is_critical_path": False, "criticality_score": 70, "impact_radius": 2, "upstream_tables": [1, 2], "downstream_tables": [6, 7], "analysis_version": '1.0', "last_computed_at": datetime(2025,9,25,6,0,0), "created_at": datetime(2025,9,25,6,0,0), "updated_at": datetime(2025,9,25,6,0,0)},
    {"id": 4, "table_id": 4, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 1, "downstream_table_count": 2, "downstream_column_count": 1, "max_downstream_depth": 2, "is_critical_path": True, "criticality_score": 90, "impact_radius": 2, "upstream_tables": [1], "downstream_tables": [5, 8], "analysis_version": '1.0', "last_computed_at": datetime(2025,9,25,6,0,0), "created_at": datetime(2025,9,25,6,0,0), "updated_at": datetime(2025,9,25,6,0,0)},
    {"id": 5, "table_id": 5, "upstream_table_count": 1, "upstream_column_count": 1, "max_upstream_depth": 1, "downstream_table_count": 1, "downstream_column_count": 1, "max_downstream_depth": 1, "is_critical_path": False, "criticality_score": 50, "impact_radius": 1, "upstream_tables": [4], "downstream_tables": [7], "analysis_version": '1.0', "last_computed_at": datetime(2025,9,25,6,0,0), "created_at": datetime(2025,9,25,6,0,0), "updated_at": datetime(2025,9,25,6,0,0)},
    {"id": 6, "table_id": 6, "upstream_table_count": 2, "upstream_column_count": 1, "max_upstream_depth": 2, "downstream_table_count": 1, "downstream_column_count": 1, "max_downstream_depth": 1, "is_critical_path": True, "criticality_score": 80, "impact_radius": 1, "upstream_tables": [2, 3], "downstream_tables": [7], "analysis_version": '1.0', "last_computed_at": datetime(2025,9,25,6,0,0), "created_at": datetime(2025,9,25,6,0,0), "updated_at": datetime(2025,9,25,6,0,0)},
    {"id": 7, "table_id": 7, "upstream_table_count": 2, "upstream_column_count": 1, "max_upstream_depth": 2, "downstream_table_count": 1, "downstream_column_count": 1, "max_downstream_depth": 1, "is_critical_path": False, "criticality_score": 65, "impact_radius": 1, "upstream_tables": [5, 6], "downstream_tables": [3], "analysis_version": '1.0', "last_computed_at": datetime(2025,9,25,6,0,0), "created_at": datetime(2025,9,25,6,0,0), "updated_at": datetime(2025,9,25,6,0,0)},
    {"id": 8, "table_id": 8, "upstream_table_count": 3, "upstream_column_count": 1, "max_upstream_depth": 2, "downstream_table_count": 0, "downstream_column_count": 0, "max_downstream_depth": 0, "is_critical_path": False, "criticality_score": 55, "impact_radius": 0, "upstream_tables": [1, 4, 7], "downstream_tables": [], "analysis_version": '1.0', "last_computed_at": datetime(2025,9,25,6,0,0), "created_at": datetime(2025,9,25,6,0,0), "updated_at": datetime(2025,9,25,6,0,0)},
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
                    sensitivity_level=col_data.get("sensitivity_level", table.sensitivity_level),
                    ordinal_position=i + 1,
                    is_nullable=not col_data.get("is_primary_key", False)
                )
                db.add(column)
            
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
        
  
        # Create lineage jobs
        print("🔄 Creating lineage jobs...")
        job_map = {}  # Map for later reference if needed
        for job_data in LINEAGE_JOBS:
            job = LineageJob(**job_data)
            db.add(job)
            db.flush()
            job_map[job.id] = job

            # Create lineage edges
        print("🔗 Creating lineage edges...")
        for edge_data in LINEAGE_EDGES:
            edge = LineageEdge(**edge_data)
            db.add(edge)
            db.flush()

            # Create lineage job runs
        print("🏃 Creating lineage job runs...")
        for run_data in LINEAGE_JOB_RUNS:
            run = LineageJobRun(**run_data)
            db.add(run)
            db.flush()
        
        # Create lineage impact analysis
        print("📊 Creating lineage impact analysis...")
        for analysis_data in LINEAGE_IMPACT_ANALYSIS:
            analysis = LineageImpactAnalysis(**analysis_data)
            db.add(analysis)
            db.flush()

        db.commit()
        print("✅ Sample data created successfully!")

        
        # Print summary
        print("\n📈 Data Summary:")
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