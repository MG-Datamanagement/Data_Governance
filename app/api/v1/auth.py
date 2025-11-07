from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
import structlog

from ...core.database import get_db
from ...core.security import SecurityManager, get_current_user
from ...core.config import settings
from ...models.user import User
from ...schemas.user import (
    UserLogin, UserLoginResponse, UserCreate, UserResponse,
    TokenRefresh, TokenResponse, PasswordChange
)
from ...schemas.common import SuccessResponse, ErrorResponse

logger = structlog.get_logger()
router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=UserLoginResponse)
async def login(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access/refresh tokens.
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == user_credentials.email).first()
        
        if not user:
            logger.warning("Login attempt with non-existent email", email=user_credentials.email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.is_active:
            logger.warning("Login attempt for inactive user", user_id=user.id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Verify password
        if not SecurityManager.verify_password(user_credentials.password, user.hashed_password):
            logger.warning("Failed login attempt", user_id=user.id, email=user.email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
        
        access_token = SecurityManager.create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        ) # where these are stored -- These tokens are not stored anywhere; they are stateless
        
        refresh_token = SecurityManager.create_refresh_token(
            data=token_data,
            # expires_delta=timedelta(minutes=settings.refresh_token_expire_minutes)
        )
        
        # Update last login
        from datetime import datetime
        user.last_login_at = datetime.utcnow()
        db.commit()
        
        logger.info("Successful login", user_id=user.id, email=user.email)
        
        return UserLoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_request: TokenRefresh,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    try:
        # Verify refresh token
        payload = SecurityManager.verify_token(token_request.refresh_token, token_type="refresh")
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Verify user still exists and is active
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new access token
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
        
        access_token = SecurityManager.create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
        )
        
        logger.info("Token refreshed", user_id=user.id)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Token refresh error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@router.post("/logout", response_model=SuccessResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user (in a real implementation, this would invalidate the token).
    """
    try:
        # Corrected line: access the user ID using dot notation
        logger.info("User logged out", user_id=current_user.id)
        
        return SuccessResponse(
            message="Successfully logged out"
        )
        
    except Exception as e:
        logger.error("Logout error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user information.
    """
    try:
        # Corrected line: access the user ID using dot notation
        user_id = current_user.id
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
        logger.error("Get current user error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    """
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = SecurityManager.get_password_hash(user_data.password)
        
        # Create user
        user = User(
            email=user_data.email,
            name=user_data.name,
            hashed_password=hashed_password,
            role=user_data.role,
            is_active=user_data.is_active,
            avatar_url=user_data.avatar_url,
            bio=user_data.bio
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info("New user registered", user_id=user.id, email=user.email)
        
        return UserResponse.from_orm(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Registration error", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/change-password", response_model=SuccessResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password.
    """
    try:
        user_id = current_user.id
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not SecurityManager.verify_password(password_data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_hashed_password = SecurityManager.get_password_hash(password_data.new_password)
        
        # Update password
        user.hashed_password = new_hashed_password
        db.commit()
        
        logger.info("Password changed", user_id=user.id)
        
        return SuccessResponse(
            message="Password changed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Password change error", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )