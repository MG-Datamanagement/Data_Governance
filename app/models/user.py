from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from ..core.database import Base


class UserRoleEnum(str, enum.Enum):
    """User role enumeration."""
    ADMIN = "admin"
    DATA_STEWARD = "data_steward"
    DATA_ANALYST = "data_analyst"
    VIEWER = "viewer"


class User(Base):
    """User model for authentication and authorization."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(320), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(128), nullable=False)
    role = Column(Enum(UserRoleEnum), default=UserRoleEnum.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    owned_tables = relationship("Table", back_populates="owner", foreign_keys="Table.owner_id")
    owned_domains = relationship("Domain", back_populates="steward", foreign_keys="Domain.steward_id")
    created_tags = relationship("TableTag", back_populates="creator")
    search_history = relationship("SearchHistory", back_populates="user")
    favorite_tables = relationship("UserFavorite", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    access_requests = relationship("AccessRequest", back_populates="user", foreign_keys="AccessRequest.user_id")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.name}', role='{self.role}')>"
    
    @property
    def is_admin(self) -> bool:
        """Check if user is admin."""
        return self.role == UserRoleEnum.ADMIN
    
    @property
    def is_steward(self) -> bool:
        """Check if user is steward or admin."""
        return self.role in [UserRoleEnum.ADMIN, UserRoleEnum.DATA_STEWARD]
    
    @property
    def is_analyst(self) -> bool:
        """Check if user has analyst privileges or higher."""
        return self.role in [UserRoleEnum.ADMIN, UserRoleEnum.DATA_STEWARD, UserRoleEnum.DATA_ANALYST]
    
    def can_edit_table(self, table) -> bool:
        """Check if user can edit a specific table."""
        return (
            self.is_admin or 
            self.is_steward or 
            table.owner_id == self.id
        )
    
    def can_view_table(self, table) -> bool:
        """Check if user can view a specific table."""
        # For now, all authenticated users can view all tables
        # This can be extended with more granular permissions
        return self.is_active


class UserSession(Base):
    """User session model for token management."""
    
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(128), unique=True, index=True, nullable=False)
    token_type = Column(String(20), nullable=False, default="access")  # access, refresh
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Session metadata
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_used_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id}, token_type='{self.token_type}', expires_at='{self.expires_at}')>"
    
    @property
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Check if session is valid (not revoked and not expired)."""
        return not self.is_revoked and not self.is_expired


class SearchHistory(Base):
    """User search history model."""
    
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    query = Column(String(500), nullable=False)
    filters = Column(Text, nullable=True)  # JSON string of applied filters
    results_count = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="search_history")
    
    def __repr__(self):
        return f"<SearchHistory(id={self.id}, user_id={self.user_id}, query='{self.query[:50]}...')>"


class UserFavorite(Base):
    """User favorite tables model."""
    
    __tablename__ = "user_favorites"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), primary_key=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="favorite_tables")
    table = relationship("Table", back_populates="favorited_by")
    
    def __repr__(self):
        return f"<UserFavorite(user_id={self.user_id}, table_id={self.table_id})>"