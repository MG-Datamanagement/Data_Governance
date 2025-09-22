from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, Boolean,
    Enum, JSON, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class AuditActionEnum(str, enum.Enum):
    """Audit action enumeration."""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    SEARCH = "search"
    DOWNLOAD = "download"
    EXPORT = "export"
    TAG_ADD = "tag_add"
    TAG_REMOVE = "tag_remove"
    APPROVE = "approve"
    REJECT = "reject"


class ResourceTypeEnum(str, enum.Enum):
    """Resource type enumeration for audit logs."""
    USER = "user"
    TABLE = "table"
    COLUMN = "column"
    DATA_SOURCE = "data_source"
    DOMAIN = "domain"
    TAG = "tag"
    LINEAGE_EDGE = "lineage_edge"
    BUSINESS_GLOSSARY = "business_glossary"
    QUALITY_RULE = "quality_rule"
    ACCESS_REQUEST = "access_request"


class AuditLog(Base):
    """Audit log model for tracking all system activities."""
    
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Action details
    action = Column(Enum(AuditActionEnum), nullable=False, index=True)
    resource_type = Column(Enum(ResourceTypeEnum), nullable=False, index=True)
    resource_id = Column(Integer, nullable=True, index=True)
    resource_name = Column(String(500), nullable=True)
    
    # Context and details
    details = Column(JSON, nullable=True)  # Additional action details
    old_values = Column(JSON, nullable=True)  # Previous values for updates
    new_values = Column(JSON, nullable=True)  # New values for updates
    
    # Request metadata
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    session_id = Column(String(255), nullable=True)
    
    # API details
    endpoint = Column(String(500), nullable=True)
    http_method = Column(String(10), nullable=True)
    status_code = Column(Integer, nullable=True)
    
    # Success/failure information
    success = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action', 'created_at'),
        Index('idx_audit_resource', 'resource_type', 'resource_id', 'created_at'),
        Index('idx_audit_timestamp', 'created_at'),
    )
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, action='{self.action}', resource_type='{self.resource_type}')>"


class AccessRequestStatusEnum(str, enum.Enum):
    """Access request status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class AccessRequest(Base):
    """Access request model for requesting access to data assets."""
    
    __tablename__ = "access_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False, index=True)
    
    # Request details
    reason = Column(Text, nullable=False)
    business_justification = Column(Text, nullable=True)
    requested_access_level = Column(String(50), nullable=False)  # read, write, admin
    duration_days = Column(Integer, nullable=True)  # Requested access duration
    
    # Status and approval
    status = Column(Enum(AccessRequestStatusEnum), default=AccessRequestStatusEnum.PENDING, nullable=False, index=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Dates
    requested_start_date = Column(DateTime(timezone=True), nullable=True)
    requested_end_date = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="access_requests", foreign_keys=[user_id])
    table = relationship("Table")
    approver = relationship("User", foreign_keys=[approved_by])
    
    def __repr__(self):
        return f"<AccessRequest(id={self.id}, user_id={self.user_id}, table_id={self.table_id}, status='{self.status}')>"
    
    @property
    def is_pending(self) -> bool:
        """Check if request is still pending."""
        return self.status == AccessRequestStatusEnum.PENDING
    
    @property
    def is_approved(self) -> bool:
        """Check if request is approved."""
        return self.status == AccessRequestStatusEnum.APPROVED


class DataRetentionPolicy(Base):
    """Data retention policy model for compliance."""
    
    __tablename__ = "data_retention_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Policy rules
    retention_period_days = Column(Integer, nullable=False)
    applies_to_domains = Column(JSON, nullable=True)  # List of domain IDs
    applies_to_tags = Column(JSON, nullable=True)  # List of tag IDs
    applies_to_sensitivity = Column(JSON, nullable=True)  # List of sensitivity levels
    
    # Automation settings
    auto_delete_enabled = Column(Boolean, default=False, nullable=False)
    notification_days_before = Column(Integer, default=30, nullable=False)
    
    # Policy metadata
    regulatory_basis = Column(String(500), nullable=True)  # GDPR, CCPA, etc.
    exceptions = Column(Text, nullable=True)
    
    # Owner and approval
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    approver = relationship("User", foreign_keys=[approved_by])
    
    def __repr__(self):
        return f"<DataRetentionPolicy(id={self.id}, name='{self.name}', retention_days={self.retention_period_days})>"


class ComplianceReport(Base):
    """Compliance report model for regulatory reporting."""
    
    __tablename__ = "compliance_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    report_type = Column(String(100), nullable=False)  # gdpr, ccpa, sox, custom
    
    # Report configuration
    scope_domains = Column(JSON, nullable=True)  # Domain IDs in scope
    scope_tables = Column(JSON, nullable=True)  # Table IDs in scope
    
    # Report period
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Report results
    generated_at = Column(DateTime(timezone=True), nullable=True)
    report_data = Column(JSON, nullable=True)  # Generated report data
    file_path = Column(String(1000), nullable=True)  # Path to generated file
    
    # Status
    status = Column(String(50), default="pending", nullable=False)  # pending, generating, completed, failed
    
    # Creator information
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    creator = relationship("User")
    
    def __repr__(self):
        return f"<ComplianceReport(id={self.id}, name='{self.name}', type='{self.report_type}', status='{self.status}')>"