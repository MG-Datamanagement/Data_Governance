from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from prometheus_fastapi_instrumentator import Instrumentator
import structlog
import time
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi.routing import APIRouter

from .core.config import settings
from .core.database import DatabaseManager, RedisManager
from .schemas.common import ErrorResponse, HealthCheck


# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer() if settings.log_format == "json" else structlog.dev.ConsoleRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    logger.info("Starting MetaPortal application", version=settings.app_version)
    
    # Check database connection
    if not DatabaseManager.check_connection():
        logger.error("Failed to connect to database")
        raise Exception("Database connection failed")
    
    # Check Redis connection (optional for local development)
    redis_connected = RedisManager.check_connection()
    if redis_connected:
        logger.info("Redis connection successful")
    else:
        logger.warning("Redis connection failed - running without caching")
    
    # Create database tables if they don't exist
    try:
        DatabaseManager.create_tables()
        logger.info("Database tables verified/created")
    except Exception as e:
        logger.error("Failed to create database tables", error=str(e))
        raise
    
    logger.info("MetaPortal application started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down MetaPortal application")


# Create FastAPI application
app = FastAPI(
    title="MetaPortal API",
    description="Production-grade data governance platform for discovering, cataloging, and governing data assets",
    version=settings.app_version,
    docs_url=settings.docs_url,
    redoc_url=settings.redoc_url,
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "auth",
            "description": "Authentication and user management"
        },
        {
            "name": "users",
            "description": "User management operations"
        },
        {
            "name": "data-sources",
            "description": "Data source management"
        },
        {
            "name": "tables", 
            "description": "Table and metadata management"
        },
        {
            "name": "domains",
            "description": "Business domain management"
        },
        {
            "name": "tags",
            "description": "Tagging and classification system"
        },
        {
            "name": "search",
            "description": "Search and discovery"
        },
        {
            "name": "lineage",
            "description": "Data lineage tracking"
        },
        {
            "name": "quality",
            "description": "Data quality monitoring"
        },
        {
            "name": "governance",
            "description": "Data governance and compliance"
        },
        {
            "name": "system",
            "description": "System health and monitoring"
        }
    ]
)

# Security middleware
if settings.allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Add timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(
        "Request started",
        method=request.method,
        path=request.url.path,
        query_params=str(request.query_params) if request.query_params else None,
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    response = await call_next(request)
    
    # Log response
    duration = time.time() - start_time
    logger.info(
        "Request completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration=f"{duration:.3f}s"
    )
    
    return response


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    logger.warning(
        "Validation error",
        path=request.url.path,
        errors=exc.errors()
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="validation_error",
            message="Invalid request data",
            details={"errors": exc.errors()}
        ).dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        error=str(exc),
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="internal_server_error",
            message="An unexpected error occurred"
        ).dict()
    )


# Health check endpoint
@app.get("/health", response_model=HealthCheck, tags=["system"])
async def health_check():
    """System health check endpoint."""
    db_healthy = DatabaseManager.check_connection()
    redis_healthy = RedisManager.check_connection()
    
    overall_status = "healthy" if db_healthy and redis_healthy else "unhealthy"
    
    return HealthCheck(
        status=overall_status,
        timestamp=time.time(),
        version=settings.app_version,
        environment="production",  # This should come from environment
        database={
            "status": "healthy" if db_healthy else "unhealthy",
            "connected": db_healthy
        },
        redis={
            "status": "healthy" if redis_healthy else "unhealthy", 
            "connected": redis_healthy
        }
    )


# Add metrics monitoring if enabled
if settings.enable_metrics:
    instrumentator = Instrumentator()
    instrumentator.instrument(app).expose(app, endpoint="/metrics")


# Import and include API routers
try:
    from .api.v1.auth import router as auth_router
    from .api.v1.users import router as users_router
    from .api.v1.data_sources import router as data_sources_router
    from .api.v1.tables import router as tables_router
    from .api.v1.domains import router as domains_router
    from .api.v1.tags import router as tags_router
    from .api.v1.favorites import router as favorites_router
    from .api.v1.search import router as search_router
    from .api.v1.lineage import router as lineage_router
    from .api.v1.quality import router as quality_router
    
    # Include routers with API versioning
    app.include_router(auth_router, prefix=f"{settings.api_v1_prefix}/auth", tags=["auth"])
    app.include_router(users_router, prefix=f"{settings.api_v1_prefix}/users", tags=["users"])
    app.include_router(data_sources_router, prefix=f"{settings.api_v1_prefix}/data-sources", tags=["data-sources"])
    app.include_router(tables_router, prefix=f"{settings.api_v1_prefix}/tables", tags=["tables"])
    app.include_router(domains_router, prefix=f"{settings.api_v1_prefix}/domains", tags=["domains"])
    app.include_router(tags_router, prefix=f"{settings.api_v1_prefix}/tags", tags=["tags"])
    app.include_router(search_router, prefix=f"{settings.api_v1_prefix}/search", tags=["search"])
    app.include_router(lineage_router, prefix=f"{settings.api_v1_prefix}/lineage", tags=["lineage"])
    app.include_router(quality_router, prefix=f"{settings.api_v1_prefix}/quality", tags=["quality"])
    app.include_router(favorites_router, prefix=f"{settings.api_v1_prefix}/favourites", tags=["favourites"])
    
    logger.info("API routers loaded successfully")
    
except ImportError as e:
    logger.warning("Some API routers could not be imported", error=str(e))


# Root endpoint
@app.get("/", tags=["system"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "MetaPortal API",
        "version": settings.app_version,
        "description": "Production-grade data governance platform",
        "docs_url": settings.docs_url,
        "redoc_url": settings.redoc_url,
        "health_check": "/health",
        "metrics": "/metrics" if settings.enable_metrics else None
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )