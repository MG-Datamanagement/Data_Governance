"""
SQLAlchemy models for the MetaPortal data governance platform.
"""

# Import all models to ensure they're registered with SQLAlchemy
from .user import User, UserSession, UserRoleEnum, SearchHistory, UserFavorite
from .table import (
    DataSource, DataSourceTypeEnum, Domain, Table, Column, 
    TableStats, ColumnStats, SensitivityLevelEnum
)
from .tagging import Tag, TableTag, ColumnTag, BusinessGlossary, DataClassification
from .lineage import (
    LineageEdge, LineageJob, LineageJobRun, LineageImpactAnalysis,
    LineageTypeEnum, LineageSourceEnum
)
from .audit import (
    AuditLog, AccessRequest, DataRetentionPolicy, ComplianceReport,
    AuditActionEnum, ResourceTypeEnum, AccessRequestStatusEnum
)
from .quality import (
    QualityRule, QualityResult, QualityDimension, QualityDashboard, QualityAlert,
    QualityRuleTypeEnum, QualityStatusEnum, SeverityLevelEnum
)

from .governance_rule import GovernanceRule # Newly added governance rule model
# Export all models for easy importing
__all__ = [
    # User models
    "User",
    "UserSession", 
    "UserRoleEnum",
    "SearchHistory",
    "UserFavorite",
    
    # Table and data source models
    "DataSource",
    "DataSourceTypeEnum",
    "Domain", 
    "Table",
    "Column",
    "TableStats",
    "ColumnStats",
    "SensitivityLevelEnum",
    
    # Tagging models
    "Tag",
    "TableTag", 
    "ColumnTag",
    "BusinessGlossary",
    "DataClassification",
    
    # Lineage models
    "LineageEdge",
    "LineageJob",
    "LineageJobRun", 
    "LineageImpactAnalysis",
    "LineageTypeEnum",
    "LineageSourceEnum",
    
    # Audit models
    "AuditLog",
    "AccessRequest",
    "DataRetentionPolicy",
    "ComplianceReport", 
    "AuditActionEnum",
    "ResourceTypeEnum",
    "AccessRequestStatusEnum",
    
    # Quality models
    "QualityRule",
    "QualityResult",
    "QualityDimension",
    "QualityDashboard",
    "QualityAlert",
    "QualityRuleTypeEnum",
    "QualityStatusEnum", 
    "SeverityLevelEnum",

    # Governance Rule model
    "GovernanceRule"                
]