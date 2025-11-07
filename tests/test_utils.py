import pytest
from unittest.mock import Mock, patch

from app.utils.urn_utils import URNGenerator
from app.models.resource_urn import ResourceType, Environment


class TestURNUtils:
    """Test URN utility functions."""
    
    def test_generate_table_urn(self):
        """Test generating URN for table."""
        table_id = 123
        urn = URNGenerator.generate_table_urn(table_id)
        
        expected_urn = f"urn:metaportal:development:table:{table_id}"
        assert urn == expected_urn
    
    def test_generate_domain_urn(self):
        """Test generating URN for domain."""
        domain_id = 456
        urn = URNGenerator.generate_domain_urn(domain_id)
        
        expected_urn = f"urn:metaportal:development:domain:{domain_id}"
        assert urn == expected_urn
    
    def test_generate_data_source_urn(self):
        """Test generating URN for data source."""
        ds_id = 789
        urn = URNGenerator.generate_data_source_urn(ds_id)
        
        expected_urn = f"urn:metaportal:development:data_source:{ds_id}"
        assert urn == expected_urn
    
    def test_parse_urn_valid(self):
        """Test parsing valid URN."""
        urn = "urn:metaportal:production:table:123"
        parsed = URNGenerator.parse_urn(urn)
        
        assert parsed["platform"] == "metaportal"
        assert parsed["environment"] == "production"
        assert parsed["resource_type"] == "table"
        assert parsed["resource_id"] == "123"
    
    def test_parse_urn_invalid(self):
        """Test parsing invalid URN."""
        invalid_urn = "invalid:urn:format"
        parsed = URNGenerator.parse_urn(invalid_urn)
        
        assert parsed is None
    
    def test_validate_urn_valid(self):
        """Test validating valid URN."""
        valid_urn = "urn:metaportal:development:table:123"
        assert URNGenerator.validate_urn(valid_urn) is True
    
    def test_validate_urn_invalid(self):
        """Test validating invalid URN."""
        invalid_urn = "not-a-valid-urn"
        assert URNGenerator.validate_urn(invalid_urn) is False
    
    def test_extract_resource_id(self):
        """Test extracting resource ID from URN."""
        urn = "urn:metaportal:development:table:456"
        resource_id = URNGenerator.extract_resource_id(urn)
        
        assert resource_id == "456"
    
    def test_extract_resource_id_invalid(self):
        """Test extracting resource ID from invalid URN."""
        invalid_urn = "invalid-urn"
        resource_id = URNGenerator.extract_resource_id(invalid_urn)
        
        assert resource_id is None
    
    def test_get_resource_type_from_urn(self):
        """Test getting resource type from URN."""
        urn = "urn:metaportal:development:domain:789"
        resource_type = URNGenerator.get_resource_type_from_urn(urn)
        
        assert resource_type == "domain"
    
    def test_get_resource_type_from_invalid_urn(self):
        """Test getting resource type from invalid URN."""
        invalid_urn = "invalid-urn"
        resource_type = URNGenerator.get_resource_type_from_urn(invalid_urn)
        
        assert resource_type is None
    
    def test_different_environments(self):
        """Test URN generation for different environments."""
        with patch('app.core.config.settings.environment', 'production'):
            table_id = 123
            urn = URNGenerator.generate_table_urn(table_id)
            assert "production" in urn
        
        with patch('app.core.config.settings.environment', 'staging'):
            table_id = 123
            urn = URNGenerator.generate_table_urn(table_id)
            assert "staging" in urn
    
    def test_urn_format_consistency(self):
        """Test URN format consistency across different resource types."""
        table_urn = URNGenerator.generate_table_urn(1)
        domain_urn = URNGenerator.generate_domain_urn(2)
        ds_urn = URNGenerator.generate_data_source_urn(3)
        
        # All should start with same prefix
        prefix = "urn:metaportal:development:"
        assert table_urn.startswith(prefix)
        assert domain_urn.startswith(prefix)
        assert ds_urn.startswith(prefix)
        
        # All should have correct format
        assert URNGenerator.validate_urn(table_urn)
        assert URNGenerator.validate_urn(domain_urn)
        assert URNGenerator.validate_urn(ds_urn)


class TestSecurityUtils:
    """Test security utility functions."""
    
    def test_password_hashing(self):
        """Test password hashing."""
        from app.core.security import hash_password, verify_password
        
        password = "mysecretpassword"
        hashed = hash_password(password)
        
        # Hash should be different from original
        assert hashed != password
        
        # Should be able to verify
        assert verify_password(password, hashed) is True
        
        # Wrong password should not verify
        assert verify_password("wrongpassword", hashed) is False
    
    def test_jwt_token_creation(self):
        """Test JWT token creation."""
        from app.core.security import create_access_token
        
        data = {"sub": "user@example.com", "role": "admin"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_jwt_token_verification(self):
        """Test JWT token verification."""
        from app.core.security import create_access_token, verify_token
        
        data = {"sub": "user@example.com", "role": "admin"}
        token = create_access_token(data)
        
        # Verify token
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "user@example.com"
        assert payload["role"] == "admin"
    
    def test_invalid_jwt_token(self):
        """Test invalid JWT token verification."""
        from app.core.security import verify_token
        
        invalid_token = "invalid.token.here"
        payload = verify_token(invalid_token)
        
        assert payload is None
    
    def test_expired_jwt_token(self):
        """Test expired JWT token verification."""
        from app.core.security import create_access_token, verify_token
        from datetime import timedelta
        
        data = {"sub": "user@example.com"}
        # Create token that expires immediately
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        
        # Should be invalid due to expiration
        payload = verify_token(token)
        assert payload is None


class TestDatabaseUtils:
    """Test database utility functions."""
    
    def test_database_connection_string_parsing(self):
        """Test database connection string parsing."""
        from app.core.config import settings
        
        # Test that database URL is properly formatted
        db_url = settings.database_url
        assert db_url is not None
        assert db_url.startswith("postgresql://")
    
    def test_pagination_helper(self):
        """Test pagination helper function."""
        # This would test pagination utility if it exists
        # Since it's not in the current codebase, this is a placeholder
        pass


class TestValidationUtils:
    """Test validation utility functions."""
    
    def test_email_validation(self):
        """Test email validation."""
        from pydantic import ValidationError
        from app.schemas.user import UserCreate
        
        # Valid email should pass
        valid_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "password123",
            "role": "viewer"
        }
        user = UserCreate(**valid_data)
        assert user.email == "test@example.com"
        
        # Invalid email should fail
        invalid_data = {
            "email": "invalid-email",
            "name": "Test User",
            "password": "password123",
            "role": "viewer"
        }
        with pytest.raises(ValidationError):
            UserCreate(**invalid_data)
    
    def test_role_validation(self):
        """Test role validation."""
        from pydantic import ValidationError
        from app.schemas.user import UserCreate
        
        # Valid role should pass
        valid_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "password123",
            "role": "data_analyst"
        }
        user = UserCreate(**valid_data)
        assert user.role == "data_analyst"
        
        # Invalid role should fail
        invalid_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "password123",
            "role": "invalid_role"
        }
        with pytest.raises(ValidationError):
            UserCreate(**invalid_data)