from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import redis
from typing import Generator
import structlog

from .config import settings

logger = structlog.get_logger()

# Database engine
engine = create_engine(
    settings.database_url,
    poolclass=QueuePool,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections every hour
    echo=settings.debug,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# Redis connection
redis_client = redis.Redis.from_url(
    settings.redis_url,
    password=settings.redis_password,
    decode_responses=True,
    retry_on_timeout=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error("Database session error", error=str(e))
        db.rollback()
        raise
    finally:
        db.close()


def get_redis() -> redis.Redis:
    """Get Redis client instance."""
    return redis_client


class DatabaseManager:
    """Database management utilities."""
    
    @staticmethod
    def create_tables():
        """Create all database tables."""
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error("Failed to create database tables", error=str(e))
            raise
    
    @staticmethod
    def drop_tables():
        """Drop all database tables."""
        try:
            Base.metadata.drop_all(bind=engine)
            logger.info("Database tables dropped successfully")
        except Exception as e:
            logger.error("Failed to drop database tables", error=str(e))
            raise
    
    @staticmethod
    def check_connection() -> bool:
        """Check if database connection is healthy."""
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error("Database connection check failed", error=str(e))
            return False


class RedisManager:
    """Redis management utilities."""
    
    @staticmethod
    def check_connection() -> bool:
        """Check if Redis connection is healthy."""
        try:
            redis_client.ping()
            return True
        except Exception as e:
            logger.error("Redis connection check failed", error=str(e))
            return False
    
    @staticmethod
    def flush_cache():
        """Flush all Redis cache."""
        try:
            redis_client.flushdb()
            logger.info("Redis cache flushed successfully")
        except Exception as e:
            logger.error("Failed to flush Redis cache", error=str(e))
            raise


# Event listeners for connection management
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set pragmas for SQLite (if used for testing)."""
    if "sqlite" in settings.database_url:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


@event.listens_for(engine, "checkout")
def checkout_listener(dbapi_connection, connection_record, connection_proxy):
    """Log database connection checkout."""
    if settings.debug:
        logger.debug("Database connection checked out")


@event.listens_for(engine, "checkin")
def checkin_listener(dbapi_connection, connection_record):
    """Log database connection checkin."""
    if settings.debug:
        logger.debug("Database connection checked in")