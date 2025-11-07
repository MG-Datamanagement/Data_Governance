import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.orm import Session

from app.models.user import User, UserRoleEnum
from app.models.table import Table, Domain, DataSource, DataSourceTypeEnum
from app.core.security import hash_password


class TestDatabaseIntegration:
    """Test database integration scenarios."""
    
    def test_user_table_ownership_relationship(self, db_session: Session):
        """Test user and table ownership relationship."""
        # Create user
        user = User(
            email="owner@example.com",
            name="Table Owner",
            hashed_password=hash_password("password"),
            role=UserRoleEnum.DATA_STEWARD
        )
        db_session.add(user)
        db_session.commit()
        
        # Create domain
        domain = Domain(
            name="Integration Test Domain",
            description="Domain for integration test",
            steward_id=user.id
        )
        db_session.add(domain)
        db_session.commit()
        
        # Create data source
        data_source = DataSource(
            name="Integration Test DB",
            description="Database for integration test",
            type=DataSourceTypeEnum.POSTGRESQL,
            connection_config={"host": "localhost"}
        )
        db_session.add(data_source)
        db_session.commit()
        
        # Create table
        table = Table(
            name="integration_test_table",
            description="Table for integration test",
            schema_name="public",
            table_type="table",
            domain_id=domain.id,
            data_source_id=data_source.id,
            owner_id=user.id
        )
        db_session.add(table)
        db_session.commit()
        
        # Test relationships
        assert table.owner.email == "owner@example.com"
        assert table.domain.steward.name == "Table Owner"
        assert table.data_source.type == DataSourceTypeEnum.POSTGRESQL
        assert len(user.owned_tables) == 1
        assert user.owned_tables[0].name == "integration_test_table"
    
    def test_domain_steward_relationship(self, db_session: Session):
        """Test domain and steward relationship."""
        # Create steward
        steward = User(
            email="steward@example.com",
            name="Domain Steward",
            hashed_password=hash_password("password"),
            role=UserRoleEnum.DATA_STEWARD
        )
        db_session.add(steward)
        db_session.commit()
        
        # Create multiple domains
        domains = [
            Domain(name="Domain 1", description="First domain", steward_id=steward.id),
            Domain(name="Domain 2", description="Second domain", steward_id=steward.id)
        ]
        
        for domain in domains:
            db_session.add(domain)
        db_session.commit()
        
        # Test relationships
        assert len(steward.owned_domains) == 2
        assert steward.owned_domains[0].steward.name == "Domain Steward"
        assert steward.owned_domains[1].steward.name == "Domain Steward"
    
    def test_cascade_delete_behavior(self, db_session: Session):
        """Test cascade delete behavior."""
        # Create user
        user = User(
            email="cascade@example.com",
            name="Cascade User",
            hashed_password=hash_password("password"),
            role=UserRoleEnum.DATA_STEWARD
        )
        db_session.add(user)
        db_session.commit()
        
        # Create domain
        domain = Domain(
            name="Cascade Domain",
            description="Domain for cascade test",
            steward_id=user.id
        )
        db_session.add(domain)
        db_session.commit()
        
        # Create data source
        data_source = DataSource(
            name="Cascade DB",
            description="Database for cascade test",
            type=DataSourceTypeEnum.POSTGRESQL,
            connection_config={"host": "localhost"}
        )
        db_session.add(data_source)
        db_session.commit()
        
        # Create table
        table = Table(
            name="cascade_table",
            description="Table for cascade test",
            schema_name="public",
            table_type="table",
            domain_id=domain.id,
            data_source_id=data_source.id,
            owner_id=user.id
        )
        db_session.add(table)
        db_session.commit()
        
        table_id = table.id
        
        # Delete domain should set table.domain_id to None or cascade
        db_session.delete(domain)
        db_session.commit()
        
        # Check table still exists but domain relationship is handled
        remaining_table = db_session.query(Table).filter(Table.id == table_id).first()
        assert remaining_table is not None
        # The actual behavior depends on foreign key constraints
    
    def test_transaction_rollback(self, db_session: Session):
        """Test transaction rollback behavior."""
        # Create user
        user = User(
            email="rollback@example.com",
            name="Rollback User",
            hashed_password=hash_password("password"),
            role=UserRoleEnum.VIEWER
        )
        db_session.add(user)
        
        # Start transaction
        db_session.begin()
        
        try:
            # Create domain
            domain = Domain(
                name="Rollback Domain",
                description="Domain for rollback test",
                steward_id=user.id
            )
            db_session.add(domain)
            
            # Simulate error condition
            raise Exception("Simulated error")
            
        except Exception:
            # Rollback transaction
            db_session.rollback()
        
        # Verify nothing was committed
        user_count = db_session.query(User).filter(User.email == "rollback@example.com").count()
        domain_count = db_session.query(Domain).filter(Domain.name == "Rollback Domain").count()
        
        assert user_count == 0
        assert domain_count == 0


