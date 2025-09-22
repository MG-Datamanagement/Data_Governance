"""
Resource URN (Uniform Resource Name) utilities for Infinity Governance Platform.

This module provides URN generation and parsing functionality following DataHub-inspired
conventions for data governance resources.

URN Format: urn:infinity:{resource-type}:({platform},{hierarchy},{environment})

Examples:
- Table: urn:infinity:dataset:(mysql,ecommerce.public.users,PROD)
- Column: urn:infinity:field:(mysql,ecommerce.public.users.email,PROD)
- Domain: urn:infinity:domain:(customer_data,PROD)
- Data Source: urn:infinity:platform:(mysql-prod-db,PROD)
"""

import re
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from enum import Enum


class ResourceType(str, Enum):
    """Resource types for URN generation."""
    DATASET = "dataset"        # Tables, views, materialized views
    FIELD = "field"           # Table columns
    DOMAIN = "domain"         # Business domains
    PLATFORM = "platform"    # Data sources/platforms
    TAG = "tag"              # Tags and labels
    USER = "user"            # Users
    LINEAGE = "lineage"      # Lineage edges


class Environment(str, Enum):
    """Environment types for URN generation."""
    PROD = "PROD"
    STAGING = "STAGING"
    DEV = "DEV"
    TEST = "TEST"


@dataclass
class ParsedURN:
    """Parsed URN components."""
    namespace: str              # "infinity"
    resource_type: ResourceType
    platform: str              # mysql, bigquery, snowflake, etc.
    hierarchy: str             # database.schema.table or domain_name
    environment: Environment
    raw_urn: str
    
    def __str__(self) -> str:
        return self.raw_urn


