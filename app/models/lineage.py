from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, Boolean,
    Enum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class LineageTypeEnum(str, enum.Enum):
    """Lineage relationship type enumeration."""
    TABLE_TO_TABLE = "table_to_table"
    COLUMN_TO_COLUMN = "column_to_column"
    TABLE_TO_COLUMN = "table_to_column"
    COLUMN_TO_TABLE = "column_to_table"


class LineageSourceEnum(str, enum.Enum):
    """Source of lineage information."""
    MANUAL = "manual"
    QUERY_LOG = "query_log"
    ETL_METADATA = "etl_metadata"
    API_REPORTED = "api_reported"
    INFERRED = "inferred"


class LineageEdge(Base):
    """Lineage edge model representing data flow relationships."""
    
    __tablename__ = "lineage_edges"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Source (upstream)
    source_table_id = Column(Integer, ForeignKey("tables.id"), nullable=True, index=True)
    source_column_id = Column(Integer, ForeignKey("columns.id"), nullable=True, index=True)
    
    # Target (downstream)
    target_table_id = Column(Integer, ForeignKey("tables.id"), nullable=True, index=True)
    target_column_id = Column(Integer, ForeignKey("columns.id"), nullable=True, index=True)
    
    # Lineage metadata
    lineage_type = Column(Enum(LineageTypeEnum), nullable=False, index=True)
    source_type = Column(Enum(LineageSourceEnum), default=LineageSourceEnum.MANUAL, nullable=False)
    
    # Transformation details
    transformation_logic = Column(Text, nullable=True)  # SQL, code, or description
    transformation_type = Column(String(100), nullable=True)  # aggregation, filter, join, etc.
    
    # Process information
    job_id = Column(Integer, ForeignKey("lineage_jobs.id"), nullable=True, index=True)
    execution_context = Column(JSON, nullable=True)  # Additional context like Airflow DAG info
    
    # Confidence and validation
    confidence_score = Column(Integer, default=100, nullable=False)  # 0-100
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_observed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    source_table = relationship("Table", foreign_keys=[source_table_id], back_populates="downstream_edges")
    target_table = relationship("Table", foreign_keys=[target_table_id], back_populates="upstream_edges")
    source_column = relationship("Column", foreign_keys=[source_column_id], back_populates="downstream_edges")
    target_column = relationship("Column", foreign_keys=[target_column_id], back_populates="upstream_edges")
    job = relationship("LineageJob", back_populates="edges")
    verifier = relationship("User")
    
    # Constraints to ensure valid lineage relationships
    __table_args__ = (
        # Ensure we have at least one source and one target
        Index('idx_lineage_source', 'source_table_id', 'source_column_id'),
        Index('idx_lineage_target', 'target_table_id', 'target_column_id'),
        Index('idx_lineage_type', 'lineage_type', 'is_active'),
    )
    
    def __repr__(self):
        return f"<LineageEdge(id={self.id}, type='{self.lineage_type}', source_table_id={self.source_table_id}, target_table_id={self.target_table_id})>"
    
    def validate_lineage_relationship(self):
        """Validate that the lineage relationship is logically consistent."""
        # Table-to-table: both source and target tables must be specified
        if self.lineage_type == LineageTypeEnum.TABLE_TO_TABLE:
            return self.source_table_id and self.target_table_id
        
        # Column-to-column: both source and target columns must be specified
        elif self.lineage_type == LineageTypeEnum.COLUMN_TO_COLUMN:
            return self.source_column_id and self.target_column_id
        
        # Table-to-column: source table and target column must be specified
        elif self.lineage_type == LineageTypeEnum.TABLE_TO_COLUMN:
            return self.source_table_id and self.target_column_id
        
        # Column-to-table: source column and target table must be specified
        elif self.lineage_type == LineageTypeEnum.COLUMN_TO_TABLE:
            return self.source_column_id and self.target_table_id
        
        return False


class LineageJob(Base):
    """Lineage job model for ETL/ELT processes that create lineage."""
    
    __tablename__ = "lineage_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Job identification
    external_job_id = Column(String(255), nullable=True, index=True)  # Airflow DAG ID, etc.
    job_type = Column(String(100), nullable=False)  # airflow, dbt, spark, manual, etc.
    
    # Scheduling information
    schedule = Column(String(100), nullable=True)  # Cron expression
    is_scheduled = Column(Boolean, default=False, nullable=False)
    
    # Execution metadata
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    last_run_status = Column(String(50), nullable=True)  # success, failed, running
    
    # Configuration
    job_config = Column(JSON, nullable=True)  # Job-specific configuration
    
    # Owner information
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    owner = relationship("User")
    edges = relationship("LineageEdge", back_populates="job")
    runs = relationship("LineageJobRun", back_populates="job")
    
    def __repr__(self):
        return f"<LineageJob(id={self.id}, name='{self.name}', job_type='{self.job_type}')>"


class LineageJobRun(Base):
    """Individual execution runs of lineage jobs."""
    
    __tablename__ = "lineage_job_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("lineage_jobs.id"), nullable=False, index=True)
    
    # Run identification
    run_id = Column(String(255), nullable=False, index=True)  # External run ID
    
    # Execution details
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False)  # running, success, failed, cancelled
    
    # Results
    tables_processed = Column(Integer, default=0, nullable=False)
    lineage_edges_created = Column(Integer, default=0, nullable=False)
    lineage_edges_updated = Column(Integer, default=0, nullable=False)
    
    # Error information
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Metadata
    execution_context = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    job = relationship("LineageJob", back_populates="runs")
    
    # Unique constraint for external run IDs within a job
    __table_args__ = (
        UniqueConstraint('job_id', 'run_id', name='unique_job_run'),
        Index('idx_job_run_status', 'job_id', 'status', 'started_at'),
    )
    
    def __repr__(self):
        return f"<LineageJobRun(id={self.id}, job_id={self.job_id}, run_id='{self.run_id}', status='{self.status}')>"
    
    @property
    def duration_seconds(self) -> int:
        """Calculate run duration in seconds."""
        if self.started_at and self.ended_at:
            return int((self.ended_at - self.started_at).total_seconds())
        return 0


class LineageImpactAnalysis(Base):
    """Pre-computed impact analysis for tables."""
    
    __tablename__ = "lineage_impact_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), unique=True, nullable=False, index=True)
    
    # Upstream dependencies
    upstream_table_count = Column(Integer, default=0, nullable=False)
    upstream_column_count = Column(Integer, default=0, nullable=False)
    max_upstream_depth = Column(Integer, default=0, nullable=False)
    
    # Downstream dependencies  
    downstream_table_count = Column(Integer, default=0, nullable=False)
    downstream_column_count = Column(Integer, default=0, nullable=False)
    max_downstream_depth = Column(Integer, default=0, nullable=False)
    
    # Critical path analysis
    is_critical_path = Column(Boolean, default=False, nullable=False)
    criticality_score = Column(Integer, default=0, nullable=False)  # 0-100
    
    # Impact radius (tables affected by changes)
    impact_radius = Column(Integer, default=0, nullable=False)
    
    # Cached lineage data (for performance)
    upstream_tables = Column(JSON, nullable=True)  # List of upstream table IDs
    downstream_tables = Column(JSON, nullable=True)  # List of downstream table IDs
    
    # Analysis metadata
    analysis_version = Column(String(50), default="1.0", nullable=False)
    last_computed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    table = relationship("Table")
    
    def __repr__(self):
        return f"<LineageImpactAnalysis(id={self.id}, table_id={self.table_id}, upstream_count={self.upstream_table_count}, downstream_count={self.downstream_table_count})>"