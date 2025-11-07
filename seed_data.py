#!/usr/bin/env python3
"""
Script to seed the database with sample data for development and testing.
"""

import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.table import DataSource, Domain, Table, Column, TableStats, DataSourceTypeEnum, SensitivityLevelEnum
from app.models.tagging import Tag, TableTag
from app.models.user import User, UserRoleEnum
from app.models.resource_urn import Environment
import json
from datetime import datetime, timedelta


def create_sample_data():
    """Create sample data for the governance platform."""
    # Create all database tables
    print("🔧 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create sample users
        admin_user = User(
            email="admin@company.com",
            name="Admin User",
            hashed_password="dummy_hash_for_demo",
            role=UserRoleEnum.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.flush()  # Get the ID
        
        # Create sample domains
        finance_domain = Domain(
            name="Finance",
            description="Financial data and reporting systems",
            color="#10b981",
            steward_id=admin_user.id,
            environment=Environment.PROD
        )
        finance_domain.generate_urn()
        
        marketing_domain = Domain(
            name="Marketing",
            description="Customer marketing and analytics data",
            color="#3b82f6",
            steward_id=admin_user.id,
            environment=Environment.PROD
        )
        marketing_domain.generate_urn()
        
        sales_domain = Domain(
            name="Sales",
            description="Sales performance and customer relationship data",
            color="#f59e0b",
            steward_id=admin_user.id,
            environment=Environment.PROD
        )
        sales_domain.generate_urn()
        
        db.add_all([finance_domain, marketing_domain, sales_domain])
        db.flush()
        
        # Create sample data sources
        postgres_ds = DataSource(
            name="Production PostgreSQL",
            description="Main production PostgreSQL database",
            type=DataSourceTypeEnum.POSTGRESQL,
            connection_config={
                "host": "db.company.com",
                "port": 5432,
                "database": "production",
                "schema": "public"
            },
            is_active=True,
            connection_status="success",
            environment=Environment.PROD
        )
        postgres_ds.generate_urn()
        
        snowflake_ds = DataSource(
            name="Analytics Snowflake",
            description="Snowflake data warehouse for analytics",
            type=DataSourceTypeEnum.SNOWFLAKE,
            connection_config={
                "account": "company.snowflakecomputing.com",
                "database": "ANALYTICS",
                "warehouse": "COMPUTE_WH"
            },
            is_active=True,
            connection_status="success",
            environment=Environment.PROD
        )
        snowflake_ds.generate_urn()
        
        db.add_all([postgres_ds, snowflake_ds])
        db.flush()
        
        # Create sample tables
        customers_table = Table(
            name="customers",
            schema_name="public",
            description="Customer master data with contact information and demographics",
            data_source_id=postgres_ds.id,
            domain_id=sales_domain.id,
            owner_id=admin_user.id,
            table_type="table",
            sensitivity_level=SensitivityLevelEnum.CONFIDENTIAL,
            is_active=True,
            is_certified=True,
            certification_notes="Certified by data governance team"
        )
        customers_table.generate_urn(db)
        
        orders_table = Table(
            name="orders",
            schema_name="public", 
            description="Customer orders and transaction history",
            data_source_id=postgres_ds.id,
            domain_id=sales_domain.id,
            owner_id=admin_user.id,
            table_type="table",
            sensitivity_level=SensitivityLevelEnum.INTERNAL,
            is_active=True,
            is_certified=False
        )
        orders_table.generate_urn(db)
        
        financial_reports_table = Table(
            name="financial_reports",
            schema_name="finance",
            description="Monthly and quarterly financial reporting data",
            data_source_id=snowflake_ds.id,
            domain_id=finance_domain.id,
            owner_id=admin_user.id,
            table_type="view",
            sensitivity_level=SensitivityLevelEnum.RESTRICTED,
            is_active=True,
            is_certified=True,
            certification_notes="Audited financial data - restricted access"
        )
        financial_reports_table.generate_urn(db)
        
        marketing_campaigns_table = Table(
            name="marketing_campaigns",
            schema_name="marketing",
            description="Marketing campaign performance metrics and ROI analysis",
            data_source_id=snowflake_ds.id,
            domain_id=marketing_domain.id,
            owner_id=admin_user.id,
            table_type="table",
            sensitivity_level=SensitivityLevelEnum.INTERNAL,
            is_active=True,
            is_certified=False
        )
        marketing_campaigns_table.generate_urn(db)
        
        user_analytics_table = Table(
            name="user_analytics",
            schema_name="analytics",
            description="User behavior analytics and website interaction data",
            data_source_id=snowflake_ds.id,
            domain_id=marketing_domain.id,
            owner_id=admin_user.id,
            table_type="materialized_view",
            sensitivity_level=SensitivityLevelEnum.INTERNAL,
            is_active=True,
            is_certified=True
        )
        user_analytics_table.generate_urn(db)
        
        db.add_all([customers_table, orders_table, financial_reports_table, marketing_campaigns_table, user_analytics_table])
        db.flush()
        
        # Create sample columns for customers table
        customer_columns = [
            Column(
                table_id=customers_table.id,
                name="customer_id",
                description="Unique customer identifier",
                data_type="integer",
                is_nullable=False,
                is_primary_key=True,
                ordinal_position=1
            ),
            Column(
                table_id=customers_table.id,
                name="email",
                description="Customer email address",
                data_type="varchar",
                max_length=255,
                is_nullable=False,
                is_pii=True,
                sensitivity_level=SensitivityLevelEnum.CONFIDENTIAL,
                ordinal_position=2
            ),
            Column(
                table_id=customers_table.id,
                name="first_name",
                description="Customer first name",
                data_type="varchar",
                max_length=100,
                is_nullable=False,
                is_pii=True,
                sensitivity_level=SensitivityLevelEnum.CONFIDENTIAL,
                ordinal_position=3
            ),
            Column(
                table_id=customers_table.id,
                name="last_name",
                description="Customer last name", 
                data_type="varchar",
                max_length=100,
                is_nullable=False,
                is_pii=True,
                sensitivity_level=SensitivityLevelEnum.CONFIDENTIAL,
                ordinal_position=4
            ),
            Column(
                table_id=customers_table.id,
                name="created_at",
                description="Account creation timestamp",
                data_type="timestamp",
                is_nullable=False,
                ordinal_position=5
            )
        ]
        
        # Generate URNs for columns
        for col in customer_columns:
            col.generate_urn(db)
            
        db.add_all(customer_columns)
        
        # Create sample tags
        pii_tag = Tag(
            name="PII",
            description="Personally Identifiable Information",
            color="#ef4444",
            is_system_tag=True,
            is_active=True,
            environment="PROD"
        )
        pii_tag.generate_urn()
        
        financial_tag = Tag(
            name="Financial",
            description="Financial data requiring special handling",
            color="#10b981",
            is_system_tag=True,
            is_active=True,
            environment="PROD"
        )
        financial_tag.generate_urn()
        
        certified_tag = Tag(
            name="Certified",
            description="Data certified by governance team",
            color="#3b82f6",
            is_system_tag=True,
            is_active=True,
            environment="PROD"
        )
        certified_tag.generate_urn()
        
        analytics_tag = Tag(
            name="Analytics",
            description="Data used for analytics and reporting",
            color="#8b5cf6",
            is_system_tag=False,
            is_active=True,
            environment="PROD"
        )
        analytics_tag.generate_urn()
        
        db.add_all([pii_tag, financial_tag, certified_tag, analytics_tag])
        db.flush()  # Get tag IDs
        
        # Create table statistics
        customers_stats = TableStats(
            table_id=customers_table.id,
            row_count=125000,
            size_bytes=45000000,  # ~45 MB
            last_updated=datetime.utcnow() - timedelta(hours=2),
            update_frequency="daily",
            null_count=150,
            duplicate_count=5,
            quality_score=95,
            query_count_last_30d=245,
            unique_users_last_30d=12
        )
        
        orders_stats = TableStats(
            table_id=orders_table.id,
            row_count=890000,
            size_bytes=180000000,  # ~180 MB
            last_updated=datetime.utcnow() - timedelta(minutes=30),
            update_frequency="hourly",
            null_count=1200,
            duplicate_count=0,
            quality_score=88,
            query_count_last_30d=567,
            unique_users_last_30d=18
        )
        
        financial_reports_stats = TableStats(
            table_id=financial_reports_table.id,
            row_count=24000,
            size_bytes=12000000,  # ~12 MB
            last_updated=datetime.utcnow() - timedelta(days=1),
            update_frequency="monthly",
            null_count=0,
            duplicate_count=0,
            quality_score=100,
            query_count_last_30d=89,
            unique_users_last_30d=6
        )
        
        marketing_campaigns_stats = TableStats(
            table_id=marketing_campaigns_table.id,
            row_count=3500,
            size_bytes=8500000,  # ~8.5 MB
            last_updated=datetime.utcnow() - timedelta(hours=6),
            update_frequency="daily",
            null_count=85,
            duplicate_count=2,
            quality_score=92,
            query_count_last_30d=156,
            unique_users_last_30d=9
        )
        
        user_analytics_stats = TableStats(
            table_id=user_analytics_table.id,
            row_count=2500000,
            size_bytes=320000000,  # ~320 MB
            last_updated=datetime.utcnow() - timedelta(hours=4),
            update_frequency="daily",
            null_count=8900,
            duplicate_count=150,
            quality_score=85,
            query_count_last_30d=423,
            unique_users_last_30d=15
        )
        
        db.add_all([
            customers_stats, orders_stats, financial_reports_stats,
            marketing_campaigns_stats, user_analytics_stats
        ])
        
        # Create table-tag relationships
        table_tag_relationships = [
            # Customers table - PII and Analytics tags
            TableTag(table_id=customers_table.id, tag_id=pii_tag.id, created_by=admin_user.id, confidence_score=0.95, is_auto_tagged=True),
            TableTag(table_id=customers_table.id, tag_id=analytics_tag.id, created_by=admin_user.id, confidence_score=0.85, is_auto_tagged=False),
            
            # Orders table - Analytics tag
            TableTag(table_id=orders_table.id, tag_id=analytics_tag.id, created_by=admin_user.id, confidence_score=0.90, is_auto_tagged=False),
            
            # Financial reports - Financial and Certified tags
            TableTag(table_id=financial_reports_table.id, tag_id=financial_tag.id, created_by=admin_user.id, confidence_score=1.0, is_auto_tagged=True),
            TableTag(table_id=financial_reports_table.id, tag_id=certified_tag.id, created_by=admin_user.id, confidence_score=1.0, is_auto_tagged=False),
            
            # Marketing campaigns - Analytics tag
            TableTag(table_id=marketing_campaigns_table.id, tag_id=analytics_tag.id, created_by=admin_user.id, confidence_score=0.88, is_auto_tagged=False),
            
            # User analytics - PII, Analytics and Certified tags
            TableTag(table_id=user_analytics_table.id, tag_id=pii_tag.id, created_by=admin_user.id, confidence_score=0.75, is_auto_tagged=True),
            TableTag(table_id=user_analytics_table.id, tag_id=analytics_tag.id, created_by=admin_user.id, confidence_score=0.98, is_auto_tagged=True),
            TableTag(table_id=user_analytics_table.id, tag_id=certified_tag.id, created_by=admin_user.id, confidence_score=1.0, is_auto_tagged=False),
        ]
        
        db.add_all(table_tag_relationships)
        
        # Commit all changes
        db.commit()
        print("✅ Sample data created successfully!")
        print(f"Created:")
        print(f"  - 1 admin user")
        print(f"  - 3 domains (Finance, Marketing, Sales)")
        print(f"  - 2 data sources (PostgreSQL, Snowflake)")
        print(f"  - 5 tables with URNs")
        print(f"  - 5 columns with URNs")
        print(f"  - 5 table statistics records")
        print(f"  - 4 tags")
        print(f"  - 9 table-tag relationships")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding database with sample data...")
    create_sample_data()