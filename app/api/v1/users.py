from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import structlog

from ...core.database import get_db
from ...core.security import get_current_user, get_admin_user
from ...core.dependencies import PaginationParams
from ...models.user import User
from ...schemas.user import UserResponse, UserCreate, UserUpdate, UserListResponse
from ...schemas.common import SuccessResponse

logger = structlog.get_logger()
router = APIRouter()


@router.get("", response_model=UserListResponse)
async def list_users(
    pagination: PaginationParams = Depends(PaginationParams),
    db: Session = Depends(get_db)
):
    """List all users (admin only)."""
    try:
        query = db.query(User).filter(User.is_active == True)
        
        # Count total
        total = query.count()
        
        # Apply pagination
        users = query.order_by(User.name).offset(pagination.offset).limit(pagination.size).all()
        
        # Convert to response models
        user_responses = [UserResponse.from_orm(user) for user in users]
        
        has_next = (pagination.offset + pagination.size) < total
        
        return UserListResponse(
            users=user_responses,
            total=total,
            page=pagination.page,
            size=pagination.size,
            has_next=has_next
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list users", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list users"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get user details."""
    try:
        # Users can view their own profile, admins can view any profile
        if current_user.id != user_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this user"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse.from_orm(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get user", user_id=user_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update user information."""
    try:
        # Users can update their own profile, admins can update any profile
        if current_user.id != user_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this user"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update fields
        update_data = user_data.dict(exclude_unset=True)
        
        # Only admins can change roles and active status
        if current_user.role != "admin":
            update_data.pop("role", None)
            update_data.pop("is_active", None)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        logger.info("User updated", user_id=user.id)
        
        return UserResponse.from_orm(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update user", user_id=user_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.delete("/{user_id}", response_model=SuccessResponse)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_admin_user)
):
    """Delete user (admin only, soft delete)."""
    try:
        if current_user.id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Soft delete
        user.is_active = False
        db.commit()
        
        logger.info("User deleted", user_id=user_id)
        
        return SuccessResponse(message="User deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete user", user_id=user_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )