import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, UserRoleEnum
from app.models.table import Table, DataSource, Domain, DataSourceTypeEnum
from app.core.security import hash_password


class TestTablesEndpoints:
    """Test table management endpoints."""
    
    @pytest.fixture
    def sample_domain(self, db_session: Session):
        """Create a sample domain for testing."""
        # Create a user to be the steward
        user = User(
            email="steward@example.com",
            name="Domain Steward",
            hashed_password=hash_password("password123"),
            role=UserRoleEnum.DATA_STEWARD
        )
        db_session.add(user)
        db_session.commit()
        
        domain = Domain(
            name="Test Domain",
            description="Test domain for unit tests",
            steward_id=user.id
        )
        db_session.add(domain)
        db_session.commit()
        return domain
    
    @pytest.fixture
    def sample_data_source(self, db_session: Session):
        """Create a sample data source for testing."""
        data_source = DataSource(
            name="Test Database",
            description="Test database for unit tests",
            type=DataSourceTypeEnum.POSTGRESQL,
            connection_config={"host": "localhost", "port": 5432}
        )
        db_session.add(data_source)
        db_session.commit()
        return data_source
    
    def test_create_table_success(self, client: TestClient, auth_headers, db_session: Session, 
                                 sample_domain, sample_data_source):
        """Test successful table creation."""
        table_data = {
            "name": "test_table",
            "description": "Test table for API testing",
            "schema_name": "public",
            "table_type": "table",
            "row_count": 1000,
            "size_mb": 25.5,
            "domain_id": sample_domain.id,
            "data_source_id": sample_data_source.id,
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
        
        response = client.post("/api/v1/tables", json=table_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == table_data["name"]
        assert data["description"] == table_data["description"]
        assert data["domain_id"] == sample_domain.id
        assert data["data_source_id"] == sample_data_source.id
        assert len(data["columns"]) == 2
        assert "urn" in data
        assert "id" in data
    
    def test_create_table_missing_required_fields(self, client: TestClient, auth_headers):
        """Test table creation with missing required fields."""
        table_data = {
            "name": "incomplete_table",
            # Missing required fields like domain_id, data_source_id
        }
        
        response = client.post("/api/v1/tables", json=table_data, headers=auth_headers)
        assert response.status_code == 422
    
    def test_create_table_duplicate_name(self, client: TestClient, auth_headers, db_session: Session,
                                        sample_domain, sample_data_source):
        """Test creating table with duplicate name in same schema."""
        table_data = {
            "name": "duplicate_table",
            "description": "First table",
            "schema_name": "public",
            "table_type": "table",
            "domain_id": sample_domain.id,
            "data_source_id": sample_data_source.id
        }
        
        # First creation should succeed
        response = client.post("/api/v1/tables", json=table_data, headers=auth_headers)
        assert response.status_code == 201
        
        # Second creation with same name should fail
        table_data["description"] = "Second table"
        response = client.post("/api/v1/tables", json=table_data, headers=auth_headers)
        assert response.status_code == 409
    
    def test_list_tables_success(self, client: TestClient, auth_headers, db_session: Session,
                                sample_domain, sample_data_source):
        """Test listing tables."""
        # Create some test tables
        for i in range(3):
            table = Table(
                name=f"table_{i}",
                description=f"Test table {i}",
                schema_name="public",
                table_type="table",
                domain_id=sample_domain.id,
                data_source_id=sample_data_source.id
            )
            db_session.add(table)
        db_session.commit()
        
        response = client.get("/api/v1/tables", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["total"] == 3
        assert "page" in data
        assert "per_page" in data
    
    def test_list_tables_pagination(self, client: TestClient, auth_headers, db_session: Session,
                                   sample_domain, sample_data_source):
        """Test table listing with pagination."""
        # Create 5 test tables
        for i in range(5):
            table = Table(
                name=f"paginated_table_{i}",
                description=f"Paginated test table {i}",
                schema_name="public",
                table_type="table",
                domain_id=sample_domain.id,
                data_source_id=sample_data_source.id
            )
            db_session.add(table)
        db_session.commit()
        
        # Test first page
        response = client.get("/api/v1/tables?page=1&per_page=2", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["per_page"] == 2
        
        # Test second page
        response = client.get("/api/v1/tables?page=2&per_page=2", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["page"] == 2
    
    def test_get_table_by_id_success(self, client: TestClient, auth_headers, db_session: Session,
                                    sample_domain, sample_data_source):
        """Test getting a table by ID."""
        table = Table(
            name="get_table_test",
            description="Table for get test",
            schema_name="public",
            table_type="table",
            domain_id=sample_domain.id,
            data_source_id=sample_data_source.id
        )
        db_session.add(table)
        db_session.commit()
        
        response = client.get(f"/api/v1/tables/{table.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == table.id
        assert data["name"] == table.name
        assert data["description"] == table.description
    
    def test_get_table_by_id_not_found(self, client: TestClient, auth_headers):
        """Test getting a non-existent table."""
        response = client.get("/api/v1/tables/99999", headers=auth_headers)
        assert response.status_code == 404
    
    def test_update_table_success(self, client: TestClient, auth_headers, db_session: Session,
                                 sample_domain, sample_data_source):
        """Test updating a table."""
        table = Table(
            name="update_table_test",
            description="Original description",
            schema_name="public",
            table_type="table",
            domain_id=sample_domain.id,
            data_source_id=sample_data_source.id
        )
        db_session.add(table)
        db_session.commit()
        
        update_data = {
            "description": "Updated description",
            "row_count": 2000
        }
        
        response = client.put(f"/api/v1/tables/{table.id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Updated description"
        assert data["row_count"] == 2000
        assert data["name"] == table.name  # Should remain unchanged
    
    def test_delete_table_success(self, client: TestClient, auth_headers, db_session: Session,
                                 sample_domain, sample_data_source):
        """Test deleting a table."""
        table = Table(
            name="delete_table_test",
            description="Table to be deleted",
            schema_name="public",
            table_type="table",
            domain_id=sample_domain.id,
            data_source_id=sample_data_source.id
        )
        db_session.add(table)
        db_session.commit()
        table_id = table.id
        
        response = client.delete(f"/api/v1/tables/{table_id}", headers=auth_headers)
        
        assert response.status_code == 204
        
        # Verify table is deleted
        response = client.get(f"/api/v1/tables/{table_id}", headers=auth_headers)
        assert response.status_code == 404
    
    def test_search_tables_success(self, client: TestClient, auth_headers, db_session: Session,
                                  sample_domain, sample_data_source):
        """Test searching tables."""
        # Create test tables with different names
        tables = [
            Table(name="user_profiles", description="User profile data", schema_name="public", 
                  table_type="table", domain_id=sample_domain.id, data_source_id=sample_data_source.id),
            Table(name="user_sessions", description="User session tracking", schema_name="public", 
                  table_type="table", domain_id=sample_domain.id, data_source_id=sample_data_source.id),
            Table(name="product_catalog", description="Product information", schema_name="public", 
                  table_type="table", domain_id=sample_domain.id, data_source_id=sample_data_source.id)
        ]
        
        for table in tables:
            db_session.add(table)
        db_session.commit()
        
        # Search for "user" - should return 2 tables
        response = client.get("/api/v1/tables/search?q=user", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert all("user" in item["name"].lower() for item in data["items"])
    
    def test_list_tables_unauthenticated(self, client: TestClient):
        """Test listing tables without authentication."""
        response = client.get("/api/v1/tables")
        assert response.status_code == 401