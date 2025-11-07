from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import structlog

from ...core.database import get_db
from ...core.security import get_current_user, get_steward_user, get_optional_user
from ...core.dependencies import PaginationParams
from ...models.tagging import Tag
from ...schemas.common import TagResponse, TagCreate, TagUpdate, SuccessResponse

logger = structlog.get_logger()
router = APIRouter()


@router.get("", response_model=dict)
async def list_tags(
    db: Session = Depends(get_db)
):
    """List all active tags."""
    try:
        tags = db.query(Tag).filter(Tag.is_active == True).order_by(Tag.name).all()
        
        # Convert to response models
        tag_responses = []
        for tag in tags:
            # Calculate usage count
            usage_count = len(tag.table_tags) + len(tag.column_tags)
            
            tag_response = TagResponse(
                id=tag.id,
                urn=tag.urn,
                name=tag.name,
                description=tag.description,
                color=tag.color,
                parent_tag_id=tag.parent_tag_id,
                is_system_tag=tag.is_system_tag,
                is_active=tag.is_active,
                created_at=tag.created_at,
                updated_at=tag.updated_at,
                usage_count=usage_count
            )
            tag_responses.append(tag_response)
        
        return {"items": tag_responses}
        
    except Exception as e:
        logger.error("Failed to list tags", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list tags"
        )


@router.post("", response_model=TagResponse)
async def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db)
):
    """Create a new tag."""
    try:
        # Check for duplicate name
        existing = db.query(Tag).filter(Tag.name == tag_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag name already exists"
            )
        
        # Verify parent tag exists (if provided)
        if tag_data.parent_tag_id:
            parent = db.query(Tag).filter(Tag.id == tag_data.parent_tag_id).first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent tag not found"
                )
        
        # Create tag
        tag = Tag(
            name=tag_data.name,
            description=tag_data.description,
            color=tag_data.color,
            parent_tag_id=tag_data.parent_tag_id,
            is_system_tag=tag_data.is_system_tag
        )
        
        db.add(tag)
        db.commit()
        db.refresh(tag)
        
        logger.info("Tag created", tag_id=tag.id, name=tag.name)
        
        return TagResponse(
            id=tag.id,
            urn=tag.urn,
            name=tag.name,
            description=tag.description,
            color=tag.color,
            parent_tag_id=tag.parent_tag_id,
            is_system_tag=tag.is_system_tag,
            is_active=tag.is_active,
            created_at=tag.created_at,
            updated_at=tag.updated_at,
            usage_count=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create tag", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create tag"
        )


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: int,
    db: Session = Depends(get_db)
):
    """Get tag details."""
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tag not found"
            )
        
        # Calculate usage count
        usage_count = len(tag.table_tags) + len(tag.column_tags)
        
        return TagResponse(
            id=tag.id,
            urn=tag.urn,
            name=tag.name,
            description=tag.description,
            color=tag.color,
            parent_tag_id=tag.parent_tag_id,
            is_system_tag=tag.is_system_tag,
            is_active=tag.is_active,
            created_at=tag.created_at,
            updated_at=tag.updated_at,
            usage_count=usage_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get tag", tag_id=tag_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get tag"
        )


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: Session = Depends(get_db)
):
    """Update tag."""
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tag not found"
            )
        
        # Check if user can modify system tags
        if tag.is_system_tag :
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify system tags"
            )
        
        # Update fields
        update_data = tag_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tag, field, value)
        
        db.commit()
        db.refresh(tag)
        
        logger.info("Tag updated", tag_id=tag.id)
        
        usage_count = len(tag.table_tags) + len(tag.column_tags)
        
        return TagResponse(
            id=tag.id,
            urn=tag.urn,
            name=tag.name,
            description=tag.description,
            color=tag.color,
            parent_tag_id=tag.parent_tag_id,
            is_system_tag=tag.is_system_tag,
            is_active=tag.is_active,
            created_at=tag.created_at,
            updated_at=tag.updated_at,
            usage_count=usage_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update tag", tag_id=tag_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update tag"
        )


@router.delete("/{tag_id}", response_model=SuccessResponse)
async def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db)
):
    """Delete tag."""
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tag not found"
            )
        
        # Check if user can delete system tags
        if tag.is_system_tag :
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete system tags"
            )
        
        # Check if tag is in use
        usage_count = len(tag.table_tags) + len(tag.column_tags)
        if usage_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete tag that is used by {usage_count} items"
            )
        
        # Check for child tags
        child_tags = db.query(Tag).filter(Tag.parent_tag_id == tag_id).count()
        if child_tags > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete tag with {child_tags} child tags"
            )
        
        # Delete tag
        db.delete(tag)
        db.commit()
        
        logger.info("Tag deleted", tag_id=tag_id)
        
        return SuccessResponse(message="Tag deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete tag", tag_id=tag_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete tag"
        )