class URNGenerator:
    """URN generator for Infinity Governance Platform resources."""
    
    NAMESPACE = "infinity"
    URN_PATTERN = re.compile(
        r'^urn:([^:]+):([^:]+):\(([^,]+),([^,]+),([^)]+)\)$'
    )
    
    @classmethod
    def generate_dataset_urn(
        self,
        platform: str,
        database: Optional[str],
        schema: Optional[str],
        table: str,
        environment: Environment = Environment.PROD
    ) -> str:
        """
        Generate URN for a dataset (table/view).
        
        Args:
            platform: Data platform name (mysql, bigquery, etc.)
            database: Database name (optional for some platforms)
            schema: Schema name (optional)
            table: Table name
            environment: Environment (PROD, STAGING, DEV, TEST)
            
        Returns:
            URN string
        """
        hierarchy_parts = []
        
        if database:
            hierarchy_parts.append(database)
        if schema:
            hierarchy_parts.append(schema)
        hierarchy_parts.append(table)
        
        hierarchy = ".".join(hierarchy_parts)
        
        return f"urn:{self.NAMESPACE}:{ResourceType.DATASET}:({platform},{hierarchy},{environment.value})"
    
    @classmethod
    def generate_field_urn(
        self,
        platform: str,
        database: Optional[str],
        schema: Optional[str],
        table: str,
        column: str,
        environment: Environment = Environment.PROD
    ) -> str:
        """
        Generate URN for a field (column).
        
        Args:
            platform: Data platform name
            database: Database name (optional)
            schema: Schema name (optional)
            table: Table name
            column: Column name
            environment: Environment
            
        Returns:
            URN string
        """
        hierarchy_parts = []
        
        if database:
            hierarchy_parts.append(database)
        if schema:
            hierarchy_parts.append(schema)
        hierarchy_parts.extend([table, column])
        
        hierarchy = ".".join(hierarchy_parts)
        
        return f"urn:{self.NAMESPACE}:{ResourceType.FIELD}:({platform},{hierarchy},{environment.value})"
    
    @classmethod
    def generate_domain_urn(
        self,
        domain_name: str,
        environment: Environment = Environment.PROD
    ) -> str:
        """
        Generate URN for a business domain.
        
        Args:
            domain_name: Domain name (normalized)
            environment: Environment
            
        Returns:
            URN string
        """
        # Normalize domain name (lowercase, replace spaces with underscores)
        normalized_name = domain_name.lower().replace(" ", "_").replace("-", "_")
        
        return f"urn:{self.NAMESPACE}:{ResourceType.DOMAIN}:(domain,{normalized_name},{environment.value})"
    
    @classmethod
    def generate_platform_urn(
        self,
        platform_name: str,
        environment: Environment = Environment.PROD
    ) -> str:
        """
        Generate URN for a data platform/source.
        
        Args:
            platform_name: Platform identifier
            environment: Environment
            
        Returns:
            URN string
        """
        # Normalize platform name
        normalized_name = platform_name.lower().replace(" ", "_").replace("-", "_")
        
        return f"urn:{self.NAMESPACE}:{ResourceType.PLATFORM}:(platform,{normalized_name},{environment.value})"
    
    @classmethod
    def generate_tag_urn(
        self,
        tag_name: str,
        environment: Environment = Environment.PROD
    ) -> str:
        """
        Generate URN for a tag.
        
        Args:
            tag_name: Tag name
            environment: Environment
            
        Returns:
            URN string
        """
        normalized_name = tag_name.lower().replace(" ", "_").replace("-", "_")
        
        return f"urn:{self.NAMESPACE}:{ResourceType.TAG}:(tag,{normalized_name},{environment.value})"
    
    @classmethod
    def generate_user_urn(
        self,
        user_identifier: str,
        environment: Environment = Environment.PROD
    ) -> str:
        """
        Generate URN for a user.
        
        Args:
            user_identifier: User email or username
            environment: Environment
            
        Returns:
            URN string
        """
        return f"urn:{self.NAMESPACE}:{ResourceType.USER}:(user,{user_identifier},{environment.value})"
    
    @classmethod
    def parse_urn(self, urn: str) -> Optional[ParsedURN]:
        """
        Parse a URN string into components.
        
        Args:
            urn: URN string to parse
            
        Returns:
            ParsedURN object or None if invalid
        """
        if not urn or not isinstance(urn, str):
            return None
            
        match = self.URN_PATTERN.match(urn.strip())
        if not match:
            return None
            
        try:
            namespace, resource_type, platform, hierarchy, environment = match.groups()
            
            if namespace != self.NAMESPACE:
                return None
                
            return ParsedURN(
                namespace=namespace,
                resource_type=ResourceType(resource_type),
                platform=platform,
                hierarchy=hierarchy,
                environment=Environment(environment),
                raw_urn=urn
            )
        except (ValueError, KeyError):
            return None
    
    @classmethod
    def validate_urn(self, urn: str) -> bool:
        """
        Validate URN format.
        
        Args:
            urn: URN string to validate
            
        Returns:
            True if valid, False otherwise
        """
        return self.parse_urn(urn) is not None
    
    @classmethod
    def extract_table_info(self, dataset_urn: str) -> Optional[Dict[str, Optional[str]]]:
        """
        Extract table information from dataset URN.
        
        Args:
            dataset_urn: Dataset URN string
            
        Returns:
            Dict with database, schema, table info or None
        """
        parsed = self.parse_urn(dataset_urn)
        if not parsed or parsed.resource_type != ResourceType.DATASET:
            return None
            
        hierarchy_parts = parsed.hierarchy.split(".")
        
        if len(hierarchy_parts) == 1:
            return {"database": None, "schema": None, "table": hierarchy_parts[0]}
        elif len(hierarchy_parts) == 2:
            return {"database": hierarchy_parts[0], "schema": None, "table": hierarchy_parts[1]}
        elif len(hierarchy_parts) == 3:
            return {"database": hierarchy_parts[0], "schema": hierarchy_parts[1], "table": hierarchy_parts[2]}
        else:
            # Handle cases with more than 3 parts (schema.table.partition, etc.)
            return {
                "database": hierarchy_parts[0],
                "schema": hierarchy_parts[1] if len(hierarchy_parts) > 2 else None,
                "table": ".".join(hierarchy_parts[2:])
            }
    
    @classmethod
    def extract_column_info(self, field_urn: str) -> Optional[Dict[str, Optional[str]]]:
        """
        Extract column information from field URN.
        
        Args:
            field_urn: Field URN string
            
        Returns:
            Dict with database, schema, table, column info or None
        """
        parsed = self.parse_urn(field_urn)
        if not parsed or parsed.resource_type != ResourceType.FIELD:
            return None
            
        hierarchy_parts = parsed.hierarchy.split(".")
        
        if len(hierarchy_parts) < 2:
            return None
            
        if len(hierarchy_parts) == 2:
            return {"database": None, "schema": None, "table": hierarchy_parts[0], "column": hierarchy_parts[1]}
        elif len(hierarchy_parts) == 3:
            return {"database": hierarchy_parts[0], "schema": None, "table": hierarchy_parts[1], "column": hierarchy_parts[2]}
        elif len(hierarchy_parts) == 4:
            return {
                "database": hierarchy_parts[0],
                "schema": hierarchy_parts[1],
                "table": hierarchy_parts[2],
                "column": hierarchy_parts[3]
            }
        else:
            # Handle complex cases
            return {
                "database": hierarchy_parts[0],
                "schema": hierarchy_parts[1] if len(hierarchy_parts) > 3 else None,
                "table": ".".join(hierarchy_parts[2:-1]),
                "column": hierarchy_parts[-1]
            }


