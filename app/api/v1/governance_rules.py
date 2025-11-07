from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
import structlog

from ...core.database import get_db
from ...core.security import get_current_user, get_steward_user, get_optional_user
from ...core.dependencies import PaginationParams
from ...models.governance_rule import GovernanceRule
from ...schemas.governance_rule import (
    GovernanceRuleResponse, 
    GovernanceRuleCreate, 
    GovernanceRuleUpdate, 
    GovernanceRuleListResponse,
    DeleteRulesRequest,
    BulkDeleteResponse
)
from ...schemas.common import SuccessResponse

logger = structlog.get_logger()
router = APIRouter(prefix="/governance-rules", tags=["governance-rules"])


@router.get("", response_model=GovernanceRuleListResponse)
async def list_governance_rules(
    pagination: PaginationParams = Depends(PaginationParams),
    status_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    """List all governance rules with optional filtering."""
    try:
        query = db.query(GovernanceRule)
        
        # Apply filters
        if status_filter:
            query = query.filter(GovernanceRule.status == status_filter)
        if category_filter:
            query = query.filter(GovernanceRule.category == category_filter)
        if priority_filter:
            query = query.filter(GovernanceRule.priority == priority_filter)
        
        # Count total
        total = query.count()
        
        # Apply pagination
        rules = query.order_by(GovernanceRule.rule_id).offset(pagination.offset).limit(pagination.size).all()
        
        # Convert to response models
        rule_responses = []
        for rule in rules:
            rule_response = GovernanceRuleResponse(
                rule_id=rule.rule_id,
                rules=rule.rules,
                status=rule.status,
                category=rule.category,
                priority=rule.priority,
                created_at=rule.created_at,
                modified_at=rule.modified_at
            )
            rule_responses.append(rule_response)
        
        has_next = (pagination.offset + pagination.size) < total
        
        return GovernanceRuleListResponse(
            rules=rule_responses,
            total=total,
            page=pagination.page,
            size=pagination.size,
            has_next=has_next
        )
        
    except Exception as e:
        logger.error("Failed to list governance rules", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list governance rules"
        )


@router.post("", response_model=GovernanceRuleResponse)
async def create_governance_rule(
    rule_data: GovernanceRuleCreate,
    db: Session = Depends(get_db)
):
    """Create a new governance rule."""
    try:
        # Check for duplicate rule content (optional)
        existing = db.query(GovernanceRule).filter(GovernanceRule.rules == rule_data.rules).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A rule with similar content already exists"
            )
        
        # Create rule
        rule = GovernanceRule(
            rules=rule_data.rules,
            status=rule_data.status,
            category=rule_data.category,
            priority=rule_data.priority
        )
        
        db.add(rule)
        db.commit()
        db.refresh(rule)
        
        logger.info("Governance rule created", rule_id=rule.rule_id, category=rule.category)
        
        return GovernanceRuleResponse(
            rule_id=rule.rule_id,
            rules=rule.rules,
            status=rule.status,
            category=rule.category,
            priority=rule.priority,
            created_at=rule.created_at,
            modified_at=rule.modified_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create governance rule", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create governance rule"
        )


@router.get("/{rule_id}", response_model=GovernanceRuleResponse)
async def get_governance_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    """Get governance rule details."""
    try:
        rule = db.query(GovernanceRule).filter(GovernanceRule.rule_id == rule_id).first()
        
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Governance rule not found"
            )
        
        return GovernanceRuleResponse(
            rule_id=rule.rule_id,
            rules=rule.rules,
            status=rule.status,
            category=rule.category,
            priority=rule.priority,
            created_at=rule.created_at,
            modified_at=rule.modified_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get governance rule", rule_id=rule_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get governance rule"
        )


@router.put("/{rule_id}", response_model=GovernanceRuleResponse)
async def update_governance_rule(
    rule_id: int,
    rule_data: GovernanceRuleUpdate,
    db: Session = Depends(get_db)
):
    """Update governance rule."""
    try:
        rule = db.query(GovernanceRule).filter(GovernanceRule.rule_id == rule_id).first()
        
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Governance rule not found"
            )
        
       
        update_data = rule_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(rule, field, value)
        
        db.commit()
        db.refresh(rule)
        
        logger.info("Governance rule updated", rule_id=rule.rule_id)
        
        return GovernanceRuleResponse(
            rule_id=rule.rule_id,
            rules=rule.rules,
            status=rule.status,
            category=rule.category,
            priority=rule.priority,
            created_at=rule.created_at,
            modified_at=rule.modified_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update governance rule", rule_id=rule_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update governance rule"
        )


@router.delete("/", response_model=BulkDeleteResponse)
async def delete_multiple_governance_rules(
    payload: DeleteRulesRequest,
    db: Session = Depends(get_db)
):
    """Delete multiple governance rules in a single request."""
    try:
        rule_ids_to_delete = payload.rule_ids
        
        # Perform a bulk delete using the 'in_' operator
        deleted_count = db.query(GovernanceRule).filter(
            GovernanceRule.rule_id.in_(rule_ids_to_delete)
        ).delete(synchronize_session=False)

        # If no rows were deleted, it means none of the provided IDs were found
        if deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="None of the provided governance rule IDs were found."
            )

        db.commit()
        
        logger.info(
            f"Successfully deleted {deleted_count} governance rules.", 
            deleted_ids=rule_ids_to_delete
        )
        
        return BulkDeleteResponse(
            message=f"Successfully deleted {deleted_count} governance rules.",
            deleted_count=deleted_count
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to delete governance rules", 
            error=str(e), 
            exc_info=True
        )
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while deleting rules."
        )
    
