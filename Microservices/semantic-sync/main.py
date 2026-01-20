import asyncio
import os
import logging
from typing import Dict, Any, Optional, List
import asyncpg
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
from contextlib import asynccontextmanager
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DataHub to PostgreSQLSync API")

# Config - Match your env
DATAHUB_GRAPHQL_URL = os.getenv("DATAHUB_GRAPHQL_URL", "http://nginx-proxy/graphql")
PG_HOST = os.getenv("PG_HOST", "postgres")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB = os.getenv("PG_DB", "semantic_search")
PG_USER = os.getenv("PG_USER", "semantic_user")
PG_PASS = os.getenv("PG_PASS", "semantic_pass")

# SEPARATE GRAPHQL QUERIES FOR EACH ENTITY
DATASET_QUERY = gql("""
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
            lastModified { time }
            created
            createdActor
          }
          platform { name }
          tags {
            tags {
              tag {
                urn
                properties { name colorHex }
              }
            }
          }
          domain {
            domain {
              urn
              properties { name }
            }
          }
        }
      }
    }
  }
}
""")

DOMAIN_QUERY = gql("""
query listAllDomains {
  listDomains(input: { start: 0, count: 100 }) {
    total
    domains {
      urn
      id
      properties {
        name
        description
        createdOn {
          actor { username }
        }
      }
      ownership {
        owners {
          owner {
            ... on CorpUser { username }
          }
        }
      }
    }
  }
}
""")

TAG_QUERY = gql("""
query ListAllTags {
  searchAcrossEntities(input: {
    types: [TAG]
    query: ""
    start: 0
    count: 100
  }) {
    total
    searchResults {
      entity {
        ... on Tag {
          urn
          name
          properties { description colorHex }
        }
      }
    }
  }
}
""")

GLOSSARY_QUERY = gql("""
query SearchGlossaryTerms {
  searchAcrossEntities(input: {
    types: [GLOSSARY_TERM]
    query: "*"
    start: 0
    count: 100
  }) {
    total
    searchResults {
      entity {
        ... on GlossaryTerm {
          urn
          name
          glossaryTermInfo { definition }
        }
      }
    }
  }
}
""")

USERS_QUERY = gql("""
query ListUsers {
  listUsers(input: { start: 0, count: 100 }) {
    total
    users {
      urn
      type
      username
    }
  }
}
""")

class SyncStats(BaseModel):
    datasets: int = 0
    domains: int = 0
    tags: int = 0
    glossary_terms: int = 0
    owners: int = 0
    total: int = 0
    errors: int = 0

pg_pool = None
gql_client = None

def safe_str(value: Any) -> str:
    return str(value) if value is not None else ""

def safe_ts(value: Any) -> Optional[str]:
    if value is None or value == '0':
        return None
    if isinstance(value, str) and value.lower() in ['null', 'none', '']:
        return None
    try:
        if isinstance(value, str):
            return datetime.fromisoformat(value.replace('Z', '+00:00')).isoformat()
        return value.isoformat() if hasattr(value, 'isoformat') else None
    except:
        return None

def safe_dict_access(obj: Any, *keys) -> Any:
    current = obj
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
        if current is None:
            return None
    return current

async def get_pg_pool():
    return await asyncpg.create_pool(
        host=PG_HOST, port=PG_PORT, database=PG_DB, user=PG_USER, password=PG_PASS,
        min_size=1, max_size=20, command_timeout=60
    )

async def init_schema(conn):  
    """Create tables for ALL entities"""
    schema_sql = """
    -- DATASETS & RELATED
    CREATE TABLE IF NOT EXISTS datahub_datasets (
        urn TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        platform_name TEXT,
        created TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS datahub_dataset_properties (
        dataset_urn TEXT REFERENCES datahub_datasets(urn) ON DELETE CASCADE,
        prop_name TEXT,
        description TEXT,
        created TIMESTAMP,
        last_modified_time TIMESTAMP,
        created_actor TEXT,
        PRIMARY KEY (dataset_urn, prop_name)
    );
    
    -- DOMAINS
    CREATE TABLE IF NOT EXISTS datahub_domains (
        urn TEXT PRIMARY KEY,
        id TEXT,
        name TEXT,
        description TEXT,
        created_actor TEXT
    );
    
    -- TAGS
    CREATE TABLE IF NOT EXISTS datahub_tags (
        urn TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        color_hex TEXT
    );
    
    -- GLOSSARY TERMS
    CREATE TABLE IF NOT EXISTS datahub_glossary (
        urn TEXT PRIMARY KEY,
        name TEXT,
        definition TEXT
    );
    
    -- OWNERS
    CREATE TABLE IF NOT EXISTS datahub_owners (
        urn TEXT PRIMARY KEY,
        type TEXT,
        username TEXT
    );
    """
    try:
        await conn.execute(schema_sql)
        logger.info(" Schema created for ALL DataHub entities")
        return True
    except Exception as e:
        logger.error(f" Schema failed: {e}")
        return False

