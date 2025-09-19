import pytest
from sqlalchemy.orm import Session

from app.models.user import User, UserRoleEnum
from app.models.table import Table, Domain, DataSource, DataSourceTypeEnum
from app.core.security import hash_password, verify_password


class TestUserModel:
    """Test User model functionality."""
    
    def test_create_user(self, db_session: Session):
        """Test creating a user."""
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=hash_password("password123"),
            role=UserRoleEnum.DATA_ANALYST
        )
        
        db_session.add(user)
        db_session.commit()
        
        # Verify user was created
        retrieved_user = db_session.query(User).filter(User.email == "test@example.com").first()
        assert retrieved_user is not None
        assert retrieved_user.name == "Test User"
        assert retrieved_user.role == UserRoleEnum.DATA_ANALYST
        assert retrieved_user.is_active is True
        assert retrieved_user.is_verified is False
    
    def test_user_password_hashing(self, db_session: Session):
        """Test password hashing and verification."""
        plain_password = "mysecretpassword"
        hashed = hash_password(plain_password)
        
        user = User(
            email="password@example.com",
            name="Password User",
            hashed_password=hashed,
            role=UserRoleEnum.VIEWER
        )
        
        db_session.add(user)
        db_session.commit()
        
        # Verify password can be verified
        assert verify_password(plain_password, user.hashed_password)
        assert not verify_password("wrongpassword", user.hashed_password)
    
    def test_user_roles(self, db_session: Session):
        """Test different user roles."""
        users = [
            User(email="admin@example.com", name="Admin", 
                 hashed_password=hash_password("pass"), role=UserRoleEnum.ADMIN),
            User(email="steward@example.com", name="Steward", 
                 hashed_password=hash_password("pass"), role=UserRoleEnum.DATA_STEWARD),
            User(email="analyst@example.com", name="Analyst", 
                 hashed_password=hash_password("pass"), role=UserRoleEnum.DATA_ANALYST),
            User(email="viewer@example.com", name="Viewer", 
                 hashed_password=hash_password("pass"), role=UserRoleEnum.VIEWER)
        ]
        
        for user in users:
            db_session.add(user)
        db_session.commit()
        
        # Verify all roles were created
        admin = db_session.query(User).filter(User.email == "admin@example.com").first()
        assert admin.role == UserRoleEnum.ADMIN
        
        steward = db_session.query(User).filter(User.email == "steward@example.com").first()
        assert steward.role == UserRoleEnum.DATA_STEWARD
    
    def test_user_unique_email(self, db_session: Session):
        """Test that email must be unique."""
        user1 = User(
            email="unique@example.com",
            name="First User",
            hashed_password=hash_password("password"),
            role=UserRoleEnum.VIEWER
        )
        db_session.add(user1)
        db_session.commit()
        
        # Try to create another user with same email
        user2 = User(
            email="unique@example.com",
            name="Second User",
            hashed_password=hash_password("password"),
            role=UserRoleEnum.VIEWER
        )
        db_session.add(user2)
        
        with pytest.raises(Exception):  # Should raise integrity error
            db_session.commit()


