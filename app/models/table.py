from sqlalchemy import (
    Column as SqlColumn, Integer, String, DateTime, Boolean, Text, ForeignKey,
    BigInteger, Enum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship, Session
from sqlalchemy.sql import func
from datetime import datetime
import enum
from typing import Optional

from ..core.database import Base
from .resource_urn import URNGenerator, Environment, ResourceType


class DataSourceTypeEnum(str, enum.Enum):
    """Data source type enumeration."""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    BIGQUERY = "bigquery"
    SNOWFLAKE = "snowflake"
    REDSHIFT = "redshift"
    S3 = "s3"
    DATABRICKS = "databricks"
    MONGODB = "mongodb"
    ORACLE = "oracle"
    MSSQL = "mssql"
    HIVE = "hive"
    SPARK = "spark"
    SALESFORCE = "salesforce"
    DYNAMICS365 = "dynamics365"
    RDS = "rds"


class SensitivityLevelEnum(str, enum.Enum):
    """Data sensitivity level enumeration."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class DataSource(Base):
    """Data source model for different database connections."""
    
    __tablename__ = "data_sources"
    
    id = SqlColumn(Integer, primary_key=True, index=True)
    urn = SqlColumn(String(500), unique=True, nullable=True, index=True)  # Resource URN
    name = SqlColumn(String(255), unique=True, nullable=False, index=True)
    description = SqlColumn(Text, nullable=True)
    type = SqlColumn(Enum(DataSourceTypeEnum), nullable=False, index=True)
    base64_url = SqlColumn(Text, nullable=True)
    
    # Connection configuration (encrypted JSON)
    connection_config = SqlColumn(JSON, nullable=False)  # host, port, database, etc.
    
    # Status and metadata
    is_active = SqlColumn(Boolean, default=True, nullable=False)
    last_crawl_at = SqlColumn(DateTime(timezone=True), nullable=True)
    last_connection_test_at = SqlColumn(DateTime(timezone=True), nullable=True)
    connection_status = SqlColumn(String(20), default="unknown", nullable=False)  # success, failed, unknown
    
    # Crawling configuration
    auto_crawl_enabled = SqlColumn(Boolean, default=False, nullable=False)
    crawl_schedule = SqlColumn(String(100), nullable=True)  # Cron expression
    
    # Environment
    environment = SqlColumn(Enum(Environment), default=Environment.PROD, nullable=False)
    
    # Timestamps
    created_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    tables = relationship("Table", back_populates="data_source", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DataSource(id={self.id}, name='{self.name}', type='{self.type}', urn='{self.urn}')>"
    
    def generate_urn(self) -> str:
        """Generate URN for this data source."""
        if not self.urn:
            self.urn = URNGenerator.generate_platform_urn(
                platform_name=self.name,
                environment=self.environment
            )
        return self.urn
    
    @property
    def platform_name(self) -> str:
        """Get normalized platform name for URN generation."""
        return self.name.lower().replace(" ", "_").replace("-", "_")


class Domain(Base):
    """Business domain model for organizing data assets."""
    
    __tablename__ = "domains"
    
    id = SqlColumn(Integer, primary_key=True, index=True)
    urn = SqlColumn(String(500), unique=True, nullable=True, index=True)  # Resource URN
    name = SqlColumn(String(255), unique=True, nullable=False, index=True)
    description = SqlColumn(Text, nullable=True)
    color = SqlColumn(String(7), nullable=True)  # Hex color code
    
    # Domain ownership
    steward_id = SqlColumn(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Environment
    environment = SqlColumn(Enum(Environment), default=Environment.PROD, nullable=False)
    
    # Timestamps
    created_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    steward = relationship("User", back_populates="owned_domains")
    tables = relationship("Table", back_populates="domain")
    
    def __repr__(self):
        return f"<Domain(id={self.id}, name='{self.name}', urn='{self.urn}')>"
    
    def generate_urn(self) -> str:
        """Generate URN for this domain."""
        if not self.urn:
            self.urn = URNGenerator.generate_domain_urn(
                domain_name=self.name,
                environment=self.environment
            )
        return self.urn


class Table(Base):
    """Table model for data assets."""
    
    __tablename__ = "tables"
    
    id = SqlColumn(Integer, primary_key=True, index=True)
    urn = SqlColumn(String(500), unique=True, nullable=True, index=True)  # Resource URN
    name = SqlColumn(String(255), nullable=False, index=True)
    schema_name = SqlColumn(String(255), nullable=True, index=True)
    description = SqlColumn(Text, nullable=True)
    
    # Foreign keys
    data_source_id = SqlColumn(Integer, ForeignKey("data_sources.id"), nullable=False, index=True)
    data_source_base64_url = SqlColumn(Text, nullable=True)
    domain_id = SqlColumn(Integer, ForeignKey("domains.id"), nullable=True, index=True)
    owner_id = SqlColumn(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Metadata
    table_type = SqlColumn(String(50), default="table", nullable=False)  # table, view, materialized_view
    sensitivity_level = SqlColumn(Enum(SensitivityLevelEnum), default=SensitivityLevelEnum.INTERNAL, nullable=False)
    
    # Status
    is_active = SqlColumn(Boolean, default=True, nullable=False)
    is_certified = SqlColumn(Boolean, default=False, nullable=False)
    certification_notes = SqlColumn(Text, nullable=True)
    # new columns for lineage
    upstream_tables = SqlColumn(JSON, nullable=True)
    downstream_tables = SqlColumn(JSON, nullable=True)
    is_data_source = SqlColumn(Boolean, default=True, nullable=False)
    # Timestamps
    created_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_schema_check_at = SqlColumn(DateTime(timezone=True), nullable=True)
    
    # Relationships
    data_source = relationship("DataSource", back_populates="tables")
    domain = relationship("Domain", back_populates="tables")
    owner = relationship("User", back_populates="owned_tables")
    columns = relationship("Column", back_populates="table", cascade="all, delete-orphan")
    stats = relationship("TableStats", back_populates="table", uselist=False)
    tags = relationship("TableTag", back_populates="table")
    favorited_by = relationship("UserFavorite", back_populates="table")
    


    # Lineage relationships
    upstream_edges = relationship("LineageEdge", back_populates="target_table", foreign_keys="LineageEdge.target_table_id")
    downstream_edges = relationship("LineageEdge", back_populates="source_table", foreign_keys="LineageEdge.source_table_id")
    
    # Unique constraint for table name within data source and schema
    __table_args__ = (
        UniqueConstraint('data_source_id', 'schema_name', 'name', name='unique_table_per_source_schema'),
        Index('idx_table_search', 'name', 'description'),
    )
    
    def __repr__(self):
        return f"<Table(id={self.id}, name='{self.name}', schema='{self.schema_name}', urn='{self.urn}')>"
    
    @property
    def fully_qualified_name(self) -> str:
        """Get fully qualified table name."""
        if self.schema_name:
            return f"{self.schema_name}.{self.name}"
        return self.name
    
    def generate_urn(self, db: Session) -> str:
        """Generate URN for this table."""
        if not self.urn and self.data_source:
            # Get database name from data source connection config if available
            database_name = None
            if self.data_source.connection_config and 'database' in self.data_source.connection_config:
                database_name = self.data_source.connection_config.get('database')
            
            self.urn = URNGenerator.generate_dataset_urn(
                platform=self.data_source.platform_name,
                database=database_name,
                schema=self.schema_name,
                table=self.name,
                environment=self.data_source.environment
            )
        return self.urn
    
    @property
    def dataset_hierarchy(self) -> str:
        """Get dataset hierarchy for URN."""
        parts = []
        if hasattr(self.data_source, 'connection_config') and self.data_source.connection_config:
            db_name = self.data_source.connection_config.get('database')
            if db_name:
                parts.append(db_name)
        
        if self.schema_name:
            parts.append(self.schema_name)
        parts.append(self.name)
        
        return ".".join(parts)


class Column(Base):
    """Column model for table columns."""
    
    __tablename__ = "columns"
    
    id = SqlColumn(Integer, primary_key=True, index=True)
    urn = SqlColumn(String(500), unique=True, nullable=True, index=True)  # Resource URN
    table_id = SqlColumn(Integer, ForeignKey("tables.id"), nullable=False, index=True)
    name = SqlColumn(String(255), nullable=False, index=True)
    description = SqlColumn(Text, nullable=True)
    
    # Column metadata
    data_type = SqlColumn(String(100), nullable=False)
    max_length = SqlColumn(Integer, nullable=True)
    precision = SqlColumn(Integer, nullable=True)
    scale = SqlColumn(Integer, nullable=True)
    is_nullable = SqlColumn(Boolean, default=True, nullable=False)
    is_primary_key = SqlColumn(Boolean, default=False, nullable=False)
    is_foreign_key = SqlColumn(Boolean, default=False, nullable=False)
    default_value = SqlColumn(String(500), nullable=True)
    
    # Data classification
    is_pii = SqlColumn(Boolean, default=False, nullable=False)
    sensitivity_level = SqlColumn(Enum(SensitivityLevelEnum), default=SensitivityLevelEnum.INTERNAL, nullable=False)
    
    # Column position in table
    ordinal_position = SqlColumn(Integer, nullable=False, default=1)
    
    # Timestamps
    created_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    table = relationship("Table", back_populates="columns")
    tags = relationship("ColumnTag", back_populates="column")
    stats = relationship("ColumnStats", back_populates="column", uselist=False)
    
    # Lineage relationships
    upstream_edges = relationship("LineageEdge", back_populates="target_column", foreign_keys="LineageEdge.target_column_id")
    downstream_edges = relationship("LineageEdge", back_populates="source_column", foreign_keys="LineageEdge.source_column_id")
    
    # Unique constraint for column name within table
    __table_args__ = (
        UniqueConstraint('table_id', 'name', name='unique_column_per_table'),
        Index('idx_column_search', 'name', 'description'),
        Index('idx_column_pii', 'is_pii'),
    )
    
    def __repr__(self):
        return f"<Column(id={self.id}, name='{self.name}', table_id={self.table_id}, urn='{self.urn}')>"
    
    @property
    def fully_qualified_name(self) -> str:
        """Get fully qualified column name."""
        return f"{self.table.fully_qualified_name}.{self.name}"
    
    def generate_urn(self, db: Session) -> str:
        """Generate URN for this column."""
        if not self.urn and self.table and self.table.data_source:
            # Get database name from data source connection config if available
            database_name = None
            if self.table.data_source.connection_config and 'database' in self.table.data_source.connection_config:
                database_name = self.table.data_source.connection_config.get('database')
            
            self.urn = URNGenerator.generate_field_urn(
                platform=self.table.data_source.platform_name,
                database=database_name,
                schema=self.table.schema_name,
                table=self.table.name,
                column=self.name,
                environment=self.table.data_source.environment
            )
        return self.urn
    
    @property
    def field_hierarchy(self) -> str:
        """Get field hierarchy for URN."""
        parts = []
        if hasattr(self.table, 'data_source') and self.table.data_source.connection_config:
            db_name = self.table.data_source.connection_config.get('database')
            if db_name:
                parts.append(db_name)
        
        if self.table.schema_name:
            parts.append(self.table.schema_name)
        parts.extend([self.table.name, self.name])
        
        return ".".join(parts)


class TableStats(Base):
    """Table statistics model."""
    
    __tablename__ = "table_stats"
    
    id = SqlColumn(Integer, primary_key=True, index=True)
    table_id = SqlColumn(Integer, ForeignKey("tables.id"), unique=True, nullable=False, index=True)
    
    # Row and size metrics
    row_count = SqlColumn(BigInteger, nullable=True)
    size_bytes = SqlColumn(BigInteger, nullable=True)
    
    # Data freshness
    last_updated = SqlColumn(DateTime(timezone=True), nullable=True)
    update_frequency = SqlColumn(String(50), nullable=True)  # daily, weekly, monthly, etc.
    
    # Quality metrics
    null_count = SqlColumn(BigInteger, nullable=True)
    duplicate_count = SqlColumn(BigInteger, nullable=True)
    quality_score = SqlColumn(Integer, nullable=True)  # 0-100
    
    # Access patterns
    query_count_last_30d = SqlColumn(Integer, default=0, nullable=False)
    unique_users_last_30d = SqlColumn(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    table = relationship("Table", back_populates="stats")
    
    def __repr__(self):
        return f"<TableStats(id={self.id}, table_id={self.table_id}, row_count={self.row_count})>"


class ColumnStats(Base):
    """Column statistics model."""
    
    __tablename__ = "column_stats"
    
    id = SqlColumn(Integer, primary_key=True, index=True)
    column_id = SqlColumn(Integer, ForeignKey("columns.id"), unique=True, nullable=False, index=True)
    
    # Basic statistics
    null_count = SqlColumn(BigInteger, nullable=True)
    unique_count = SqlColumn(BigInteger, nullable=True)
    min_value = SqlColumn(String(500), nullable=True)
    max_value = SqlColumn(String(500), nullable=True)
    avg_length = SqlColumn(Integer, nullable=True)
    
    # Data patterns
    top_values = SqlColumn(JSON, nullable=True)  # List of most common values
    data_patterns = SqlColumn(JSON, nullable=True)  # Common patterns/formats
    
    # Timestamps
    created_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = SqlColumn(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    column = relationship("Column", back_populates="stats")
    
    def __repr__(self):
        return f"<ColumnStats(id={self.id}, column_id={self.column_id}, null_count={self.null_count})>"