async def safe_truncate(conn, table: str) -> bool:
    try:
        await conn.execute(f"TRUNCATE TABLE {table} CASCADE")
        logger.info(f"  {table}")
        return True
    except Exception as e:
        logger.warning(f"  {table}: {e}")
        return False

async def safe_insert(conn, sql: str, args: tuple, table: str) -> bool:
    try:
        await conn.execute(sql, *args)
        return True
    except Exception as e:
        logger.warning(f"  INSERT {table}: {e}")
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pg_pool, gql_client
    pg_pool = await get_pg_pool()
    
    async with pg_pool.acquire() as conn:
        await init_schema(conn)
    
    transport = AIOHTTPTransport(url=DATAHUB_GRAPHQL_URL)
    gql_client = Client(transport=transport)
    logger.info(" DataHub Multi-Entity Sync Ready!")
    yield
    await pg_pool.close()

app.router.lifespan_context = lifespan

# SEPARATE SYNC FUNCTIONS FOR EACH ENTITY
async def sync_datasets(conn) -> int:
    """Sync datasets using dataset-specific query"""
    try:
        result = await gql_client.execute_async(DATASET_QUERY)
        data = result['search']
        count = 0
        
        for search_result in data['searchResults']:
            entity = search_result['entity']
            urn = safe_str(entity.get('urn'))
            
            # Insert dataset
            platform_name = safe_str(safe_dict_access(entity, 'platform', 'name'))
            created = safe_ts(safe_dict_access(entity, 'properties', 'created'))
            await safe_insert(conn, """
                INSERT INTO datahub_datasets (urn, name, platform_name, created) 
                VALUES ($1, $2, $3, $4) ON CONFLICT (urn) DO NOTHING
            """, (urn, entity.get('name'), platform_name, created), 'datahub_datasets')
            
            # Insert properties
            props = safe_dict_access(entity, 'properties')
            if props:
                await safe_insert(conn, """
                    INSERT INTO datahub_dataset_properties (dataset_urn, prop_name, description, 
                        created, last_modified_time, created_actor)
                    VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING
                """, (urn, props.get('name'), props.get('description'),
                      safe_ts(props.get('created')), 
                      safe_ts(safe_dict_access(props, 'lastModified', 'time')),
                      props.get('createdActor')), 'datahub_dataset_properties')
            
            count += 1
        logger.info(f" Datasets: {count}")
        return count
    except Exception as e:
        logger.error(f" Dataset sync failed: {e}")
        return 0

async def sync_domains(conn) -> int:
    """Sync domains using domain-specific query"""
    try:
        result = await gql_client.execute_async(DOMAIN_QUERY)
        domains_data = result['listDomains']['domains']
        count = 0
        
        for domain in domains_data:
            urn = domain.get('urn')
            props = safe_dict_access(domain, 'properties')
            created_actor = safe_dict_access(props, 'createdOn', 'actor', 'username')
            
            await safe_insert(conn, """
                INSERT INTO datahub_domains (urn, id, name, description, created_actor)
                VALUES ($1, $2, $3, $4, $5) ON CONFLICT (urn) DO NOTHING
            """, (urn, domain.get('id'), props.get('name'), 
                  props.get('description'), created_actor), 'datahub_domains')
            count += 1
        logger.info(f" Domains: {count}")
        return count
    except Exception as e:
        logger.error(f" Domain sync failed: {e}")
        return 0