class URNBuilder:
    """Fluent builder for URN construction."""
    
    def __init__(self):
        self.reset()
    
    def reset(self):
        """Reset builder state."""
        self._resource_type: Optional[ResourceType] = None
        self._platform: Optional[str] = None
        self._database: Optional[str] = None
        self._schema: Optional[str] = None
        self._table: Optional[str] = None
        self._column: Optional[str] = None
        self._name: Optional[str] = None
        self._environment: Environment = Environment.PROD
        return self
    
    def dataset(self, platform: str) -> 'URNBuilder':
        """Set resource type to dataset."""
        self._resource_type = ResourceType.DATASET
        self._platform = platform
        return self
    
    def field(self, platform: str) -> 'URNBuilder':
        """Set resource type to field."""
        self._resource_type = ResourceType.FIELD
        self._platform = platform
        return self
    
    def domain(self) -> 'URNBuilder':
        """Set resource type to domain."""
        self._resource_type = ResourceType.DOMAIN
        return self
    
    def platform(self) -> 'URNBuilder':
        """Set resource type to platform."""
        self._resource_type = ResourceType.PLATFORM
        return self
    
    def database(self, database: str) -> 'URNBuilder':
        """Set database name."""
        self._database = database
        return self
    
    def schema(self, schema: str) -> 'URNBuilder':
        """Set schema name."""
        self._schema = schema
        return self
    
    def table(self, table: str) -> 'URNBuilder':
        """Set table name."""
        self._table = table
        return self
    
    def column(self, column: str) -> 'URNBuilder':
        """Set column name."""
        self._column = column
        return self
    
    def name(self, name: str) -> 'URNBuilder':
        """Set generic name."""
        self._name = name
        return self
    
    def environment(self, env: Environment) -> 'URNBuilder':
        """Set environment."""
        self._environment = env
        return self
    
    def build(self) -> str:
        """Build the URN string."""
        if self._resource_type == ResourceType.DATASET:
            if not self._platform or not self._table:
                raise ValueError("Platform and table are required for dataset URN")
            return URNGenerator.generate_dataset_urn(
                self._platform, self._database, self._schema, self._table, self._environment
            )
        
        elif self._resource_type == ResourceType.FIELD:
            if not self._platform or not self._table or not self._column:
                raise ValueError("Platform, table, and column are required for field URN")
            return URNGenerator.generate_field_urn(
                self._platform, self._database, self._schema, self._table, self._column, self._environment
            )
        
        elif self._resource_type == ResourceType.DOMAIN:
            if not self._name:
                raise ValueError("Name is required for domain URN")
            return URNGenerator.generate_domain_urn(self._name, self._environment)
        
        elif self._resource_type == ResourceType.PLATFORM:
            if not self._name:
                raise ValueError("Name is required for platform URN")
            return URNGenerator.generate_platform_urn(self._name, self._environment)
        
        else:
            raise ValueError(f"Unsupported resource type: {self._resource_type}")


# Convenience functions
def build_dataset_urn(platform: str, table: str, database: str = None, schema: str = None, 
                     environment: Environment = Environment.PROD) -> str:
    """Convenience function to build dataset URN."""
    return URNGenerator.generate_dataset_urn(platform, database, schema, table, environment)


def build_field_urn(platform: str, table: str, column: str, database: str = None, 
                   schema: str = None, environment: Environment = Environment.PROD) -> str:
    """Convenience function to build field URN."""
    return URNGenerator.generate_field_urn(platform, database, schema, table, column, environment)


def parse_urn(urn: str) -> Optional[ParsedURN]:
    """Convenience function to parse URN."""
    return URNGenerator.parse_urn(urn)