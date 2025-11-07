import pytest
import asyncio
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "name": "Test User",
        "password": "testpassword123",
        "role": "data_analyst"
    }


@pytest.fixture
def sample_table_data():
    """Sample table data for testing."""
    return {
        "name": "test_table",
        "description": "Test table for unit tests",
        "schema_name": "public",
        "table_type": "table",
        "row_count": 1000,
        "size_mb": 25.5,
        "domain_id": 1,
        "data_source_id": 1,
        "columns": [
            {
                "name": "id",
                "data_type": "integer",
                "is_nullable": False,
                "is_primary_key": True,
                "description": "Primary key"
            },
            {
                "name": "name",
                "data_type": "varchar",
                "is_nullable": False,
                "is_primary_key": False,
                "description": "Name field"
            }
        ]
    }


@pytest.fixture
def auth_headers(client: TestClient, db_session, sample_user_data):
    """Create authenticated headers for API requests."""
    # Create user
    response = client.post("/api/v1/auth/register", json=sample_user_data)
    assert response.status_code == 201
    
    # Login
    login_data = {
        "username": sample_user_data["email"],
        "password": sample_user_data["password"]
    }
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}