async def sync_tags(conn) -> int:
    """Sync tags using tag-specific query"""
    try:
        result = await gql_client.execute_async(TAG_QUERY)
        tags_data = result['searchAcrossEntities']['searchResults']
        count = 0
        
        for search_result in tags_data:
            entity = search_result['entity']
            if entity.get('name'):  # Ensure it's a Tag entity
                urn = entity.get('urn')
                props = safe_dict_access(entity, 'properties')
                
                await safe_insert(conn, """
                    INSERT INTO datahub_tags (urn, name, description, color_hex)
                    VALUES ($1, $2, $3, $4) ON CONFLICT (urn) DO NOTHING
                """, (urn, entity.get('name'), props.get('description'), 
                      props.get('colorHex')), 'datahub_tags')
                count += 1
        logger.info(f" Tags: {count}")
        return count
    except Exception as e:
        logger.error(f" Tag sync failed: {e}")
        return 0

async def sync_glossary(conn) -> int:
    """Sync glossary terms using glossary-specific query"""
    try:
        result = await gql_client.execute_async(GLOSSARY_QUERY)
        glossary_data = result['searchAcrossEntities']['searchResults']
        count = 0
        
        for search_result in glossary_data:
            entity = search_result['entity']
            glossary_info = safe_dict_access(entity, 'glossaryTermInfo')
            
            await safe_insert(conn, """
                INSERT INTO datahub_glossary (urn, name, definition)
                VALUES ($1, $2, $3) ON CONFLICT (urn) DO NOTHING
            """, (entity.get('urn'), entity.get('name'), 
                  glossary_info.get('definition')), 'datahub_glossary')
            count += 1
        logger.info(f"Glossary Terms: {count}")
        return count
    except Exception as e:
        logger.error(f" Glossary sync failed: {e}")
        return 0

async def sync_owners(conn) -> int:
    """Sync owners using users query + domain ownership"""
    try:
        result = await gql_client.execute_async(USERS_QUERY)
        users_data = result['listUsers']['users']
        count = 0
        
        for user in users_data:
            await safe_insert(conn, """
                INSERT INTO datahub_owners (urn, type, username)
                VALUES ($1, $2, $3) ON CONFLICT (urn) DO NOTHING
            """, (user.get('urn'), user.get('type'), user.get('username')), 'datahub_owners')
            count += 1
        logger.info(f"Owners: {count}")
        return count
    except Exception as e:
        logger.error(f" Owners sync failed: {e}")
        return 0

@app.post("/init-schema")
async def run_init_schema():
    async with pg_pool.acquire() as conn:
        await init_schema(conn)
    return {"status": "schema_created"}

@app.post("/sync/full", response_model=SyncStats)
async def sync_full():
    """Full sync of all DataHub entities"""
    stats = SyncStats()
    
    async with pg_pool.acquire() as conn:
        # Truncate all tables
        tables = ['datahub_dataset_properties', 'datahub_datasets', 
                 'datahub_domains', 'datahub_tags', 'datahub_glossary', 'datahub_owners']
        for table in tables:
            await safe_truncate(conn, table)
        
        # Execute entity-specific syncs
        stats.datasets = await sync_datasets(conn)
        stats.domains = await sync_domains(conn)
        stats.tags = await sync_tags(conn)
        stats.glossary_terms = await sync_glossary(conn)
        stats.owners = await sync_owners(conn)
        stats.total = stats.datasets + stats.domains + stats.tags + stats.glossary_terms + stats.owners
        
    logger.info(f" FULL SYNC COMPLETE: {stats}")
    return stats

@app.post("/sync/datasets", response_model=Dict[str, int])
async def sync_datasets_only():
    async with pg_pool.acquire() as conn:
        await safe_truncate(conn, 'datahub_datasets')
        await safe_truncate(conn, 'datahub_dataset_properties')
        count = await sync_datasets(conn)
    return {"datasets": count}

@app.get("/stats")
async def stats():
    async with pg_pool.acquire() as conn:
        tables = {
            'datasets': 'COUNT(*) FROM datahub_datasets',
            'domains': 'COUNT(*) FROM datahub_domains',
            'tags': 'COUNT(*) FROM datahub_tags',
            'glossary': 'COUNT(*) FROM datahub_glossary',
            'owners': 'COUNT(*) FROM datahub_owners'
        }
        result = {k: int(await conn.fetchval(f"SELECT {v}")) for k,v in tables.items()}
        return {"counts": result}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001)



