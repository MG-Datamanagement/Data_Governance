import asyncio
import os
import logging
from typing import Dict, Any, Optional
import asyncpg
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from contextlib import asynccontextmanager

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DataHub Sync Service", version="1.0.0")

# Config
DATAHUB_URL = os.getenv("DATAHUB_URL", "http://host.docker.internal:8085/graphql")
PG_HOST = os.getenv("PG_HOST", "postgres")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB = os.getenv("PG_DB", "semantic_search")
PG_USER = os.getenv("PG_USER", "semantic_user")
PG_PASS = os.getenv("PG_PASS", "semantic_pass")
SYNC_BATCH_SIZE = int(os.getenv("SYNC_BATCH_SIZE", "100"))

# GraphQL Query
CATALOG_QUERY = gql("""
query DataCatalog {
  search(input: {
    type: DATASET
    query: "*"
    start: 0
    count: 100
  }) {
    total
    searchResults {
      entity {
        ... on Dataset {
          name
          urn
          properties {
            name
            description
            lastModified {
              time
            }
            created
            createdActor
          }
          platform {
            name
          }
          schemaMetadata {
            fields {
              fieldPath
              nativeDataType
              description
              type {
                typeText
                nullable
              }
            }
          }
          tags {
            tags {
              tag {
                urn
                properties {
                  name
                  description
                  colorHex
                }
              }
            }
          }
          domain {
            domain {
              urn
              properties {
                name
                description
              }
            }
          }
        }
      }
    }
  }
}
""")

class SyncStats(BaseModel):
    total: int = 0
    processed: int = 0
    datasets: int = 0
    columns: int = 0
    domains: int = 0
    tags: int = 0
    tag_links: int = 0

# Globals
pg_pool: Optional[asyncpg.Pool] = None
gql_client: Optional[Client] = None

def safe_str(value: Any) -> str:
    """Safe string conversion"""
    if value is None:
        return ""
    return str(value)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pg_pool, gql_client
    
    # Startup
    logger.info(f"🚀 Starting sync: {DATAHUB_URL} → {PG_HOST}:{PG_DB}")
    
    pg_pool = await asyncpg.create_pool(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DB,
        user=PG_USER,
        password=PG_PASS,
        min_size=1,
        max_size=10
    )
    
    transport = AIOHTTPTransport(url=DATAHUB_URL)
    gql_client = Client(transport=transport, fetch_schema_from_transport=True)
    
    yield
    
    # Shutdown
    if pg_pool:
        await pg_pool.close()
    logger.info("🔌 Shutdown complete")

app.router.lifespan_context = lifespan

