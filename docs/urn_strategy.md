# Production-Grade ID Strategy: DataHub-Inspired URNs

## Overview

The Infinity Governance Platform implements a **DataHub-inspired URN (Uniform Resource Name) strategy** for production-grade resource identification. This approach provides globally unique, hierarchical, and human-readable identifiers for all data governance resources.

## Why DataHub URN Over AWS ARN?

| Aspect | DataHub URN | AWS ARN |
|--------|-------------|---------|
| **Purpose** | Data governance focused | Cloud resource focused |
| **Readability** | Human-readable, meaningful | Technical, less intuitive |
| **Hierarchy** | Natural data hierarchies | AWS service hierarchies |
| **Platform Support** | Multi-platform data assets | AWS-specific |
| **Industry Standard** | Standard for data catalogs | Cloud infrastructure standard |

## URN Format

```
urn:infinity:{resource-type}:({platform},{hierarchy},{environment})
```

### Components

- **Namespace**: `infinity` - Our platform identifier
- **Resource Type**: Type of resource (dataset, field, domain, platform, etc.)
- **Platform**: Source system identifier
- **Hierarchy**: Hierarchical path to resource
- **Environment**: Environment designation (PROD, STAGING, DEV, TEST)

## Resource Types

### 1. Dataset URNs (Tables/Views)
```
urn:infinity:dataset:(mysql,ecommerce.public.users,PROD)
urn:infinity:dataset:(bigquery,analytics.warehouse.sales_fact,PROD)
urn:infinity:dataset:(snowflake,marketing.campaigns,STAGING)
```

**Components:**
- Platform: `mysql`, `bigquery`, `snowflake`, etc.
- Hierarchy: `[database].[schema].table`
- Environment: `PROD`, `STAGING`, `DEV`, `TEST`

### 2. Field URNs (Columns)
```
urn:infinity:field:(mysql,ecommerce.public.users.email,PROD)
urn:infinity:field:(bigquery,analytics.warehouse.sales_fact.revenue,PROD)
urn:infinity:field:(snowflake,marketing.campaigns.campaign_id,STAGING)
```

**Components:**
- Platform: Source system identifier
- Hierarchy: `[database].[schema].table.column`
- Environment: Environment designation

### 3. Domain URNs (Business Domains)
```
urn:infinity:domain:(domain,customer_data,PROD)
urn:infinity:domain:(domain,financial_reporting,PROD)
urn:infinity:domain:(domain,marketing_analytics,STAGING)
```

### 4. Platform URNs (Data Sources)
```
urn:infinity:platform:(platform,mysql_prod_db,PROD)
urn:infinity:platform:(platform,bigquery_analytics,PROD)
urn:infinity:platform:(platform,snowflake_warehouse,STAGING)
```

## Implementation Examples

### Python Usage

```python
from app.models.resource_urn import URNGenerator, URNBuilder, Environment, parse_urn

# Generate URNs using the generator
table_urn = URNGenerator.generate_dataset_urn(
    platform="mysql",
    database="ecommerce", 
    schema="public",
    table="users",
    environment=Environment.PROD
)
# Result: urn:infinity:dataset:(mysql,ecommerce.public.users,PROD)

column_urn = URNGenerator.generate_field_urn(
    platform="mysql",
    database="ecommerce",
    schema="public", 
    table="users",
    column="email",
    environment=Environment.PROD
)
# Result: urn:infinity:field:(mysql,ecommerce.public.users.email,PROD)

# Using the builder pattern
urn = (URNBuilder()
    .dataset("bigquery")
    .database("analytics")
    .schema("warehouse") 
    .table("sales_fact")
    .environment(Environment.PROD)
    .build())
# Result: urn:infinity:dataset:(bigquery,analytics.warehouse.sales_fact,PROD)

# Parse existing URN
parsed = parse_urn("urn:infinity:dataset:(mysql,ecommerce.public.users,PROD)")
print(f"Platform: {parsed.platform}")     # mysql
print(f"Hierarchy: {parsed.hierarchy}")   # ecommerce.public.users
print(f"Environment: {parsed.environment}") # PROD
```

### Database Model Integration

```python
from sqlalchemy.orm import Session
from app.models.table import Table, Column, DataSource, Domain

# Tables automatically generate URNs
table = Table(
    name="users",
    schema_name="public",
    data_source_id=1  # MySQL data source
)
db.add(table)
db.commit()

# URN is generated automatically
table.generate_urn(db)  
# table.urn = "urn:infinity:dataset:(mysql,ecommerce.public.users,PROD)"

# Columns inherit context from their table
column = Column(
    name="email",
    table_id=table.id,
    data_type="VARCHAR"
)
db.add(column)
db.commit()

column.generate_urn(db)
# column.urn = "urn:infinity:field:(mysql,ecommerce.public.users.email,PROD)"
```