# import asyncio
# import os
# import logging
# from typing import Dict, Any, Optional, List
# import asyncpg
# from fastapi import FastAPI, BackgroundTasks
# from pydantic import BaseModel
# from gql import gql, Client
# from gql.transport.aiohttp import AIOHTTPTransport
# from contextlib import asynccontextmanager
# from datetime import datetime


# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)


# app = FastAPI(title="DataHub → PostgreSQL Full Sync API")


# # Config - Match your env
# DATAHUB_GRAPHQL_URL = os.getenv("DATAHUB_GRAPHQL_URL", "http://nginx-proxy/graphql")
# PG_HOST = os.getenv("PG_HOST", "postgres")
# PG_PORT = int(os.getenv("PG_PORT", "5432"))
# PG_DB = os.getenv("PG_DB", "semantic_search")
# PG_USER = os.getenv("PG_USER", "semantic_user")
# PG_PASS = os.getenv("PG_PASS", "semantic_pass")


# # YOUR EXACT GraphQL Query
# CATALOG_QUERY = gql("""
# query DataCatalog {
#   search(input: {
#     type: DATASET
#     query: "*"
#     start: 0
#     count: 100
#   }) {
#     total
#     searchResults {
#       entity {
#         ... on Dataset {
#           name
#           urn
#           properties {
#             name
#             description
#             lastModified { time }
#             created
#             createdActor
#           }
#           platform { name }
#           tags {
#             tags {
#               tag {
#                 urn
#                 properties { name description colorHex }
#               }
#             }
#           }
#           domain {
#             domain {
#               urn
#               properties { name description }
#             }
#           }
#           upstream: lineage(input: {direction: UPSTREAM, start: 0, count: 100}) {
#             relationships {
#               entity {
#                 ... on Dataset { urn name }
#               }
#             }
#           }
#           downstream: lineage(input: {direction: DOWNSTREAM, start: 0, count: 100}) {
#             relationships {
#               entity {
#                 ... on Dataset { urn name }
#               }
#             }
#           }
#           glossaryTerms {
#             terms {
#               term {
#                 urn
#                 name
#                 properties { name definition }
#               }
#             }
#           }
#           ownership {
#             owners {
#               owner {
#                 ... on CorpUser { urn type username }
#                 ... on CorpGroup { urn type name }
#               }
#               ownershipType { type }
#             }
#           }
#         }
#       }
#     }
#   }
# }
# """)


# class SyncStats(BaseModel):
#     total: int = 0
#     datasets: int = 0
#     properties: int = 0
#     domains: int = 0
#     tags: int = 0
#     lineage_up: int = 0
#     lineage_down: int = 0
#     glossary_terms: int = 0
#     owners: int = 0
#     errors: int = 0


# pg_pool = None
# gql_client = None


# def safe_str(value: Any) -> str:
#     return str(value) if value is not None else ""


# def safe_ts(value: Any) -> Optional[str]:
#     if value is None or value == '0':
#         return None
#     if isinstance(value, str) and value.lower() in ['null', 'none', '']:
#         return None
#     try:
#         if isinstance(value, str):
#             return datetime.fromisoformat(value.replace('Z', '+00:00')).isoformat()
#         return value.isoformat() if hasattr(value, 'isoformat') else None
#     except:
#         return None


# def safe_dict_access(obj: Any, *keys) -> Any:
#     """Safe nested dict access - prevents NoneType.get() errors"""
#     current = obj
#     for key in keys:
#         if not isinstance(current, dict):
#             return None
#         current = current.get(key)
#         if current is None:
#             return None
#     return current


# async def get_pg_pool():
#     return await asyncpg.create_pool(
#         host=PG_HOST, port=PG_PORT, database=PG_DB, user=PG_USER, password=PG_PASS,
#         min_size=1, max_size=20, command_timeout=60
#     )


# async def init_schema(conn):  
#     """Create ALL tables matching your GraphQL query"""
#     schema_sql = """
#     -- 1. CORE DATASETS
#     CREATE TABLE IF NOT EXISTS datasets (
#         urn TEXT PRIMARY KEY,
#         name TEXT NOT NULL,
#         platform_name TEXT,
#         created TIMESTAMP
#     );
    
#     -- 2. DATASET PROPERTIES  
#     CREATE TABLE IF NOT EXISTS dataset_properties (
#         dataset_urn TEXT REFERENCES datasets(urn) ON DELETE CASCADE,
#         prop_name TEXT,
#         description TEXT,
#         created TIMESTAMP,
#         last_modified_time TIMESTAMP,
#         created_actor TEXT,
#         PRIMARY KEY (dataset_urn, prop_name)
#     );
    