async def execute_catalog_sync() -> Dict[str, int]:
    """Main sync function"""
    stats = {
        'total': 0, 'processed': 0, 'datasets': 0,
        'columns': 0, 'domains': 0, 'tags': 0, 'tag_links': 0
    }
    
    if not pg_pool or pg_pool._closed:
        logger.error("❌ Database pool unavailable")
        return stats
    
    if not gql_client:
        logger.error("❌ GraphQL client unavailable")
        return stats
    
    async with pg_pool.acquire() as conn:
        try:
            # Execute query
            result = await gql_client.execute_async(CATALOG_QUERY)
            data = result.get('search', {})
            stats['total'] = int(data.get('total', 0))
            
            logger.info(f"📊 Processing {stats['total']} datasets")
            
            # Process each dataset
            search_results = data.get('searchResults', [])
            for entity_result in search_results:
                entity = entity_result.get('entity')
                if not entity:
                    continue
                
                stats['processed'] += 1
                urn = safe_str(entity.get('urn'))
                name = safe_str(entity.get('name'))
                
                if not urn or not name:
                    logger.warning(f"Skipping invalid dataset: {urn}")
                    continue
                
                # Dataset properties
                properties = entity.get('properties', {})
                prop_name = safe_str(properties.get('name'))
                prop_desc = safe_str(properties.get('description'))
                prop_lmod = safe_str(properties.get('lastModified', {}).get('time') if properties.get('lastModified') else None)
                prop_created = safe_str(properties.get('created'))
                prop_actor = safe_str(properties.get('createdActor'))
                platform_name = safe_str(entity.get('platform', {}).get('name', 'unknown'))
                
                # Insert/Update Dataset
                await conn.execute("""
                    INSERT INTO dh_datasets (
                        urn, name, properties_name, properties_description,
                        properties_last_modified_time, properties_created,
                        properties_created_actor, platform_name, search_total
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (urn) DO UPDATE SET
                        name = EXCLUDED.name,
                        properties_name = EXCLUDED.properties_name,
                        properties_description = EXCLUDED.properties_description,
                        properties_last_modified_time = EXCLUDED.properties_last_modified_time,
                        properties_created = EXCLUDED.properties_created,
                        properties_created_actor = EXCLUDED.properties_created_actor,
                        platform_name = EXCLUDED.platform_name,
                        search_total = EXCLUDED.search_total
                """, urn, name, prop_name, prop_desc, prop_lmod, 
                     prop_created, prop_actor, platform_name, stats['total'])
                
                stats['datasets'] += 1
                
                # Domain
                domain_data = entity.get('domain', {})
                domain_obj = domain_data.get('domain')
                if domain_obj:
                    domain_urn = safe_str(domain_obj.get('urn'))
                    if domain_urn:
                        domain_props = domain_obj.get('properties', {})
                        await conn.execute("""
                            INSERT INTO dh_domains (urn, name, description)
                            VALUES ($1, $2, $3)
                            ON CONFLICT (urn) DO UPDATE SET
                                name = EXCLUDED.name,
                                description = EXCLUDED.description
                        """, domain_urn, safe_str(domain_props.get('name')), 
                              safe_str(domain_props.get('description')))
                        stats['domains'] += 1
                
                # Schema/Columns
                schema_meta = entity.get('schemaMetadata', {})
                fields = schema_meta.get('fields', [])
                if fields:
                    # Clear existing columns
                    await conn.execute("DELETE FROM dh_dataset_columns WHERE dataset_urn = $1", urn)
                    
                    for field in fields:
                        field_path = safe_str(field.get('fieldPath'))
                        native_type = safe_str(field.get('nativeDataType'))
                        field_type = field.get('type', {})
                        type_text = safe_str(field_type.get('typeText'))
                        nullable = bool(field_type.get('nullable', True))
                        description = safe_str(field.get('description'))
                        
                        await conn.execute("""
                            INSERT INTO dh_dataset_columns (
                                dataset_urn, field_path, native_data_type,
                                type_text, nullable, description
                            ) VALUES ($1, $2, $3, $4, $5, $6)
                        """, urn, field_path, native_type, type_text, nullable, description)
                        stats['columns'] += 1
                
                # Tags
                tags_data = entity.get('tags', {})
                tags_array = tags_data.get('tags', [])
                for tag_group in tags_array:
                    tag = tag_group.get('tag')
                    if tag:
                        tag_urn = safe_str(tag.get('urn'))
                        if tag_urn:
                            tag_props = tag.get('properties', {})
                            await conn.execute("""
                                INSERT INTO dh_tags (urn, name, description, color_hex)
                                VALUES ($1, $2, $3, $4)
                                ON CONFLICT (urn) DO UPDATE SET
                                    name = EXCLUDED.name,
                                    description = EXCLUDED.description,
                                    color_hex = EXCLUDED.color_hex
                            """, tag_urn, safe_str(tag_props.get('name')), 
                                  safe_str(tag_props.get('description')), 
                                  safe_str(tag_props.get('colorHex')))
                            
                            stats['tags'] += 1
                            await conn.execute("""
                                INSERT INTO dh_dataset_tags (dataset_urn, tag_urn)
                                VALUES ($1, $2) ON CONFLICT DO NOTHING
                            """, urn, tag_urn)
                            stats['tag_links'] += 1
            
            logger.info(f"✅ Sync complete: {stats}")
            
        except Exception as e:
            logger.error(f"❌ Sync failed: {str(e)}", exc_info=True)
    
    return stats

@app.get("/")
async def root():
    return {
        "service": "DataHub Catalog Sync",
        "datahub": DATAHUB_URL,
        "postgres": f"{PG_HOST}:{PG_PORT}/{PG_DB}",
        "endpoints": ["/health", "/stats", "/sync"]
    }

@app.get("/health")
async def health():
    """Health check"""
    if not pg_pool or pg_pool._closed:
        raise HTTPException(status_code=503, detail="DB unavailable")
    if not gql_client:
        raise HTTPException(status_code=503, detail="GraphQL unavailable")
    return {"status": "healthy", "datahub": DATAHUB_URL}

@app.get("/stats", response_model=SyncStats)
async def get_stats():
    """Get sync statistics"""
    async with pg_pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT 
                COALESCE(MAX(search_total), 0) as total,
                COUNT(*) as datasets,
                (SELECT COUNT(*) FROM dh_domains) as domains,
                (SELECT COUNT(*) FROM dh_tags) as tags,
                (SELECT COUNT(*) FROM dh_dataset_tags) as tag_links,
                (SELECT COUNT(*) FROM dh_dataset_columns) as columns
            FROM dh_datasets
        """)
        
        if row:
            return SyncStats(
                total=int(row['total']),
                datasets=int(row['datasets']),
                domains=int(row['domains']),
                tags=int(row['tags']),
                tag_links=int(row['tag_links']),
                columns=int(row['columns'])
            )
    return SyncStats()

@app.post("/sync", response_model=SyncStats)
async def trigger_sync(background_tasks: BackgroundTasks):
    """Trigger catalog sync"""
    background_tasks.add_task(execute_catalog_sync)
    return SyncStats(total=0, processed=0)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