class TestAPIIntegration:
    """Test API integration scenarios."""
    
    @pytest.mark.asyncio
    async def test_full_user_workflow(self, client, db_session: Session):
        """Test complete user workflow from registration to table management."""
        # Step 1: Register user
        user_data = {
            "email": "workflow@example.com",
            "name": "Workflow User",
            "password": "password123",
            "role": "data_steward"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        
        # Step 2: Login
        login_data = {
            "username": "workflow@example.com",
            "password": "password123"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 200
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 3: Create domain
        domain_data = {
            "name": "Workflow Domain",
            "description": "Domain for workflow test"
        }
        
        response = client.post("/api/v1/domains", json=domain_data, headers=headers)
        assert response.status_code == 201
        domain_id = response.json()["id"]
        
        # Step 4: Create data source
        ds_data = {
            "name": "Workflow Database",
            "description": "Database for workflow test",
            "type": "postgresql",
            "connection_config": {"host": "localhost", "port": 5432}
        }
        
        response = client.post("/api/v1/data-sources", json=ds_data, headers=headers)
        assert response.status_code == 201
        ds_id = response.json()["id"]
        
        # Step 5: Create table
        table_data = {
            "name": "workflow_table",
            "description": "Table for workflow test",
            "schema_name": "public",
            "table_type": "table",
            "domain_id": domain_id,
            "data_source_id": ds_id
        }
        
        response = client.post("/api/v1/tables", json=table_data, headers=headers)
        assert response.status_code == 201
        table_id = response.json()["id"]
        
        # Step 6: Retrieve table
        response = client.get(f"/api/v1/tables/{table_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["name"] == "workflow_table"
        
        # Step 7: Update table
        update_data = {
            "description": "Updated table description",
            "row_count": 5000
        }
        
        response = client.put(f"/api/v1/tables/{table_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        assert response.json()["description"] == "Updated table description"
        
        # Step 8: Search tables
        response = client.get("/api/v1/tables/search?q=workflow", headers=headers)
        assert response.status_code == 200
        assert len(response.json()["items"]) == 1
        
        # Step 9: Delete table
        response = client.delete(f"/api/v1/tables/{table_id}", headers=headers)
        assert response.status_code == 204
        
        # Step 10: Verify deletion
        response = client.get(f"/api/v1/tables/{table_id}", headers=headers)
        assert response.status_code == 404
    
    def test_authentication_flow(self, client, db_session: Session):
        """Test authentication flow."""
        # Register user
        user_data = {
            "email": "auth@example.com",
            "name": "Auth User",
            "password": "password123",
            "role": "viewer"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        
        # Login with correct credentials
        login_data = {
            "username": "auth@example.com",
            "password": "password123"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        assert response.status_code == 200
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Access protected endpoint
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200
        assert response.json()["email"] == "auth@example.com"
        
        # Try to access without token
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
        
        # Try with invalid token
        bad_headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/me", headers=bad_headers)
        assert response.status_code == 401
    
    def test_role_based_access(self, client, db_session: Session):
        """Test role-based access control."""
        # Create admin user
        admin_data = {
            "email": "admin@example.com",
            "name": "Admin User",
            "password": "password123",
            "role": "admin"
        }
        
        response = client.post("/api/v1/auth/register", json=admin_data)
        assert response.status_code == 201
        
        # Create viewer user
        viewer_data = {
            "email": "viewer@example.com",
            "name": "Viewer User",
            "password": "password123",
            "role": "viewer"
        }
        
        response = client.post("/api/v1/auth/register", json=viewer_data)
        assert response.status_code == 201
        
        # Login as admin
        admin_login = {
            "username": "admin@example.com",
            "password": "password123"
        }
        
        response = client.post("/api/v1/auth/login", data=admin_login)
        admin_token = response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Login as viewer
        viewer_login = {
            "username": "viewer@example.com",
            "password": "password123"
        }
        
        response = client.post("/api/v1/auth/login", data=viewer_login)
        viewer_token = response.json()["access_token"]
        viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
        
        # Admin should be able to access user management
        response = client.get("/api/v1/users", headers=admin_headers)
        assert response.status_code == 200
        
        # Viewer should not be able to access user management
        response = client.get("/api/v1/users", headers=viewer_headers)
        assert response.status_code == 403 or response.status_code == 401
    
    def test_error_handling(self, client, db_session: Session):
        """Test API error handling."""
        # Test 404 error
        response = client.get("/api/v1/tables/99999")
        assert response.status_code == 404
        
        # Test 422 validation error
        invalid_data = {
            "email": "invalid-email",
            "name": "",
            "password": "short",
            "role": "invalid_role"
        }
        
        response = client.post("/api/v1/auth/register", json=invalid_data)
        assert response.status_code == 422
        
        # Test 401 unauthorized
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
    
    def test_pagination_integration(self, client, auth_headers, db_session: Session):
        """Test pagination across API endpoints."""
        # Create sample data
        user = User(
            email="pagination@example.com",
            name="Pagination User",
            hashed_password=hash_password("password"),
            role=UserRoleEnum.DATA_STEWARD
        )
        db_session.add(user)
        db_session.commit()
        
        domain = Domain(
            name="Pagination Domain",
            description="Domain for pagination test",
            steward_id=user.id
        )
        db_session.add(domain)
        db_session.commit()
        
        data_source = DataSource(
            name="Pagination DB",
            description="Database for pagination test",
            type=DataSourceTypeEnum.POSTGRESQL,
            connection_config={"host": "localhost"}
        )
        db_session.add(data_source)
        db_session.commit()
        
        # Create multiple tables
        for i in range(15):
            table = Table(
                name=f"pagination_table_{i}",
                description=f"Table {i} for pagination test",
                schema_name="public",
                table_type="table",
                domain_id=domain.id,
                data_source_id=data_source.id,
                owner_id=user.id
            )
            db_session.add(table)
        db_session.commit()
        
        # Test first page
        response = client.get("/api/v1/tables?page=1&per_page=5", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
        assert data["page"] == 1
        assert data["per_page"] == 5
        assert data["total"] >= 15
        
        # Test second page
        response = client.get("/api/v1/tables?page=2&per_page=5", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
        assert data["page"] == 2
        
        # Test page beyond available data
        response = client.get("/api/v1/tables?page=100&per_page=5", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0