#     -- 3. DOMAINS
#     CREATE TABLE IF NOT EXISTS domains (
#         urn TEXT PRIMARY KEY,
#         domain_name TEXT,
#         description TEXT
#     );
#     CREATE TABLE IF NOT EXISTS dataset_domains (
#         dataset_urn TEXT REFERENCES datasets(urn) ON DELETE CASCADE,
#         domain_urn TEXT REFERENCES domains(urn),
#         PRIMARY KEY (dataset_urn, domain_urn)
#     );
    
#     -- 4. TAGS
#     CREATE TABLE IF NOT EXISTS dataset_tags (
#         dataset_urn TEXT REFERENCES datasets(urn) ON DELETE CASCADE,
#         tag_urn TEXT,
#         tag_name TEXT,
#         tag_description TEXT,
#         color_hex TEXT,
#         PRIMARY KEY (dataset_urn, tag_urn)
#     );
    
#     -- 5. LINEAGE
#     CREATE TABLE IF NOT EXISTS lineage_relationships (
#         source_dataset_urn TEXT REFERENCES datasets(urn) ON DELETE CASCADE,
#         target_dataset_urn TEXT REFERENCES datasets(urn),
#         direction TEXT CHECK (direction IN ('UPSTREAM','DOWNSTREAM')),
#         PRIMARY KEY (source_dataset_urn, target_dataset_urn, direction)
#     );
    
#     -- 6. GLOSSARY TERMS
#     CREATE TABLE IF NOT EXISTS glossary_terms (
#         urn TEXT PRIMARY KEY,
#         term_name TEXT,
#         definition TEXT
#     );
#     CREATE TABLE IF NOT EXISTS dataset_glossary_terms (
#         dataset_urn TEXT REFERENCES datasets(urn) ON DELETE CASCADE,
#         glossary_term_urn TEXT REFERENCES glossary_terms(urn),
#         PRIMARY KEY (dataset_urn, glossary_term_urn)
#     );
    
#     -- 7. OWNERSHIP
#     CREATE TABLE IF NOT EXISTS owners (
#         urn TEXT PRIMARY KEY,
#         type TEXT,
#         username TEXT,
#         group_name TEXT
#     );
#     CREATE TABLE IF NOT EXISTS dataset_ownership (
#         dataset_urn TEXT REFERENCES datasets(urn) ON DELETE CASCADE,
#         owner_urn TEXT REFERENCES owners(urn),
#         ownership_type TEXT,
#         PRIMARY KEY (dataset_urn, owner_urn)
#     );
#     """
#     try:
#         await conn.execute(schema_sql)
#         logger.info("🛠️  Schema created for ALL GraphQL entities")
#         return True
#     except Exception as e:
#         logger.error(f"❌ Schema failed: {e}")
#         return False


# async def safe_truncate(conn, table: str) -> bool:
#     try:
#         await conn.execute(f"TRUNCATE TABLE {table} CASCADE")
#         logger.info(f"🗑️  {table}")
#         return True
#     except Exception as e:
#         logger.warning(f"⚠️  {table}: {e}")
#         return False


# async def safe_insert(conn, sql: str, args: tuple, table: str) -> bool:
#     try:
#         await conn.execute(sql, *args)
#         return True
#     except Exception as e:
#         logger.warning(f"⚠️  INSERT {table}: {e}")
#         return False


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     global pg_pool, gql_client
#     pg_pool = await get_pg_pool()
    
#     # Initialize schema on startup
#     async with pg_pool.acquire() as conn:
#         await init_schema(conn)
    
#     transport = AIOHTTPTransport(url=DATAHUB_GRAPHQL_URL)
#     gql_client = Client(transport=transport)
#     logger.info("🚀 DataHub → PostgreSQL Sync Ready!")
#     yield
#     await pg_pool.close()


# app.router.lifespan_context = lifespan


# async def execute_catalog_sync() -> SyncStats:
#     stats = SyncStats()
    
