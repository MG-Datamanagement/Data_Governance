from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, Boolean,
    Float, Enum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from ..core.database import Base


class QualityRuleTypeEnum(str, enum.Enum):
    """Quality rule type enumeration."""
    NULL_CHECK = "null_check"
    UNIQUE_CHECK = "unique_check"
    RANGE_CHECK = "range_check"
    FORMAT_CHECK = "format_check"
    REFERENCE_CHECK = "reference_check"
    CUSTOM_SQL = "custom_sql"
    ROW_COUNT = "row_count"
    FRESHNESS = "freshness"
    COMPLETENESS = "completeness"
    CONSISTENCY = "consistency"


class QualityStatusEnum(str, enum.Enum):
    """Quality check status enumeration."""
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    ERROR = "error"
    SKIPPED = "skipped"


class SeverityLevelEnum(str, enum.Enum):
    """Severity level enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class QualityRule(Base):
    """Quality rule model for defining data quality checks."""
    
    __tablename__ = "quality_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Target specification
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True, index=True)
    column_id = Column(Integer, ForeignKey("columns.id"), nullable=True, index=True)
    
    # Rule configuration
    rule_type = Column(Enum(QualityRuleTypeEnum), nullable=False, index=True)
    rule_config = Column(JSON, nullable=False)  # Rule-specific configuration
    
    # Thresholds and expectations
    expected_value = Column(String(500), nullable=True)
    min_threshold = Column(Float, nullable=True)
    max_threshold = Column(Float, nullable=True)
    
    # SQL for custom rules
    sql_query = Column(Text, nullable=True)
    
    # Rule metadata
    severity = Column(Enum(SeverityLevelEnum), default=SeverityLevelEnum.MEDIUM, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_blocking = Column(Boolean, default=False, nullable=False)  # Blocks data pipeline if fails
    
    # Scheduling
    check_frequency = Column(String(100), nullable=True)  # Cron expression
    last_check_at = Column(DateTime(timezone=True), nullable=True)
    next_check_at = Column(DateTime(timezone=True), nullable=True)
    
    # Ownership
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Tags for categorization
    tags = Column(JSON, nullable=True)  # List of tag names
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    table = relationship("Table")
    column = relationship("Column")
    creator = relationship("User", foreign_keys=[created_by])
    owner = relationship("User", foreign_keys=[owner_id])
    results = relationship("QualityResult", back_populates="rule", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<QualityRule(id={self.id}, name='{self.name}', rule_type='{self.rule_type}', table_id={self.table_id})>"


class QualityResult(Base):
    """Quality result model for storing quality check results."""
    
    __tablename__ = "quality_results"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("quality_rules.id"), nullable=False, index=True)
    
    # Check execution details
    check_id = Column(String(255), nullable=False, index=True)  # Unique execution identifier
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Results
    status = Column(Enum(QualityStatusEnum), nullable=False, index=True)
    score = Column(Float, nullable=True)  # 0.0 to 1.0 or percentage
    
    # Detailed results
    passed_count = Column(Integer, nullable=True)
    failed_count = Column(Integer, nullable=True)
    total_count = Column(Integer, nullable=True)
    
    # Metrics and measurements
    measured_value = Column(String(1000), nullable=True)
    expected_value = Column(String(1000), nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    error_details = Column(JSON, nullable=True)
    
    # Additional context
    execution_context = Column(JSON, nullable=True)
    sample_failures = Column(JSON, nullable=True)  # Sample of failed records
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    rule = relationship("QualityRule", back_populates="results")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_quality_rule_status', 'rule_id', 'status', 'started_at'),
        Index('idx_quality_check', 'check_id', 'rule_id'),
    )
    
    def __repr__(self):
        return f"<QualityResult(id={self.id}, rule_id={self.rule_id}, status='{self.status}', score={self.score})>"
    
    @property
    def duration_seconds(self) -> int:
        """Calculate check duration in seconds."""
        if self.started_at and self.completed_at:
            return int((self.completed_at - self.started_at).total_seconds())
        return 0
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_count and self.total_count > 0:
            return (self.passed_count or 0) / self.total_count * 100.0
        return 0.0


class QualityDimension(Base):
    """Quality dimension model for categorizing quality aspects."""
    
    __tablename__ = "quality_dimensions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Dimension metadata
    category = Column(String(100), nullable=True)  # accuracy, completeness, consistency, etc.
    weight = Column(Float, default=1.0, nullable=False)  # Weight in overall quality score
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<QualityDimension(id={self.id}, name='{self.name}', weight={self.weight})>"


class QualityDashboard(Base):
    """Quality dashboard model for aggregated quality metrics."""
    
    __tablename__ = "quality_dashboards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Dashboard scope
    scope_type = Column(String(50), nullable=False)  # global, domain, table, custom
    scope_config = Column(JSON, nullable=True)  # Scope-specific configuration
    
    # Metrics configuration
    metrics_config = Column(JSON, nullable=False)  # Dashboard metrics configuration
    
    # Display settings
    refresh_interval_minutes = Column(Integer, default=60, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    
    # Ownership
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_refreshed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    owner = relationship("User")
    
    def __repr__(self):
        return f"<QualityDashboard(id={self.id}, name='{self.name}', scope='{self.scope_type}')>"


class QualityAlert(Base):
    """Quality alert model for notifications on quality issues."""
    
    __tablename__ = "quality_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("quality_rules.id"), nullable=False, index=True)
    result_id = Column(Integer, ForeignKey("quality_results.id"), nullable=False, index=True)
    
    # Alert details
    alert_type = Column(String(50), nullable=False)  # threshold, anomaly, failure
    severity = Column(Enum(SeverityLevelEnum), nullable=False, index=True)
    message = Column(Text, nullable=False)
    
    # Recipients
    recipients = Column(JSON, nullable=False)  # List of user IDs or email addresses
    notification_channels = Column(JSON, nullable=True)  # email, slack, webhook
    
    # Status
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Notification status
    notification_sent = Column(Boolean, default=False, nullable=False)
    notification_sent_at = Column(DateTime(timezone=True), nullable=True)
    notification_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    rule = relationship("QualityRule")
    result = relationship("QualityResult")
    resolver = relationship("User", foreign_keys=[resolved_by])
    
    def __repr__(self):
        return f"<QualityAlert(id={self.id}, rule_id={self.rule_id}, severity='{self.severity}', is_resolved={self.is_resolved})>"