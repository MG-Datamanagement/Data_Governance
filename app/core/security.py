from typing import Annotated, Optional, Dict, Any
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import structlog

from .config import settings
from .database import get_db
from ..models.user import User

logger = structlog.get_logger()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Security
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.JWTError as e:
        logger.warning("Invalid token", error=str(e))
        return None


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Session = Depends(get_db),
    request: Request = None
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise credentials_exception
    
    # Check token type
    if payload.get("type") != "access":
        raise credentials_exception
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    return user


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[Dict[str, Any]]:
    """Get current user if authenticated, otherwise return None."""
    # Check for Authorization header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    try:
        # Extract token
        token = auth_header.split(" ")[1] if len(auth_header.split(" ")) == 2 else None
        if not token:
            return None
            
        payload = verify_token(token)
        
        if payload is None:
            return None
        
        # Check token type
        if payload.get("type") != "access":
            return None
        
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None or not user.is_active:
            return None
        
        # Return user info as dict for compatibility
        return {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role)
        }
    
    except Exception:
        return None


def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def authenticate_user(db: Session, email: str, password: str, request: Request = None) -> Optional[User]:
    """Authenticate user with email and password."""
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    # Check if user is active
    if not user.is_active:
        return None
    
    return user


def require_role(required_role: str):
    """Decorator to require specific role."""
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role.value != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


def require_roles(required_roles: list):
    """Decorator to require one of multiple roles."""
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role.value not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if admin."""
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_steward_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if data steward or admin."""
    if current_user.role.value not in ["admin", "data_steward"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Data steward access required"
        )
    return current_user


class SecurityManager:
    """Security manager class for backward compatibility."""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return verify_password(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password."""
        return hash_password(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        return create_access_token(data, expires_delta)
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create JWT refresh token."""
        return create_refresh_token(data)
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
        """Verify JWT token."""
        payload = verify_token(token)
        if payload and token_type == "refresh" and payload.get("type") != "refresh":
            return None
        return payload