#     async with pg_pool.acquire() as conn:
#         # TRUNCATE ALL TABLES
#         tables = ['dataset_ownership','dataset_glossary_terms','lineage_relationships',
#                   'dataset_domains','dataset_tags','dataset_properties',
#                   'glossary_terms','owners','domains','datasets']
#         for table in tables:
#             await safe_truncate(conn, table)
        
#         # EXECUTE YOUR GRAPHQL QUERY
#         try:
#             result = await gql_client.execute_async(CATALOG_QUERY)
#             data = result['search']
#             stats.total = data['total']
#             logger.info(f"📊 Found {stats.total} datasets")
            
#             # PROCESS EACH DATASET
#             for i, search_result in enumerate(data['searchResults'], 1):
#                 try:
#                     entity = search_result['entity']
#                     urn = safe_str(entity.get('urn'))
#                     if i % 10 == 0: logger.info(f"🔄 {i}/{stats.total}")
                    
#                     # 1. DATASETS
#                     platform_name = safe_str(safe_dict_access(entity, 'platform', 'name'))
#                     created = safe_ts(safe_dict_access(entity, 'properties', 'created'))
#                     await safe_insert(conn, """
#                         INSERT INTO datasets (urn, name, platform_name, created) 
#                         VALUES ($1, $2, $3, $4) ON CONFLICT (urn) DO NOTHING
#                     """, (urn, entity.get('name'), platform_name, created), 'datasets')
#                     stats.datasets += 1
                    
#                     # 2. PROPERTIES
#                     props = safe_dict_access(entity, 'properties')
#                     if props:
#                         await safe_insert(conn, """
#                             INSERT INTO dataset_properties (dataset_urn, prop_name, description, 
#                                 created, last_modified_time, created_actor)
#                             VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING
#                         """, (urn, props.get('name'), props.get('description'),
#                               safe_ts(props.get('created')), 
#                               safe_ts(safe_dict_access(props, 'lastModified', 'time')),
#                               props.get('createdActor')), 'dataset_properties')
#                         stats.properties += 1
                    
#                     # 3. DOMAINS
#                     domain = safe_dict_access(entity, 'domain', 'domain')
#                     if domain:
#                         d_urn = domain.get('urn')
#                         d_props = safe_dict_access(domain, 'properties')
#                         await safe_insert(conn, """
#                             INSERT INTO domains (urn, domain_name, description)
#                             VALUES ($1,$2,$3) ON CONFLICT (urn) DO NOTHING
#                         """, (d_urn, d_props.get('name'), d_props.get('description')), 'domains')
#                         stats.domains += 1
#                         await safe_insert(conn, "INSERT INTO dataset_domains VALUES ($1,$2) ON CONFLICT DO NOTHING", 
#                                         (urn, d_urn), 'dataset_domains')
                    
#                     # 4. TAGS
#                     tags_array = safe_dict_access(entity, 'tags', 'tags')
#                     if isinstance(tags_array, list):
#                         for tag_group in tags_array:
#                             tag = tag_group.get('tag')
#                             if isinstance(tag, dict):
#                                 t_urn = tag.get('urn')
#                                 t_props = safe_dict_access(tag, 'properties')
#                                 await safe_insert(conn, """
#                                     INSERT INTO dataset_tags (dataset_urn, tag_urn, tag_name, 
#                                         tag_description, color_hex) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING
#                                 """, (urn, t_urn, t_props.get('name'), t_props.get('description'), 
#                                       t_props.get('colorHex')), 'dataset_tags')
#                                 stats.tags += 1
                    
#                     # 5. UPSTREAM LINEAGE
#                     upstream_rels = safe_dict_access(entity, 'upstream', 'relationships')
#                     if isinstance(upstream_rels, list):
#                         for rel in upstream_rels:
#                             target = rel.get('entity')
#                             if isinstance(target, dict):
#                                 target_urn = target.get('urn')
#                                 if target_urn:
#                                     await safe_insert(conn, """
#                                         INSERT INTO lineage_relationships VALUES ($1,$2,'UPSTREAM') ON CONFLICT DO NOTHING
#                                     """, (urn, target_urn), 'lineage_up')
#                                     stats.lineage_up += 1
                    
