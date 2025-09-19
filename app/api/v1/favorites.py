from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import structlog

from ...core.database import get_db
from ...core.security import get_optional_user
from ...models.user import UserFavorite
from ...schemas.common import SuccessResponse

logger = structlog.get_logger()
router = APIRouter()


@router.post("/{table_id}/favorite", response_model=SuccessResponse)
async def favorite_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    """Add table to user favorites."""
    try:
        if not current_user:
            # For demo purposes, just return success without authentication
            return SuccessResponse(message="Table added to favorites")
        
        user_id = current_user.get("user_id")
        
        # Check if already favorited
        existing = db.query(UserFavorite).filter(
            UserFavorite.user_id == user_id,
            UserFavorite.table_id == table_id
        ).first()
        
        if existing:
            return SuccessResponse(message="Table already in favorites")
        
        # Create favorite
        favorite = UserFavorite(
            user_id=user_id,
            table_id=table_id
        )
        
        db.add(favorite)
        db.commit()
        
        logger.info("Table favorited", table_id=table_id, user_id=user_id)
        
        return SuccessResponse(message="Table added to favorites")
        
    except Exception as e:
        logger.error("Failed to favorite table", table_id=table_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add to favorites"
        )


@router.delete("/{table_id}/favorite", response_model=SuccessResponse)
async def unfavorite_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    """Remove table from user favorites."""
    try:
        if not current_user:
            # For demo purposes, just return success without authentication
            return SuccessResponse(message="Table removed from favorites")
        
        user_id = current_user.get("user_id")
        
        # Find and remove favorite
        favorite = db.query(UserFavorites).filter(
            UserFavorites.user_id == user_id,
            UserFavorites.table_id == table_id
        ).first()
        
        if not favorite:
            return SuccessResponse(message="Table not in favorites")
        
        db.delete(favorite)
        db.commit()
        
        logger.info("Table unfavorited", table_id=table_id, user_id=user_id)
        
        return SuccessResponse(message="Table removed from favorites")
        
    except Exception as e:
        logger.error("Failed to unfavorite table", table_id=table_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove from favorites"
        )