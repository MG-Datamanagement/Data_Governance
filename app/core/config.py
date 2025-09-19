from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    app_name: str = Field(default="MetaPortal", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    debug: bool = Field(default=False, description="Debug mode")
    
    # API
    api_v1_prefix: str = Field(default="/api/v1", description="API v1 prefix")
    docs_url: str = Field(default="/api/docs", description="API documentation URL")
    redoc_url: str = Field(default="/api/redoc", description="ReDoc documentation URL")
    
    # Database
    database_url: str = Field(..., description="PostgreSQL database URL")
    database_pool_size: int = Field(default=20, description="Database connection pool size")
    database_max_overflow: int = Field(default=30, description="Database max overflow connections")
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", description="Redis URL")
    redis_password: Optional[str] = Field(default=None, description="Redis password")
    
    # Security
    secret_key: str = Field(..., description="JWT secret key")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Access token expiration in minutes")
    refresh_token_expire_minutes: int = Field(default=1440, description="Refresh token expiration in minutes")
    
    # CORS
    allowed_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"], 
        description="Allowed CORS origins"
    )
    
    # Rate limiting
    rate_limit_per_minute: int = Field(default=100, description="API rate limit per minute")
    
    # Pagination
    default_page_size: int = Field(default=20, description="Default pagination page size")
    max_page_size: int = Field(default=100, description="Maximum pagination page size")
    
    # Search
    search_results_limit: int = Field(default=1000, description="Maximum search results")
    
    # Background tasks
    celery_broker_url: Optional[str] = Field(default=None, description="Celery broker URL")
    celery_result_backend: Optional[str] = Field(default=None, description="Celery result backend")
    
    # Monitoring
    enable_metrics: bool = Field(default=True, description="Enable Prometheus metrics")
    
    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(default="json", description="Log format (json or text)")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


# Global settings instance
settings = Settings()