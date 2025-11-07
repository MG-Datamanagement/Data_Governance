from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class GovernanceRuleStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"

class RulePriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class GovernanceRuleBase(BaseModel):
    rules: str = Field(..., description="The governance rule content")
    status: GovernanceRuleStatus = Field(..., description="Rule status")
    category: str = Field(..., description="Rule category")
    priority: RulePriority = Field(..., description="Rule priority")

class GovernanceRuleCreate(GovernanceRuleBase):
    pass

class GovernanceRuleUpdate(BaseModel):
    rules: Optional[str] = None
    status: Optional[GovernanceRuleStatus] = None
    category: Optional[str] = None
    priority: Optional[RulePriority] = None

class GovernanceRuleResponse(GovernanceRuleBase):
    rule_id: int
    created_at: datetime
    modified_at: datetime

    class Config:
        from_attributes = True

class GovernanceRuleListResponse(BaseModel):
    rules: List[GovernanceRuleResponse]
    total: int
    page: int
    size: int
    has_next: bool

class DeleteRulesRequest(BaseModel):
    """Request model for deleting multiple rules."""
    rule_ids: List[int] = Field(..., min_items=1, description="A list of rule IDs to delete.")

class BulkDeleteResponse(BaseModel):
    """Response model for a successful bulk delete operation."""
    message: str
    deleted_count: int