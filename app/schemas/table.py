from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from ..models.table import DataSourceTypeEnum, SensitivityLevelEnum
from ..models.resource_urn import Environment
from .common import TagResponse


class DataSourceType(str, Enum):
    """Data source type enumeration for API schemas."""
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


class SensitivityLevel(str, Enum):
    """Data sensitivity level enumeration for API schemas."""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class DataSourceBase(BaseModel):
    """Base data source schema."""
    name: str = Field(..., min_length=1, max_length=255, description="Data source name")
    description: Optional[str] = Field(None, max_length=1000, description="Data source description")
    type: DataSourceType = Field(..., description="Data source type")
    is_active: bool = Field(default=True, description="Whether data source is active")
    auto_crawl_enabled: bool = Field(default=False, description="Enable automatic crawling")
    crawl_schedule: Optional[str] = Field(None, max_length=100, description="Crawl schedule (cron)")


class DataSourceCreate(DataSourceBase):
    """Schema for creating a data source."""
    connection_config: Dict[str, Any] = Field(..., description="Connection configuration")


class DataSourceUpdate(BaseModel):
    """Schema for updating a data source."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Data source name")
    description: Optional[str] = Field(None, max_length=1000, description="Data source description")
    is_active: Optional[bool] = Field(None, description="Whether data source is active")
    auto_crawl_enabled: Optional[bool] = Field(None, description="Enable automatic crawling")
    crawl_schedule: Optional[str] = Field(None, max_length=100, description="Crawl schedule (cron)")
    connection_config: Optional[Dict[str, Any]] = Field(None, description="Connection configuration")


class DataSourceResponse(DataSourceBase):
    """Schema for data source response."""
    id: int = Field(..., description="Data source ID")
    urn: Optional[str] = Field(None, description="Resource URN")
    connection_status: str = Field(..., description="Connection status")
    environment: Environment = Field(default=Environment.PROD, description="Environment")
    last_crawl_at: Optional[datetime] = Field(None, description="Last crawl timestamp")
    last_connection_test_at: Optional[datetime] = Field(None, description="Last connection test timestamp")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    tables_count: int = Field(0, description="Number of tables in this data source")
    
    class Config:
        from_attributes = True


class DomainBase(BaseModel):
    """Base domain schema."""
    name: str = Field(..., min_length=1, max_length=255, description="Domain name")
    description: Optional[str] = Field(None, max_length=1000, description="Domain description")
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="Domain color (hex)")


class DomainCreate(DomainBase):
    """Schema for creating a domain."""
    steward_id: Optional[int] = Field(None, description="Domain steward user ID")


class DomainUpdate(BaseModel):
    """Schema for updating a domain."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Domain name")
    description: Optional[str] = Field(None, max_length=1000, description="Domain description")
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="Domain color (hex)")
    steward_id: Optional[int] = Field(None, description="Domain steward user ID")


class DomainResponse(DomainBase):
    """Schema for domain response."""
    id: int = Field(..., description="Domain ID")
    urn: Optional[str] = Field(None, description="Resource URN")
    steward_id: Optional[int] = Field(None, description="Domain steward user ID")
    steward_name: Optional[str] = Field(None, description="Domain steward name")
    environment: Environment = Field(default=Environment.PROD, description="Environment")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    tables_count: int = Field(0, description="Number of tables in this domain")
    
    class Config:
        from_attributes = True


class ColumnBase(BaseModel):
    """Base column schema."""
    name: str = Field(..., min_length=1, max_length=255, description="Column name")
    description: Optional[str] = Field(None, max_length=1000, description="Column description")
    data_type: str = Field(..., max_length=100, description="Column data type")
    max_length: Optional[int] = Field(None, description="Maximum length for string types")
    precision: Optional[int] = Field(None, description="Precision for numeric types")
    scale: Optional[int] = Field(None, description="Scale for numeric types")
    is_nullable: bool = Field(default=True, description="Whether column allows null values")
    is_primary_key: bool = Field(default=False, description="Whether column is primary key")
    is_foreign_key: bool = Field(default=False, description="Whether column is foreign key")
    default_value: Optional[str] = Field(None, max_length=500, description="Column default value")
    is_pii: bool = Field(default=False, description="Whether column contains PII")
    sensitivity_level: SensitivityLevel = Field(default=SensitivityLevel.INTERNAL, description="Data sensitivity level")
    ordinal_position: int = Field(default=1, description="Column position in table")