### API Integration

```python
# GET /api/v1/tables/123
{
    "id": 123,
    "urn": "urn:infinity:dataset:(mysql,ecommerce.public.users,PROD)",
    "name": "users",
    "schema_name": "public",
    "data_source": {
        "id": 1,
        "name": "mysql-prod-db",
        "urn": "urn:infinity:platform:(platform,mysql_prod_db,PROD)"
    },
    "columns": [
        {
            "id": 456,
            "urn": "urn:infinity:field:(mysql,ecommerce.public.users.email,PROD)",
            "name": "email",
            "data_type": "VARCHAR"
        }
    ]
}
```

## Utility Functions

### Resource Discovery

```python
from app.utils.urn_utils import find_resource_by_urn, search_resources_by_pattern

# Find resource by URN
resource = find_resource_by_urn(db, "urn:infinity:dataset:(mysql,ecommerce.public.users,PROD)")
# Returns: {"type": "table", "id": 123, "name": "users", ...}

# Search resources by pattern
results = search_resources_by_pattern(db, "ecommerce.public", ["dataset"])
# Returns list of matching tables
```

### Lineage Tracking

```python
from app.utils.urn_utils import get_lineage_by_urn

lineage = get_lineage_by_urn(db, "urn:infinity:dataset:(mysql,ecommerce.public.users,PROD)")
# Returns: {
#     "upstream": ["urn:infinity:dataset:(mysql,raw.user_events,PROD)"],
#     "downstream": ["urn:infinity:dataset:(bigquery,analytics.user_summary,PROD)"]
# }
```

### URN Validation

```python
from app.utils.urn_utils import validate_urn_uniqueness

is_unique = validate_urn_uniqueness(db, new_urn, exclude_id=123, resource_type="table")
# Returns: True if URN is unique across all resources
```

## Migration Strategy

### 1. Database Migration

```bash
# Run the migration to add URN columns
alembic upgrade head
```

### 2. Generate URNs for Existing Data

```python
from app.utils.urn_utils import generate_all_missing_urns

# Generate URNs for all existing resources
counts = generate_all_missing_urns(db)
# Returns: {"data_sources": 5, "domains": 3, "tables": 150, "columns": 800}
```

## Benefits

### 1. Global Uniqueness
- URNs are unique across all environments and platforms
- No ID collisions when merging data from different sources
- Supports distributed system architectures

### 2. Human Readability
- URNs are self-descriptive and meaningful to users
- Easy to understand resource relationships and hierarchies
- Facilitates debugging and troubleshooting

### 3. Hierarchical Structure
- Natural representation of data asset hierarchies
- Easy navigation between related resources
- Supports data lineage and dependency tracking

### 4. Platform Agnostic
- Works across different data platforms and systems
- Consistent identification regardless of underlying technology
- Supports hybrid and multi-cloud architectures

### 5. Environment Awareness
- Clear separation between environments
- Prevents accidental cross-environment operations
- Supports proper SDLC practices

### 6. Industry Standard
- Follows established patterns from data governance tools
- Compatible with data catalog and lineage tools
- Facilitates integration with external systems

## Best Practices

### 1. URN Generation
- Always generate URNs immediately after resource creation
- Ensure URNs are persisted with the resource
- Use the provided utility functions for consistency

### 2. URN Usage
- Use URNs for resource references in APIs
- Include URNs in all resource response payloads
- Use URNs for cross-system resource identification

### 3. Environment Management
- Always specify the correct environment
- Use PROD for production data assets
- Use appropriate environments for development and testing

### 4. Platform Naming
- Use consistent platform naming conventions
- Keep platform names short but descriptive
- Avoid spaces and special characters in platform names

### 5. Hierarchy Design
- Follow consistent hierarchy patterns within platforms
- Use meaningful names at each level
- Consider future scalability when designing hierarchies

## Troubleshooting

### Common Issues

1. **Duplicate URNs**: Use `validate_urn_uniqueness()` before creating resources
2. **Missing URNs**: Run `generate_all_missing_urns()` to backfill
3. **Invalid URN Format**: Use `parse_urn()` to validate URN structure
4. **Environment Mismatch**: Ensure environment consistency across related resources

### Debugging

```python
from app.models.resource_urn import URNGenerator

# Validate URN format
urn = "urn:infinity:dataset:(mysql,ecommerce.public.users,PROD)"
is_valid = URNGenerator.validate_urn(urn)

# Parse URN for inspection
parsed = URNGenerator.parse_urn(urn)
if parsed:
    print(f"Valid URN - Type: {parsed.resource_type}, Platform: {parsed.platform}")
else:
    print("Invalid URN format")
```

This URN strategy provides a robust, scalable, and industry-standard approach to resource identification in the Infinity Governance Platform, enabling efficient data discovery, lineage tracking, and governance operations across multi-platform environments.