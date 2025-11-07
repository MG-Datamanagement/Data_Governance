from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

from ..models.user import UserRoleEnum


class UserRole(str, Enum):
    """User role enumeration for API schemas."""
    ADMIN = "admin"
    DATA_STEWARD = "data_steward"
    DATA_ANALYST = "data_analyst"
    VIEWER = "viewer"


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr = Field(..., description="User email address")
    name: str = Field(..., min_length=1, max_length=255, description="User full name")
    role: UserRole = Field(default=UserRole.VIEWER, description="User role")
    is_active: bool = Field(default=True, description="Whether user is active")
    avatar_url: Optional[str] = Field(None, max_length=500, description="User avatar URL")
    bio: Optional[str] = Field(None, max_length=1000, description="User biography")


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="User full name")
    role: Optional[UserRole] = Field(None, description="User role")
    is_active: Optional[bool] = Field(None, description="Whether user is active")
    avatar_url: Optional[str] = Field(None, max_length=500, description="User avatar URL")
    bio: Optional[str] = Field(None, max_length=1000, description="User biography")


class UserResponse(UserBase):
    """Schema for user response."""
    id: int = Field(..., description="User ID")
    is_verified: bool = Field(..., description="Whether user email is verified")
    created_at: datetime = Field(..., description="User creation timestamp")
    updated_at: datetime = Field(..., description="User last update timestamp")
    last_login_at: Optional[datetime] = Field(None, description="Last login timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserProfile(UserResponse):
    """Extended user profile schema."""
    owned_tables_count: int = Field(0, description="Number of tables owned by user")
    owned_domains_count: int = Field(0, description="Number of domains stewarded by user")
    recent_activity: List[dict] = Field(default_factory=list, description="Recent user activity")


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserLoginResponse(BaseModel):
    """Schema for login response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: UserResponse = Field(..., description="User information")


class TokenRefresh(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str = Field(..., description="JWT refresh token")


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class PasswordChange(BaseModel):
    """Schema for password change."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('new_password')
    def validate_new_password(cls, v):
        """Validate new password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserSearchHistory(BaseModel):
    """Schema for user search history."""
    id: int = Field(..., description="Search history ID")
    query: str = Field(..., description="Search query")
    results_count: int = Field(..., description="Number of results returned")
    created_at: datetime = Field(..., description="Search timestamp")
    
    class Config:
        from_attributes = True


class UserFavorite(BaseModel):
    """Schema for user favorite tables."""
    table_id: int = Field(..., description="Favorite table ID")
    table_name: str = Field(..., description="Table name")
    table_description: Optional[str] = Field(None, description="Table description")
    created_at: datetime = Field(..., description="Favorite creation timestamp")
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """Schema for user statistics."""
    total_searches: int = Field(0, description="Total number of searches")
    favorite_tables_count: int = Field(0, description="Number of favorite tables")
    owned_tables_count: int = Field(0, description="Number of owned tables")
    domains_stewarded: int = Field(0, description="Number of domains stewarded")
    last_login_days_ago: Optional[int] = Field(None, description="Days since last login")
    activity_score: int = Field(0, description="User activity score (0-100)")


class UserListResponse(BaseModel):
    """Schema for paginated user list response."""
    users: List[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    has_next: bool = Field(..., description="Whether there are more pages")


class UserActivityResponse(BaseModel):
    """Schema for user activity response."""
    activity_type: str = Field(..., description="Type of activity")
    resource_type: str = Field(..., description="Type of resource")
    resource_name: str = Field(..., description="Name of resource")
    action: str = Field(..., description="Action performed")
    timestamp: datetime = Field(..., description="Activity timestamp")
    details: Optional[dict] = Field(None, description="Additional activity details")
    
    class Config:
        from_attributes = True