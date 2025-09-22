from typing import Optional, Generator
from fastapi import Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import redis
import structlog

from .database import get_db, get_redis
from .security import get_current_user, get_optional_user
from .config import settings
from ..models.user import User, UserRoleEnum

logger = structlog.get_logger()


class PaginationParams:
    """Common pagination parameters."""
    
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number (starts from 1)"),
        size: int = Query(
            settings.default_page_size, 
            ge=1, 
            le=settings.max_page_size,
            description="Number of items per page"
        )
    ):
        self.page = page
        self.size = size
        self.offset = (page - 1) * size


class SearchParams:
    """Common search parameters."""
    
    def __init__(
        self,
        q: Optional[str] = Query(None, min_length=1, max_length=500, description="Search query"),
        domain_ids: Optional[list[int]] = Query(None, description="Filter by domain IDs"),
        tag_ids: Optional[list[int]] = Query(None, description="Filter by tag IDs"),
        owner_ids: Optional[list[int]] = Query(None, description="Filter by owner IDs"),
        data_source_ids: Optional[list[int]] = Query(None, description="Filter by data source IDs"),
        sensitivity_levels: Optional[list[str]] = Query(None, description="Filter by sensitivity levels"),
        created_after: Optional[str] = Query(None, description="Filter by creation date (ISO format)"),
        created_before: Optional[str] = Query(None, description="Filter by creation date (ISO format)"),
        sort_by: Optional[str] = Query("updated_at", description="Sort field"),
        sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order")
    ):
        self.q = q
        self.domain_ids = domain_ids or []
        self.tag_ids = tag_ids or []
        self.owner_ids = owner_ids or []
        self.data_source_ids = data_source_ids or []
        self.sensitivity_levels = sensitivity_levels or []
        self.created_after = created_after
        self.created_before = created_before
        self.sort_by = sort_by
        self.sort_order = sort_order


def get_pagination_params() -> PaginationParams:
    """Dependency for pagination parameters."""
    return Depends(PaginationParams)


def get_search_params() -> SearchParams:
    """Dependency for search parameters."""
    return Depends(SearchParams)


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency requiring admin role."""
    if current_user.role != UserRoleEnum.ADMIN:
        logger.warning(
            "Admin access required",
            user_id=current_user.id,
            user_role=current_user.role
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_steward_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency requiring steward or admin role."""
    allowed_roles = [UserRoleEnum.ADMIN, UserRoleEnum.DATA_STEWARD]
    if current_user.role not in allowed_roles:
        logger.warning(
            "Steward access required",
            user_id=current_user.id,
            user_role=current_user.role
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Steward or admin access required"
        )
    return current_user


def get_analyst_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency requiring analyst, steward, or admin role."""
    allowed_roles = [UserRoleEnum.ADMIN, UserRoleEnum.DATA_STEWARD, UserRoleEnum.DATA_ANALYST]
    if current_user.role not in allowed_roles:
        logger.warning(
            "Analyst access required",
            user_id=current_user.id,
            user_role=current_user.role
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Analyst, steward, or admin access required"
        )
    return current_user


class CommonDependencies:
    """Common dependencies for API endpoints."""
    
    @staticmethod
    def get_db_session() -> Generator[Session, None, None]:
        """Get database session dependency."""
        return get_db()
    
    @staticmethod
    def get_redis_client() -> redis.Redis:
        """Get Redis client dependency."""
        return get_redis()
    
    @staticmethod
    def get_current_user_info() -> User:
        """Get current authenticated user dependency."""
        return get_current_user()
    
    @staticmethod
    def get_optional_user_info() -> Optional[User]:
        """Get optional user info dependency."""
        return get_optional_user()


class ValidationHelpers:
    """Helper functions for input validation."""
    
    @staticmethod
    def validate_table_name(name: str) -> str:
        """Validate table name format."""
        if not name or len(name.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table name cannot be empty"
            )
        
        # Remove extra whitespace
        name = name.strip()
        
        # Check length
        if len(name) > 255:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table name too long (max 255 characters)"
            )
        
        return name
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Basic email validation."""
        if not email or "@" not in email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        
        return email.lower().strip()
    
    @staticmethod
    def validate_page_size(size: int) -> int:
        """Validate pagination page size."""
        if size < 1:
            return settings.default_page_size
        if size > settings.max_page_size:
            return settings.max_page_size
        return size


class CacheKeys:
    """Redis cache key constants."""
    
    USER_PREFIX = "user:"
    TABLE_PREFIX = "table:"
    SEARCH_PREFIX = "search:"
    LINEAGE_PREFIX = "lineage:"
    STATS_PREFIX = "stats:"
    
    @staticmethod
    def user_key(user_id: int) -> str:
        """Generate user cache key."""
        return f"{CacheKeys.USER_PREFIX}{user_id}"
    
    @staticmethod
    def table_key(table_id: int) -> str:
        """Generate table cache key."""
        return f"{CacheKeys.TABLE_PREFIX}{table_id}"
    
    @staticmethod
    def search_key(query: str, filters: dict) -> str:
        """Generate search cache key."""
        import hashlib
        filter_str = str(sorted(filters.items()))
        key_data = f"{query}:{filter_str}"
        hash_key = hashlib.md5(key_data.encode()).hexdigest()
        return f"{CacheKeys.SEARCH_PREFIX}{hash_key}"
    
    @staticmethod
    def lineage_key(table_id: int, direction: str) -> str:
        """Generate lineage cache key."""
        return f"{CacheKeys.LINEAGE_PREFIX}{table_id}:{direction}"
    
    @staticmethod
    def stats_key(resource_type: str, resource_id: int) -> str:
        """Generate stats cache key."""
        return f"{CacheKeys.STATS_PREFIX}{resource_type}:{resource_id}"