class ColumnCreate(ColumnBase):
    """Schema for creating a column."""
    table_id: int = Field(..., description="Parent table ID")


class ColumnUpdate(BaseModel):
    """Schema for updating a column."""
    description: Optional[str] = Field(None, max_length=1000, description="Column description")
    is_pii: Optional[bool] = Field(None, description="Whether column contains PII")
    sensitivity_level: Optional[SensitivityLevel] = Field(None, description="Data sensitivity level")


class ColumnResponse(ColumnBase):
    """Schema for column response."""
    id: int = Field(..., description="Column ID")
    urn: Optional[str] = Field(None, description="Resource URN")
    table_id: int = Field(..., description="Parent table ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    tags: List[TagResponse] = Field(default_factory=list, description="Column tags")
    
    class Config:
        from_attributes = True


class TableBase(BaseModel):
    """Base table schema."""
    name: str = Field(..., min_length=1, max_length=255, description="Table name")
    schema_name: Optional[str] = Field(None, max_length=255, description="Schema name")
    description: Optional[str] = Field(None, max_length=1000, description="Table description")
    table_type: str = Field(default="table", description="Table type (table, view, etc.)")
    sensitivity_level: SensitivityLevel = Field(default=SensitivityLevel.INTERNAL, description="Data sensitivity level")
    is_active: bool = Field(default=True, description="Whether table is active")
    is_certified: bool = Field(default=False, description="Whether table is certified")
    certification_notes: Optional[str] = Field(None, max_length=1000, description="Certification notes")


class TableCreate(TableBase):
    """Schema for creating a table."""
    data_source_id: int = Field(..., description="Data source ID")
    domain_id: Optional[int] = Field(None, description="Domain ID")
    owner_id: Optional[int] = Field(None, description="Owner user ID")


class TableUpdate(BaseModel):
    """Schema for updating a table."""
    description: Optional[str] = Field(None, max_length=1000, description="Table description")
    domain_id: Optional[int] = Field(None, description="Domain ID")
    owner_id: Optional[int] = Field(None, description="Owner user ID")
    sensitivity_level: Optional[SensitivityLevel] = Field(None, description="Data sensitivity level")
    is_active: Optional[bool] = Field(None, description="Whether table is active")
    is_certified: Optional[bool] = Field(None, description="Whether table is certified")
    certification_notes: Optional[str] = Field(None, max_length=1000, description="Certification notes")


# Nested info classes for table responses (must be defined before TableResponse)
class DataSourceInfo(BaseModel):
    """Data source information in table response."""
    id: int = Field(..., description="Data source ID")
    name: str = Field(..., description="Data source name")
    type: DataSourceType = Field(..., description="Data source type")

class DomainInfo(BaseModel):
    """Domain information in table response."""
    id: int = Field(..., description="Domain ID")
    name: str = Field(..., description="Domain name")
    color: str = Field(..., description="Domain color")

class OwnerInfo(BaseModel):
    """Owner information in table response."""
    id: int = Field(..., description="Owner user ID")
    name: str = Field(..., description="Owner name")
    email: str = Field(..., description="Owner email")

class StatsInfo(BaseModel):
    """Statistics information in table response."""
    row_count: Optional[int] = Field(None, description="Number of rows")
    size_bytes: Optional[int] = Field(None, description="Size in bytes")
    quality_score: Optional[int] = Field(None, description="Data quality score (0-100)")
    query_count_last_30d: int = Field(0, description="Query count in last 30 days")
    unique_users_last_30d: int = Field(0, description="Unique users in last 30 days")

class TableResponse(TableBase):
    """Schema for table response."""
    id: int = Field(..., description="Table ID")
    urn: Optional[str] = Field(None, description="Resource URN")
    
    # Flattened data source fields
    data_source_id: int
    data_source_name: str
    data_source_type: str
    
    # Flattened domain and owner fields
    domain_id: Optional[int]
    domain_name: Optional[str]
    owner_id: Optional[int]
    owner_name: Optional[str]
    
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    last_schema_check_at: Optional[datetime] = Field(None, description="Last schema check timestamp")
    
    # Flattened stats fields
    row_count: Optional[int] = Field(None, description="Number of rows")
    size_bytes: Optional[int] = Field(None, description="Size in bytes")
    query_count_last_30d: int = Field(0, description="Query count in last 30 days")
    unique_users_last_30d: int = Field(0, description="Unique users in last 30 days")
    
    column_count: int = Field(0, description="Number of columns")
    
    # Tags and classification
    tags: List[TagResponse] = Field(default_factory=list, description="Table tags")
    
    class Config:
        from_attributes = True


class TableDetailResponse(TableBase):
    """Extended table response with detailed information."""
    id: int = Field(..., description="Table ID")
    urn: Optional[str] = Field(None, description="Resource URN")
    data_source: DataSourceInfo = Field(..., description="Data source information")
    domain: Optional[DomainInfo] = Field(None, description="Domain information")
    owner: Optional[OwnerInfo] = Field(None, description="Owner information")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    last_schema_check_at: Optional[datetime] = Field(None, description="Last schema check timestamp")
    
    # Statistics
    stats: Optional[StatsInfo] = Field(None, description="Table statistics")
    
    # Tags and classification
    tags: List[TagResponse] = Field(default_factory=list, description="Table tags")
    
    # Additional detail fields
    columns: List[ColumnResponse] = Field(default_factory=list, description="Table columns")
    upstream_tables_count: int = Field(0, description="Number of upstream tables")
    downstream_tables_count: int = Field(0, description="Number of downstream tables")
    last_quality_check: Optional[datetime] = Field(None, description="Last quality check timestamp")
    
    class Config:
        from_attributes = True


class TableStatsResponse(BaseModel):
    """Schema for table statistics response."""
    table_id: int = Field(..., description="Table ID")
    row_count: Optional[int] = Field(None, description="Number of rows")
    size_bytes: Optional[int] = Field(None, description="Size in bytes")
    null_count: Optional[int] = Field(None, description="Number of null values")
    duplicate_count: Optional[int] = Field(None, description="Number of duplicate rows")
    quality_score: Optional[int] = Field(None, description="Quality score (0-100)")
    last_updated: Optional[datetime] = Field(None, description="Data last updated timestamp")
    update_frequency: Optional[str] = Field(None, description="Update frequency")
    query_count_last_30d: int = Field(0, description="Query count in last 30 days")
    unique_users_last_30d: int = Field(0, description="Unique users in last 30 days")
    created_at: datetime = Field(..., description="Stats creation timestamp")
    updated_at: datetime = Field(..., description="Stats last update timestamp")
    
    class Config:
        from_attributes = True


class TableListResponse(BaseModel):
    """Schema for paginated table list response."""
    tables: List[TableResponse] = Field(..., description="List of tables")
    total: int = Field(..., description="Total number of tables")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    has_next: bool = Field(..., description="Whether there are more pages")


class DataSourceListResponse(BaseModel):
    """Schema for paginated data source list response."""
    data_sources: List[DataSourceResponse] = Field(..., description="List of data sources")
    total: int = Field(..., description="Total number of data sources")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    has_next: bool = Field(..., description="Whether there are more pages")


class DomainListResponse(BaseModel):
    """Schema for paginated domain list response."""
    domains: List[DomainResponse] = Field(..., description="List of domains")
    total: int = Field(..., description="Total number of domains")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    has_next: bool = Field(..., description="Whether there are more pages")