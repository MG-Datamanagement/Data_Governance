#!/usr/bin/env python3
"""
Script to generate sample airport management data for MetaPortal.
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

# Airport management sample data
AIRPORT_USERS = [
    {"name": "John Smith", "email": "john.smith@airport.com", "role": "admin"},
    {"name": "Sarah Johnson", "email": "sarah.johnson@airport.com", "role": "data_steward"},
    {"name": "Mike Chen", "email": "mike.chen@airport.com", "role": "data_analyst"},
    {"name": "Lisa Rodriguez", "email": "lisa.rodriguez@airport.com", "role": "data_steward"},
    {"name": "David Kim", "email": "david.kim@airport.com", "role": "data_analyst"},
    {"name": "Emma Wilson", "email": "emma.wilson@airport.com", "role": "viewer"},
]

AIRPORT_DOMAINS = [
    {"name": "Flight Operations", "description": "Flight schedules, delays, and operational data", "color": "#3B82F6"},
    {"name": "Passenger Services", "description": "Passenger information, bookings, and services", "color": "#10B981"},
    {"name": "Security", "description": "Security screening, baggage, and safety data", "color": "#F59E0B"},
    {"name": "Ground Operations", "description": "Ground handling, cargo, and maintenance data", "color": "#EF4444"},
    {"name": "Finance", "description": "Revenue, costs, and financial reporting", "color": "#8B5CF6"},
    {"name": "Facilities", "description": "Terminal facilities, gates, and infrastructure", "color": "#F97316"},
]

AIRPORT_DATA_SOURCES = [
    {
        "name": "Flight Management System",
        "type": "postgresql",
        "description": "Primary flight operations database",
        "connection_config": {
            "host": "flight-db.airport.internal",
            "port": 5432,
            "database": "flight_ops",
            "schema": "operations"
        }
    },
    {
        "name": "Passenger Information System", 
        "type": "mysql",
        "description": "Passenger booking and information system",
        "connection_config": {
            "host": "passenger-db.airport.internal",
            "port": 3306,
            "database": "passenger_info"
        }
    },
    {
        "name": "Security Management System",
        "type": "oracle", 
        "description": "Security screening and monitoring system",
        "connection_config": {
            "host": "security-db.airport.internal",
            "port": 1521,
            "database": "security_ops"
        }
    },
    {
        "name": "Ground Operations Hub",
        "type": "snowflake",
        "description": "Ground handling and cargo management",
        "connection_config": {
            "account": "airport.snowflakecomputing.com",
            "database": "GROUND_OPS",
            "warehouse": "COMPUTE_WH"
        }
    },
    {
        "name": "Financial Data Warehouse",
        "type": "bigquery",
        "description": "Financial reporting and analytics",
        "connection_config": {
            "project_id": "airport-finance-analytics",
            "dataset": "financial_data"
        }
    }
]

AIRPORT_TABLES = [
    # Flight Operations Domain
    {
        "name": "flights",
        "schema_name": "operations",
        "description": "Scheduled and actual flight information",
        "domain": "Flight Operations",
        "data_source": "Flight Management System",
        "sensitivity": "internal",
        "is_certified": True,
        "columns": [
            {"name": "flight_id", "data_type": "VARCHAR(10)", "is_primary_key": True, "description": "Unique flight identifier"},
            {"name": "airline_code", "data_type": "VARCHAR(3)", "description": "IATA airline code"},
            {"name": "flight_number", "data_type": "VARCHAR(10)", "description": "Flight number"},
            {"name": "origin_airport", "data_type": "VARCHAR(3)", "description": "Origin airport IATA code"},
            {"name": "destination_airport", "data_type": "VARCHAR(3)", "description": "Destination airport IATA code"},
            {"name": "scheduled_departure", "data_type": "TIMESTAMP", "description": "Scheduled departure time"},
            {"name": "actual_departure", "data_type": "TIMESTAMP", "description": "Actual departure time"},
            {"name": "scheduled_arrival", "data_type": "TIMESTAMP", "description": "Scheduled arrival time"},
            {"name": "actual_arrival", "data_type": "TIMESTAMP", "description": "Actual arrival time"},
            {"name": "aircraft_type", "data_type": "VARCHAR(10)", "description": "Aircraft type code"},
            {"name": "gate_number", "data_type": "VARCHAR(5)", "description": "Assigned gate number"},
            {"name": "flight_status", "data_type": "VARCHAR(20)", "description": "Current flight status"}
        ]
    },
    {
        "name": "aircraft", 
        "schema_name": "operations",
        "description": "Aircraft fleet information and specifications",
        "domain": "Flight Operations",
        "data_source": "Flight Management System", 
        "sensitivity": "internal",
        "columns": [
            {"name": "aircraft_id", "data_type": "VARCHAR(20)", "is_primary_key": True, "description": "Aircraft registration number"},
            {"name": "aircraft_type", "data_type": "VARCHAR(10)", "description": "Aircraft model type"},
            {"name": "airline_code", "data_type": "VARCHAR(3)", "description": "Operating airline"},
            {"name": "manufacturer", "data_type": "VARCHAR(50)", "description": "Aircraft manufacturer"},
            {"name": "model", "data_type": "VARCHAR(50)", "description": "Aircraft model"},
            {"name": "capacity", "data_type": "INTEGER", "description": "Passenger capacity"},
            {"name": "year_manufactured", "data_type": "INTEGER", "description": "Year of manufacture"},
            {"name": "last_maintenance", "data_type": "DATE", "description": "Last maintenance date"}
        ]
    },
    # Passenger Services Domain  
    {
        "name": "passengers",
        "schema_name": "passenger",
        "description": "Passenger booking and travel information", 
        "domain": "Passenger Services",
        "data_source": "Passenger Information System",
        "sensitivity": "confidential",
        "columns": [
            {"name": "passenger_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique passenger identifier"},
            {"name": "first_name", "data_type": "VARCHAR(100)", "is_pii": True, "description": "Passenger first name"},
            {"name": "last_name", "data_type": "VARCHAR(100)", "is_pii": True, "description": "Passenger last name"},
            {"name": "email", "data_type": "VARCHAR(255)", "is_pii": True, "description": "Passenger email address"},
            {"name": "phone", "data_type": "VARCHAR(20)", "is_pii": True, "description": "Passenger phone number"},
            {"name": "passport_number", "data_type": "VARCHAR(20)", "is_pii": True, "description": "Passport number", "sensitivity_level": "restricted"},
            {"name": "date_of_birth", "data_type": "DATE", "is_pii": True, "description": "Date of birth"},
            {"name": "nationality", "data_type": "VARCHAR(50)", "description": "Passenger nationality"},
            {"name": "frequent_flyer_number", "data_type": "VARCHAR(20)", "description": "Frequent flyer program number"}
        ]
    },
    {
        "name": "bookings",
        "schema_name": "passenger", 
        "description": "Flight booking and reservation details",
        "domain": "Passenger Services",
        "data_source": "Passenger Information System",
        "sensitivity": "confidential",
        "columns": [
            {"name": "booking_id", "data_type": "VARCHAR(20)", "is_primary_key": True, "description": "Booking confirmation number"},
            {"name": "passenger_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to passenger"},
            {"name": "flight_id", "data_type": "VARCHAR(10)", "is_foreign_key": True, "description": "Reference to flight"},
            {"name": "seat_number", "data_type": "VARCHAR(5)", "description": "Assigned seat number"},
            {"name": "booking_class", "data_type": "VARCHAR(10)", "description": "Booking class (Economy, Business, First)"},
            {"name": "booking_date", "data_type": "TIMESTAMP", "description": "Date booking was made"},
            {"name": "ticket_price", "data_type": "DECIMAL(10,2)", "description": "Ticket price paid"},
            {"name": "payment_method", "data_type": "VARCHAR(20)", "description": "Payment method used"},
            {"name": "booking_status", "data_type": "VARCHAR(20)", "description": "Current booking status"}
        ]
    },
    # Security Domain
    {
        "name": "security_screenings",
        "schema_name": "security",
        "description": "Passenger security screening records",
        "domain": "Security", 
        "data_source": "Security Management System",
        "sensitivity": "restricted",
        "columns": [
            {"name": "screening_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Unique screening record ID"},
            {"name": "passenger_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to passenger"},
            {"name": "checkpoint_id", "data_type": "VARCHAR(10)", "description": "Security checkpoint identifier"},
            {"name": "screening_time", "data_type": "TIMESTAMP", "description": "Time of security screening"},
            {"name": "screening_result", "data_type": "VARCHAR(20)", "description": "Screening result (Cleared, Additional, Denied)"},
            {"name": "additional_screening", "data_type": "BOOLEAN", "description": "Whether additional screening was required"},
            {"name": "prohibited_items", "data_type": "TEXT", "description": "Any prohibited items found"},
            {"name": "officer_id", "data_type": "VARCHAR(20)", "description": "Security officer identifier"}
        ]
    },
    {
        "name": "baggage_tracking",
        "schema_name": "security",
        "description": "Baggage handling and tracking information",
        "domain": "Security",
        "data_source": "Security Management System", 
        "sensitivity": "internal",
        "columns": [
            {"name": "baggage_tag", "data_type": "VARCHAR(20)", "is_primary_key": True, "description": "Baggage tag number"},
            {"name": "passenger_id", "data_type": "BIGINT", "is_foreign_key": True, "description": "Reference to passenger"},
            {"name": "flight_id", "data_type": "VARCHAR(10)", "is_foreign_key": True, "description": "Reference to flight"},
            {"name": "weight_kg", "data_type": "DECIMAL(5,2)", "description": "Baggage weight in kilograms"},
            {"name": "bag_type", "data_type": "VARCHAR(20)", "description": "Type of baggage (Checked, Carry-on)"},
            {"name": "current_location", "data_type": "VARCHAR(50)", "description": "Current baggage location"},
            {"name": "tracking_status", "data_type": "VARCHAR(20)", "description": "Tracking status"},
            {"name": "last_scan_time", "data_type": "TIMESTAMP", "description": "Last scan timestamp"}
        ]
    },
    # Ground Operations Domain
    {
        "name": "ground_handling",
        "schema_name": "ground_ops",
        "description": "Ground handling operations and services",
        "domain": "Ground Operations",
        "data_source": "Ground Operations Hub",
        "sensitivity": "internal",
        "columns": [
            {"name": "handling_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Ground handling record ID"},
            {"name": "flight_id", "data_type": "VARCHAR(10)", "is_foreign_key": True, "description": "Reference to flight"},
            {"name": "service_type", "data_type": "VARCHAR(50)", "description": "Type of ground service"},
            {"name": "service_provider", "data_type": "VARCHAR(100)", "description": "Ground handling company"},
            {"name": "start_time", "data_type": "TIMESTAMP", "description": "Service start time"},
            {"name": "end_time", "data_type": "TIMESTAMP", "description": "Service completion time"},
            {"name": "crew_size", "data_type": "INTEGER", "description": "Number of crew members"},
            {"name": "equipment_used", "data_type": "VARCHAR(200)", "description": "Equipment used for service"},
            {"name": "service_status", "data_type": "VARCHAR(20)", "description": "Service completion status"}
        ]
    },
    # Finance Domain
    {
        "name": "revenue_summary",
        "schema_name": "finance",
        "description": "Daily revenue summary by service type",
        "domain": "Finance",
        "data_source": "Financial Data Warehouse",
        "sensitivity": "confidential",
        "is_certified": True,
        "columns": [
            {"name": "revenue_date", "data_type": "DATE", "is_primary_key": True, "description": "Revenue reporting date"},
            {"name": "service_category", "data_type": "VARCHAR(50)", "is_primary_key": True, "description": "Service category"},
            {"name": "total_revenue", "data_type": "DECIMAL(15,2)", "description": "Total revenue amount"},
            {"name": "passenger_count", "data_type": "INTEGER", "description": "Number of passengers served"},
            {"name": "average_per_passenger", "data_type": "DECIMAL(10,2)", "description": "Average revenue per passenger"},
            {"name": "currency", "data_type": "VARCHAR(3)", "description": "Currency code"},
            {"name": "exchange_rate", "data_type": "DECIMAL(10,6)", "description": "Exchange rate to USD"}
        ]
    },
    # Facilities Domain
    {
        "name": "gate_assignments",
        "schema_name": "facilities",
        "description": "Airport gate assignments and availability",
        "domain": "Facilities",
        "data_source": "Flight Management System",
        "sensitivity": "internal",
        "columns": [
            {"name": "assignment_id", "data_type": "BIGINT", "is_primary_key": True, "description": "Assignment record ID"},
            {"name": "gate_number", "data_type": "VARCHAR(5)", "description": "Gate identifier"},
            {"name": "flight_id", "data_type": "VARCHAR(10)", "is_foreign_key": True, "description": "Assigned flight"},
            {"name": "assignment_start", "data_type": "TIMESTAMP", "description": "Assignment start time"},
            {"name": "assignment_end", "data_type": "TIMESTAMP", "description": "Assignment end time"},
            {"name": "gate_type", "data_type": "VARCHAR(20)", "description": "Type of gate (Domestic, International)"},
            {"name": "jetbridge_available", "data_type": "BOOLEAN", "description": "Whether jetbridge is available"},
            {"name": "gate_status", "data_type": "VARCHAR(20)", "description": "Current gate status"}
        ]
    }
]

AIRPORT_TAGS = [
    {"name": "PII", "description": "Personally Identifiable Information", "color": "#EF4444"},
    {"name": "Financial", "description": "Financial data", "color": "#10B981"},
    {"name": "Operational", "description": "Operational data", "color": "#3B82F6"},
    {"name": "Security", "description": "Security-related data", "color": "#F59E0B"},
    {"name": "Real-time", "description": "Real-time data feeds", "color": "#8B5CF6"},
    {"name": "Batch", "description": "Batch processed data", "color": "#6B7280"},
    {"name": "Critical", "description": "Business critical data", "color": "#DC2626"},
    {"name": "Passenger", "description": "Passenger-related data", "color": "#059669"},
    {"name": "Flight", "description": "Flight-related data", "color": "#2563EB"},
    {"name": "Compliance", "description": "Regulatory compliance data", "color": "#9333EA"},
]


def create_sample_data():
    """Generate sample airport management data."""
    
    # Database connection
    engine = create_engine(os.getenv("DATABASE_URL", settings.database_url))
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("🚀 Generating sample airport management data...")
        
        # Create database tables first
        print("🗃️ Creating database tables...")
        Base.metadata.create_all(engine)
        
        # Create users
        print("👥 Creating users...")
        user_map = {}
        for user_data in AIRPORT_USERS:
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
        for i, domain_data in enumerate(AIRPORT_DOMAINS):
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
        for ds_data in AIRPORT_DATA_SOURCES:
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
        for tag_data in AIRPORT_TAGS:
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
        for table_data in AIRPORT_TABLES:
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
            if "passenger" in table_data["name"].lower() or any(col.get("is_pii") for col in table_data["columns"]):
                relevant_tags.extend([tag_map["PII"], tag_map["Passenger"]])
            if "flight" in table_data["name"].lower():
                relevant_tags.extend([tag_map["Flight"], tag_map["Operational"]])
            if "security" in table_data["name"].lower():
                relevant_tags.extend([tag_map["Security"], tag_map["Compliance"]])
            if "revenue" in table_data["name"].lower():
                relevant_tags.extend([tag_map["Financial"], tag_map["Critical"]])
            
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
        print(f"  • Users: {len(AIRPORT_USERS)}")
        print(f"  • Domains: {len(AIRPORT_DOMAINS)}")
        print(f"  • Data Sources: {len(AIRPORT_DATA_SOURCES)}")
        print(f"  • Tables: {len(AIRPORT_TABLES)}")
        print(f"  • Tags: {len(AIRPORT_TAGS)}")
        
        # Print login info
        print("\n🔐 Login Information:")
        print("  Admin User:")
        print(f"    Email: {AIRPORT_USERS[0]['email']}")
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