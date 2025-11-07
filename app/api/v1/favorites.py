from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import structlog

from ...core.database import get_db
from ...core.security import get_current_user, get_optional_user
from ...models.user import User, UserFavorite
from ...schemas.common import SuccessResponse
from app.models.table import Table, SensitivityLevelEnum

logger = structlog.get_logger()
router = APIRouter()



@router.post("/{table_id}/favorite", response_model=SuccessResponse)
async def add_table_to_favorites(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add table to user favorites."""
    try:
        user_id = current_user.id

        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Check if already favorited
        existing_favorite = db.query(UserFavorite).filter(
            UserFavorite.user_id == user_id,
            UserFavorite.table_id == table_id
        ).first()
        
        if existing_favorite:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Table is already in favorites"
            )
        
        # Create new favorite
        favorite = UserFavorite(
            user_id=user_id,
            table_id=table_id
        )
        db.add(favorite)
        db.commit()
        db.refresh(favorite)
        
        logger.info("Table added to favorites", user_id=user_id, table_id=table_id)
        
        return SuccessResponse(message="Table added to favorites successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Failed to add table to favorites", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add table to favorites"
        )
    

@router.delete("/{table_id}/favorite", response_model=SuccessResponse)
async def remove_table_from_favorites(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Updated to User model
):
    """Remove table from user favorites."""
    try:
        user_id = current_user.id  # Access directly from User object

        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Check if favorite exists
        favorite = db.query(UserFavorite).filter(
            UserFavorite.user_id == user_id,
            UserFavorite.table_id == table_id
        ).first()
        
        if not favorite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Favorite not found"
            )
        
        # Delete the favorite
        db.delete(favorite)
        db.commit()
        
        logger.info("Table removed from favorites", user_id=user_id, table_id=table_id)
        
        return SuccessResponse(message="Table removed from favorites successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Failed to remove table from favorites", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove table from favorites"
        )
    

# @router.post("/{table_id}/favorite", response_model=SuccessResponse)
# async def favorite_table(
#     table_id: int,
#     db: Session = Depends(get_db),
#     current_user: dict = Depends(get_optional_user)
# ):
#     """Add table to user favorites."""
#     try:
#         if not current_user:
#             # For demo purposes, just return success without authentication
#             return SuccessResponse(message="Table added to favorites")
        
#         user_id = current_user.get("user_id")
        
#         # Check if already favorited
#         existing = db.query(UserFavorite).filter(
#             UserFavorite.user_id == user_id,
#             UserFavorite.table_id == table_id
#         ).first()
        
#         if existing:
#             return SuccessResponse(message="Table already in favorites")
        
#         # Create favorite
#         favorite = UserFavorite(
#             user_id=user_id,
#             table_id=table_id
#         )
        
#         db.add(favorite)
#         db.commit()
        
#         logger.info("Table favorited", table_id=table_id, user_id=user_id)
        
#         return SuccessResponse(message="Table added to favorites")
        
#     except Exception as e:
#         logger.error("Failed to favorite table", table_id=table_id, error=str(e), exc_info=True)
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Failed to add to favorites"
#         )


# @router.delete("/{table_id}/favorite", response_model=SuccessResponse)
# async def unfavorite_table(
#     table_id: int,
#     db: Session = Depends(get_db),
#     current_user: dict = Depends(get_optional_user)
# ):
#     """Remove table from user favorites."""
#     try:
#         if not current_user:
#             # For demo purposes, just return success without authentication
#             return SuccessResponse(message="Table removed from favorites")
        
#         user_id = current_user.get("user_id")
        
#         # Find and remove favorite
#         favorite = db.query(UserFavorites).filter(
#             UserFavorites.user_id == user_id,
#             UserFavorites.table_id == table_id
#         ).first()
        
#         if not favorite:
#             return SuccessResponse(message="Table not in favorites")
        
#         db.delete(favorite)
#         db.commit()
        
#         logger.info("Table unfavorited", table_id=table_id, user_id=user_id)
        
#         return SuccessResponse(message="Table removed from favorites")
        
#     except Exception as e:
#         logger.error("Failed to unfavorite table", table_id=table_id, error=str(e), exc_info=True)
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Failed to remove from favorites"
#         )