class TestTableModel:
    """Test Table model functionality."""
    
    @pytest.fixture
    def sample_user(self, db_session: Session):
        """Create a sample user."""
        user = User(
            email="owner@example.com",
            name="Table Owner",
            hashed_password=hash_password("password"),
            role=UserRoleEnum.DATA_STEWARD
        )
        db_session.add(user)
        db_session.commit()
        return user
    
    @pytest.fixture
    def sample_domain(self, db_session: Session, sample_user):
        """Create a sample domain."""
        domain = Domain(
            name="Test Domain",
            description="Test domain for models",
            steward_id=sample_user.id
        )
        db_session.add(domain)
        db_session.commit()
        return domain
    
    @pytest.fixture
    def sample_data_source(self, db_session: Session):
        """Create a sample data source."""
        data_source = DataSource(
            name="Test DB",
            description="Test database",
            type=DataSourceTypeEnum.POSTGRESQL,
            connection_config={"host": "localhost"}
        )
        db_session.add(data_source)
        db_session.commit()
        return data_source
    
    def test_create_table(self, db_session: Session, sample_user, sample_domain, sample_data_source):
        """Test creating a table."""
        table = Table(
            name="test_table",
            description="Test table description",
            schema_name="public",
            table_type="table",
            row_count=1000,
            size_mb=50.0,
            domain_id=sample_domain.id,
            data_source_id=sample_data_source.id,
            owner_id=sample_user.id
        )
        
        db_session.add(table)
        db_session.commit()
        
        # Verify table was created
        retrieved_table = db_session.query(Table).filter(Table.name == "test_table").first()
        assert retrieved_table is not None
        assert retrieved_table.description == "Test table description"
        assert retrieved_table.schema_name == "public"
        assert retrieved_table.row_count == 1000
        assert retrieved_table.size_mb == 50.0
        assert retrieved_table.domain_id == sample_domain.id
        assert retrieved_table.data_source_id == sample_data_source.id
        assert retrieved_table.owner_id == sample_user.id
    
    def test_table_relationships(self, db_session: Session, sample_user, sample_domain, sample_data_source):
        """Test table relationships."""
        table = Table(
            name="relationship_test",
            description="Test relationships",
            schema_name="public",
            table_type="table",
            domain_id=sample_domain.id,
            data_source_id=sample_data_source.id,
            owner_id=sample_user.id
        )
        
        db_session.add(table)
        db_session.commit()
        
        # Test relationships
        assert table.domain.name == "Test Domain"
        assert table.data_source.name == "Test DB"
        assert table.owner.name == "Table Owner"
    
    def test_table_urn_generation(self, db_session: Session, sample_user, sample_domain, sample_data_source):
        """Test URN generation for tables."""
        table = Table(
            name="urn_test_table",
            description="Test URN generation",
            schema_name="public",
            table_type="table",
            domain_id=sample_domain.id,
            data_source_id=sample_data_source.id,
            owner_id=sample_user.id
        )
        
        db_session.add(table)
        db_session.commit()
        
        # URN should be generated automatically
        assert table.urn is not None
        assert table.urn.startswith("urn:metaportal:")
        assert "table" in table.urn
        assert str(table.id) in table.urn


class TestDomainModel:
    """Test Domain model functionality."""
    
    def test_create_domain(self, db_session: Session):
        """Test creating a domain."""
        user = User(
            email="steward@example.com",
            name="Domain Steward",
            hashed_password=hash_password("password"),
            role=UserRoleEnum.DATA_STEWARD
        )
        db_session.add(user)
        db_session.commit()
        
        domain = Domain(
            name="Flight Operations",
            description="Flight operations domain",
            steward_id=user.id
        )
        
        db_session.add(domain)
        db_session.commit()
        
        # Verify domain was created
        retrieved_domain = db_session.query(Domain).filter(Domain.name == "Flight Operations").first()
        assert retrieved_domain is not None
        assert retrieved_domain.description == "Flight operations domain"
        assert retrieved_domain.steward_id == user.id
        assert retrieved_domain.steward.name == "Domain Steward"


class TestDataSourceModel:
    """Test DataSource model functionality."""
    
    def test_create_data_source(self, db_session: Session):
        """Test creating a data source."""
        data_source = DataSource(
            name="Production Database",
            description="Main production PostgreSQL database",
            type=DataSourceTypeEnum.POSTGRESQL,
            connection_config={
                "host": "prod-db.example.com",
                "port": 5432,
                "database": "metaportal"
            }
        )
        
        db_session.add(data_source)
        db_session.commit()
        
        # Verify data source was created
        retrieved_ds = db_session.query(DataSource).filter(DataSource.name == "Production Database").first()
        assert retrieved_ds is not None
        assert retrieved_ds.type == DataSourceTypeEnum.POSTGRESQL
        assert retrieved_ds.connection_config["host"] == "prod-db.example.com"
        assert retrieved_ds.connection_config["port"] == 5432
    
    def test_data_source_types(self, db_session: Session):
        """Test different data source types."""
        data_sources = [
            DataSource(name="PostgreSQL", type=DataSourceTypeEnum.POSTGRESQL, 
                      connection_config={"host": "localhost"}),
            DataSource(name="MySQL", type=DataSourceTypeEnum.MYSQL, 
                      connection_config={"host": "localhost"}),
            DataSource(name="BigQuery", type=DataSourceTypeEnum.BIGQUERY, 
                      connection_config={"project": "test-project"}),
            DataSource(name="Snowflake", type=DataSourceTypeEnum.SNOWFLAKE, 
                      connection_config={"account": "test-account"})
        ]
        
        for ds in data_sources:
            db_session.add(ds)
        db_session.commit()
        
        # Verify all types were created
        pg_ds = db_session.query(DataSource).filter(DataSource.name == "PostgreSQL").first()
        assert pg_ds.type == DataSourceTypeEnum.POSTGRESQL
        
        mysql_ds = db_session.query(DataSource).filter(DataSource.name == "MySQL").first()
        assert mysql_ds.type == DataSourceTypeEnum.MYSQL