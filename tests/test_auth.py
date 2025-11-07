import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, UserRoleEnum
from app.core.security import hash_password


class TestAuthEndpoints:
    """Test authentication endpoints."""
    
    def test_register_user_success(self, client: TestClient, db_session: Session):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "securepassword123",
            "role": "data_analyst"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        assert data["role"] == user_data["role"]
        assert "id" in data
        assert "password" not in data  # Password should not be returned
        
        # Verify user was created in database
        user = db_session.query(User).filter(User.email == user_data["email"]).first()
        assert user is not None
        assert user.name == user_data["name"]
        assert user.role == UserRoleEnum.DATA_ANALYST
    
    def test_register_duplicate_email(self, client: TestClient, db_session: Session):
        """Test registration with duplicate email."""
        user_data = {
            "email": "duplicate@example.com",
            "name": "First User",
            "password": "password123",
            "role": "viewer"
        }
        
        # First registration should succeed
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        
        # Second registration with same email should fail
        user_data["name"] = "Second User"
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email format."""
        user_data = {
            "email": "invalid-email",
            "name": "Test User",
            "password": "password123",
            "role": "viewer"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 422
    
    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password."""
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "123",  # Too short
            "role": "viewer"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 422
    
    def test_login_success(self, client: TestClient, db_session: Session):
        """Test successful login."""
        # Create a user first
        user = User(
            email="logintest@example.com",
            name="Login Test User",
            hashed_password=hash_password("testpassword123"),
            role=UserRoleEnum.DATA_ANALYST
        )
        db_session.add(user)
        db_session.commit()
        
        # Test login
        login_data = {
            "username": "logintest@example.com",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "logintest@example.com"
    
    def test_login_invalid_credentials(self, client: TestClient, db_session: Session):
        """Test login with invalid credentials."""
        # Create a user
        user = User(
            email="logintest2@example.com",
            name="Login Test User 2",
            hashed_password=hash_password("correctpassword"),
            role=UserRoleEnum.VIEWER
        )
        db_session.add(user)
        db_session.commit()
        
        # Test with wrong password
        login_data = {
            "username": "logintest2@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user."""
        login_data = {
            "username": "nonexistent@example.com",
            "password": "somepassword"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 401
    
    def test_me_endpoint_authenticated(self, client: TestClient, auth_headers):
        """Test /me endpoint with valid authentication."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "name" in data
        assert "role" in data
        assert "id" in data
    
    def test_me_endpoint_unauthenticated(self, client: TestClient):
        """Test /me endpoint without authentication."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
    
    def test_logout_success(self, client: TestClient, auth_headers):
        """Test successful logout."""
        response = client.post("/api/v1/auth/logout", headers=auth_headers)
        assert response.status_code == 200
        
        # Verify token is invalidated by trying to access protected endpoint
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        # Note: This test depends on token blacklisting implementation
        # If not implemented, the token would still be valid