#                     # 6. DOWNSTREAM LINEAGE  
#                     downstream_rels = safe_dict_access(entity, 'downstream', 'relationships')
#                     if isinstance(downstream_rels, list):
#                         for rel in downstream_rels:
#                             target = rel.get('entity')
#                             if isinstance(target, dict):
#                                 target_urn = target.get('urn')
#                                 if target_urn:
#                                     await safe_insert(conn, """
#                                         INSERT INTO lineage_relationships VALUES ($1,$2,'DOWNSTREAM') ON CONFLICT DO NOTHING
#                                     """, (urn, target_urn), 'lineage_down')
#                                     stats.lineage_down += 1
                    
#                     # 7. GLOSSARY TERMS
#                     glossary_array = safe_dict_access(entity, 'glossaryTerms', 'terms')
#                     if isinstance(glossary_array, list):
#                         for term_group in glossary_array:
#                             term = term_group.get('term')
#                             if isinstance(term, dict):
#                                 g_urn = term.get('urn')
#                                 g_props = safe_dict_access(term, 'properties')
#                                 await safe_insert(conn, """
#                                     INSERT INTO glossary_terms (urn, term_name, definition)
#                                     VALUES ($1,$2,$3) ON CONFLICT (urn) DO NOTHING
#                                 """, (g_urn, term.get('name'), g_props.get('definition')), 'glossary_terms')
#                                 stats.glossary_terms += 1
#                                 await safe_insert(conn, "INSERT INTO dataset_glossary_terms VALUES ($1,$2) ON CONFLICT DO NOTHING", 
#                                                 (urn, g_urn), 'dataset_glossary_terms')
                    
#                     # 8. OWNERSHIP
#                     owners_array = safe_dict_access(entity, 'ownership', 'owners')
#                     if isinstance(owners_array, list):
#                         for owner_entry in owners_array:
#                             if isinstance(owner_entry, dict):
#                                 owner = owner_entry.get('owner')
#                                 if isinstance(owner, dict):
#                                     o_urn = owner.get('urn')
#                                     o_type = owner.get('type')
#                                     if o_type == 'CorpUser':
#                                         await safe_insert(conn, """
#                                             INSERT INTO owners (urn,type,username) VALUES ($1,$2,$3) ON CONFLICT (urn) DO NOTHING
#                                         """, (o_urn, o_type, owner.get('username')), 'owners')
#                                     elif o_type == 'CorpGroup':
#                                         await safe_insert(conn, """
#                                             INSERT INTO owners (urn,type,group_name) VALUES ($1,$2,$3) ON CONFLICT (urn) DO NOTHING
#                                         """, (o_urn, o_type, owner.get('name')), 'owners')
#                                     stats.owners += 1
                                    
#                                     o_type_data = owner_entry.get('ownershipType')
#                                     if isinstance(o_type_data, dict):
#                                         o_type_val = o_type_data.get('type')
#                                         await safe_insert(conn, """
#                                             INSERT INTO dataset_ownership VALUES ($1,$2,$3) ON CONFLICT DO NOTHING
#                                         """, (urn, o_urn, o_type_val), 'dataset_ownership')
#                 except Exception as e:
#                     stats.errors += 1
#                     logger.error(f"Dataset process error: {e}")
#                     continue
                    
#             logger.info(f"✅ SYNC COMPLETE: {stats}")
#         except Exception as e:
#             logger.error(f"Global sync error: {e}")
#             stats.errors += 1
            
#     return stats


# # API ENDPOINTS

# # RENAMED to avoid conflict with logic function
# @app.post("/init-schema")
# async def run_init_schema():
#     async with pg_pool.acquire() as conn:
#         await init_schema(conn)
#     return {"status": "schema_created"}


# @app.post("/sync/now", response_model=SyncStats)
# async def sync_now():
#     return await execute_catalog_sync()


# @app.get("/stats")
# async def stats():
#     async with pg_pool.acquire() as conn:
#         tables = {
#             'datasets': 'COUNT(*) FROM datasets',
#             'properties': 'COUNT(*) FROM dataset_properties',
#             'domains': 'COUNT(*) FROM domains',
#             'tags': 'COUNT(*) FROM dataset_tags',
#             'lineage': 'COUNT(*) FROM lineage_relationships',
#             'glossary_terms': 'COUNT(*) FROM glossary_terms',
#             'owners': 'COUNT(*) FROM owners'
#         }
#         result = {k: int(await conn.fetchval(f"SELECT {v}")) for k,v in tables.items()}
#         return {"counts": result}


# @app.get("/health")
# async def health():
#     return {"status": "healthy"}


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8001)
