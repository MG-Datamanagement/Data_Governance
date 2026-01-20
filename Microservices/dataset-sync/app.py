# dataset-sync/app.py 
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import requests
import psycopg2
import asyncpg
import json
from datetime import datetime
import os
import logging
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import uvicorn
from openai import AsyncAzureOpenAI
from pathlib import Path


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Data card and chatbot  Service", version="2.0.0")

# Config
DATAHUB_GRAPHQL_URL = os.getenv("DATAHUB_GRAPHQL_URL", "http://nginx-proxy/graphql")
PG_HOST = os.getenv("PG_HOST", "postgres")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB = os.getenv("PG_DB", "semantic_search")
PG_USER = os.getenv("PG_USER", "semantic_user")
PG_PASS = os.getenv("PG_PASS", "semantic_pass")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


AZURE_CONFIG = {
    "api_key": os.getenv("AZURE_OPENAI_API_KEY"),
    "azure_endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
    "api_version": os.getenv("AZURE_OPENAI_API_VERSION"),
    "azure_deployment": os.getenv("AZURE_DEPLOYMENT", "gpt-35-turbo-16k")  # fallback
}

# Debug instead of crash
missing = []
for k, v in [("api_key", AZURE_CONFIG["api_key"]), ("azure_endpoint", AZURE_CONFIG["azure_endpoint"])]:
    if not v:
        missing.append(k)
        logger.error(f" Missing {k}")
    else:
        logger.info(f" {k}: SET (len={len(v)})")

if missing:
    logger.warning("Azure client partially configured - will fail on API calls")
else:
    client = AsyncAzureOpenAI(**AZURE_CONFIG)
    logger.info("Azure client ready!")
# if not all([AZURE_CONFIG["api_key"]]):
#     raise ValueError("Missing AZURE_OPENAI_API_KEY or AZURE_OPENAI_ENDPOINT in .env")


# client = AsyncAzureOpenAI(**AZURE_CONFIG)

# AsyncPG pool config (same DB creds as sync)
DB_CONFIG = {
    "host": PG_HOST,
    "port": PG_PORT,
    "user": PG_USER,
    "password": PG_PASS,
    "database": PG_DB
}

GRAPHQL_QUERY = """
query ListAllDatasetsComplete {
  search(input: { type: DATASET, query: "*", count: 100, start: 0 }) {
    total
    searchResults {
      entity {
        ... on Dataset {
          urn
          name
          origin
          editableProperties { description }
          domain {
            domain {
              urn
              properties { name description }
            }
          }
          datasetProfiles(limit:1){
            rowCount
            columnCount
            timestampMillis
          }
          schemaMetadata {
            fields {
              fieldPath
              type
            }
            primaryKeys
          }
          ownership {
            owners {
              owner {
                ... on CorpUser {
                  urn
                  properties {
                    title
                    email
                  }
                }
              }
            }
          }
          globalTags {
            tags {
              tag {
                urn
                properties {
                  name
                  description
                }
              }
            }
          }
          glossaryTerms {
            terms {
              term {
                urn
                name
                properties { name definition }
              }
            }
          }
        }
      }
    }
  }
}
"""

UPSERT_SQL = """
INSERT INTO datahub_dataset_all (
    urn, name, origin, description, domain_urn, domain_name, domain_description,
    row_count, column_count, profile_timestamp, 
    all_field_paths, all_field_types, field_count,
    primary_keys, owner_urn, owner_title, owner_email, tag_urn, tag_name, tag_description,
    glossary_urn, glossary_name, glossary_definition, data_card, raw_json
) VALUES (
    %(urn)s, %(name)s, %(origin)s, %(description)s, %(domain_urn)s, %(domain_name)s, %(domain_description)s,
    %(row_count)s, %(column_count)s, %(profile_timestamp)s,
    COALESCE(%(all_field_paths)s, ARRAY[]::TEXT[]), COALESCE(%(all_field_types)s, ARRAY[]::TEXT[]), %(field_count)s,
    %(primary_keys)s, %(owner_urn)s, %(owner_title)s, %(owner_email)s, %(tag_urn)s, %(tag_name)s, %(tag_description)s,
    %(glossary_urn)s, %(glossary_name)s, %(glossary_definition)s, %(data_card)s, %(raw_json)s
) ON CONFLICT (urn) DO UPDATE SET
    name = EXCLUDED.name, origin = EXCLUDED.origin, description = EXCLUDED.description,
    domain_urn = EXCLUDED.domain_urn, domain_name = EXCLUDED.domain_name, domain_description = EXCLUDED.domain_description,
    row_count = EXCLUDED.row_count, column_count = EXCLUDED.column_count, profile_timestamp = EXCLUDED.profile_timestamp,
    all_field_paths = EXCLUDED.all_field_paths, all_field_types = EXCLUDED.all_field_types, field_count = EXCLUDED.field_count,
    primary_keys = EXCLUDED.primary_keys, owner_urn = EXCLUDED.owner_urn, owner_title = EXCLUDED.owner_title, 
    owner_email = EXCLUDED.owner_email, tag_urn = EXCLUDED.tag_urn, tag_name = EXCLUDED.tag_name, 
    tag_description = EXCLUDED.tag_description, glossary_urn = EXCLUDED.glossary_urn, 
    glossary_name = EXCLUDED.glossary_name, glossary_definition = EXCLUDED.glossary_definition,
    data_card = EXCLUDED.data_card, raw_json = EXCLUDED.raw_json, updated_at = CURRENT_TIMESTAMP
"""

class SyncResponse(BaseModel):
    status: str
    total_processed: int
    message: str

class GenerateRequest(BaseModel):
    style: Optional[str] = "professional"  # "professional", "technical", "business"
    max_tokens: Optional[int] = 2000

class DataCardResponse(BaseModel):
    dataset_id: int
    urn: str
    name: str
    data_card: str
    generated_at: datetime
    status: str

# Pydantic models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    question: str
    conversation_history: List[Message] = []

class ChatResponse(BaseModel):
    answer: str
    query_type: str  # "sql" or "descriptive"
    sql_query: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None
    timestamp: str


class ChatHistoryEntry(BaseModel):
    question: str
    answer: str
    query_type: str
    sql_query: Optional[str] = None
    timestamp: str
    session_id: Optional[str] = None

@contextmanager
def get_pg_connection():
    conn = psycopg2.connect(
        host=PG_HOST, port=PG_PORT, database=PG_DB, user=PG_USER, password=PG_PASS,
        cursor_factory=RealDictCursor
    )
    try:
        yield conn
    finally:
        conn.close()

def create_datasets_table():
    """FIXED: No transaction index errors + migrates existing table"""
    conn = None
    try:
        conn = psycopg2.connect(
            host=PG_HOST, port=PG_PORT, database=PG_DB, user=PG_USER, password=PG_PASS
        )
        cursor = conn.cursor()
        
        # 1. CREATE base table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS datahub_dataset_all (
                id SERIAL PRIMARY KEY,
                urn VARCHAR(500) UNIQUE NOT NULL,
                name VARCHAR(500),
                origin VARCHAR(200),
                description TEXT,
                domain_urn VARCHAR(500),
                domain_name VARCHAR(200),
                domain_description TEXT,
                row_count BIGINT,
                column_count INTEGER,
                profile_timestamp BIGINT,
                all_field_paths TEXT[] DEFAULT ARRAY[]::TEXT[],
                all_field_types TEXT[] DEFAULT ARRAY[]::TEXT[],
                field_count INTEGER DEFAULT 0,
                primary_keys TEXT,
                owner_urn VARCHAR(500),
                owner_title VARCHAR(200),
                owner_email VARCHAR(200),
                tag_urn VARCHAR(500),
                tag_name VARCHAR(200),
                tag_description TEXT,
                glossary_urn VARCHAR(500),
                glossary_name VARCHAR(200),
                glossary_definition TEXT,
                data_card TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                raw_json JSONB
            )
        """)
        
        # 2. COMMIT table creation
        conn.commit()
        
        # 3. ADD missing columns (separate transaction)
        cursor.execute("""
            DO $$
            BEGIN
                ALTER TABLE datahub_dataset_all ADD COLUMN IF NOT EXISTS all_field_paths TEXT[] DEFAULT ARRAY[]::TEXT[];
                ALTER TABLE datahub_dataset_all ADD COLUMN IF NOT EXISTS all_field_types TEXT[] DEFAULT ARRAY[]::TEXT[];
                ALTER TABLE datahub_dataset_all ADD COLUMN IF NOT EXISTS field_count INTEGER DEFAULT 0;
                ALTER TABLE datahub_dataset_all ADD COLUMN IF NOT EXISTS data_card TEXT;
                
                UPDATE datahub_dataset_all 
                SET all_field_paths = COALESCE(all_field_paths, ARRAY[]::TEXT[]),
                    all_field_types = COALESCE(all_field_types, ARRAY[]::TEXT[]),
                    field_count = COALESCE(field_count, 0),
                    data_card = NULL
                WHERE all_field_paths IS NULL OR all_field_types IS NULL;
            EXCEPTION WHEN duplicate_column THEN
                NULL;
            END $$;
        """)
        conn.commit()
        
        # 4. CREATE INDEXES (separate transactions - NO CONCURRENTLY)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_datasets_urn ON datahub_dataset_all(urn)")
        conn.commit()
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_datasets_name ON datahub_dataset_all(name)")
        conn.commit()
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_datasets_domain ON datahub_dataset_all(domain_urn)")
        conn.commit()
        
        # GIN indexes (separate transactions)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_datasets_field_paths ON datahub_dataset_all USING GIN (all_field_paths)")
        conn.commit()
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_datasets_field_types ON datahub_dataset_all USING GIN (all_field_types)")
        conn.commit()
        
        logger.info(" Table 'datahub_dataset_all' fully migrated - NO INDEX ERRORS!")
        
    except Exception as e:
        logger.error(f" Table setup failed: {e}")
        if conn: conn.rollback()
        raise
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

def flatten_dataset_data(dataset: Dict[str, Any]) -> Dict[str, Any]:
    """ Stores ALL columns as arrays + data_card=NULL"""
    def safe_get(obj, key, default=''): 
        return obj.get(key, default) if obj and isinstance(obj, dict) else default
    
    def safe_list_get(lst, index, default=None):
        return lst[index] if lst and isinstance(lst, list) and index < len(lst) else default or {}
    
    def safe_numeric(value):
        if value == '' or value is None: return None
        try: return int(value)
        except: return None
    
    flattened = {
        'urn': safe_get(dataset, 'urn'),
        'name': safe_get(dataset, 'name'),
        'origin': safe_get(dataset, 'origin'),
        'description': safe_get(safe_get(dataset, 'editableProperties'), 'description'),
        'data_card': None,
        'raw_json': json.dumps(dataset, ensure_ascii=False)
    }
    
    # Domain, Profile, Schema, Owner, Tag, Glossary (same safe logic as before)
    domain = safe_get(dataset, 'domain')
    flattened.update({
        'domain_urn': safe_get(safe_get(domain, 'domain'), 'urn'),
        'domain_name': safe_get(safe_get(safe_get(domain, 'domain'), 'properties'), 'name'),
        'domain_description': safe_get(safe_get(safe_get(domain, 'domain'), 'properties'), 'description')
    })
    
    profile = safe_list_get(safe_get(dataset, 'datasetProfiles', []), 0)
    flattened.update({
        'row_count': safe_numeric(safe_get(profile, 'rowCount')),
        'column_count': safe_numeric(safe_get(profile, 'columnCount')),
        'profile_timestamp': safe_numeric(safe_get(profile, 'timestampMillis'))
    })
    
    #  ALL COLUMNS AS ARRAYS
    schema = safe_get(dataset, 'schemaMetadata')
    fields = safe_get(schema, 'fields', [])
    field_paths = [safe_get(f, 'fieldPath') for f in fields if safe_get(f, 'fieldPath')]
    field_types = [safe_get(f, 'type') for f in fields if safe_get(f, 'type')]
    
    flattened.update({
        'all_field_paths': field_paths,
        'all_field_types': field_types,
        'field_count': len(fields),
        'primary_keys': json.dumps(safe_get(schema, 'primaryKeys', []))
    })
    
    # Owner, Tag, Glossary (abbreviated for brevity)
    owners = safe_get(safe_get(dataset, 'ownership'), 'owners', [])
    owner = safe_list_get(owners, 0)
    owner_obj = safe_get(owner, 'owner')
    owner_props = safe_get(owner_obj, 'properties')
    flattened.update({
        'owner_urn': safe_get(owner_obj, 'urn'),
        'owner_title': safe_get(owner_props, 'title'),
        'owner_email': safe_get(owner_props, 'email')
    })
    
    tags = safe_get(safe_get(dataset, 'globalTags'), 'tags', [])
    tag = safe_list_get(tags, 0)
    tag_obj = safe_get(tag, 'tag')
    tag_props = safe_get(tag_obj, 'properties')
    flattened.update({
        'tag_urn': safe_get(tag_obj, 'urn'),
        'tag_name': safe_get(tag_props, 'name'),
        'tag_description': safe_get(tag_props, 'description')
    })
    
    terms = safe_get(safe_get(dataset, 'glossaryTerms'), 'terms', [])
    term = safe_list_get(terms, 0)
    term_obj = safe_get(term, 'term')
    term_props = safe_get(term_obj, 'properties')
    flattened.update({
        'glossary_urn': safe_get(term_obj, 'urn'),
        'glossary_name': safe_get(term_obj, 'name'),
        'glossary_definition': safe_get(term_props, 'definition')
    })
    
    return flattened

async def get_pool():
    return await asyncpg.create_pool(**DB_CONFIG, min_size=1, max_size=10)

@app.on_event("startup")
async def startup():
    app.state.pool = await get_pool()
    create_datasets_table()  # Your existing table setup

@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()

@app.get("/", tags=["health"])
async def root():
    return {"status": "DataHub Dataset Sync v2.0  ARRAY + data_card", "port": 8005}

@app.post("/sync/blocking", response_model=SyncResponse, tags=["sync"])
async def sync_blocking():
    try:
        logger.info("Starting BLOCKING sync...")
        create_datasets_table()
        
        response = requests.post(DATAHUB_GRAPHQL_URL, json={'query': GRAPHQL_QUERY}, 
                               headers={'Content-Type': 'application/json'}, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        datasets = [r.get('entity', {}) for r in data.get('data', {}).get('search', {}).get('searchResults', [])
                   if 'dataset' in r.get('entity', {}).get('urn', '').lower()]
        
        logger.info(f"📦 Processing {len(datasets)} datasets")
        
        with get_pg_connection() as conn:
            with conn.cursor() as cursor:
                total_inserted = total_updated = 0
                for dataset in datasets:
                    flattened = flatten_dataset_data(dataset)
                    cursor.execute("SELECT COUNT(*) as exists FROM datahub_dataset_all WHERE urn = %s", 
                                 (flattened['urn'],))
                    exists = cursor.fetchone()['exists']
                    cursor.execute(UPSERT_SQL, flattened)
                    if exists == 0: total_inserted += 1
                    else: total_updated += 1
                conn.commit()
        
        return SyncResponse(
            status="completed",
            total_processed=len(datasets),
            message=f"Synced {len(datasets)} datasets ({total_inserted} new, {total_updated} updated)"
        )
    except Exception as e:
        logger.error(f" Sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sync/status", tags=["sync"])
async def sync_status():
    with get_pg_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) as count, MAX(updated_at) as last_sync,
                       AVG(field_count) as avg_fields
                FROM datahub_dataset_all
            """)
            result = cursor.fetchone()
            return {
                "total_datasets": result['count'],
                "last_sync": result['last_sync'],
                "avg_field_count": result['avg_fields'],
                "status": "ready"
            }

@app.post("/generate-datacard/{urn}", response_model=DataCardResponse, tags=["datacard"])
async def generate_datacard(urn: str, request: GenerateRequest):
    """ Generate emoji-rich data card using Azure OpenAI"""
    
    # Fetch complete dataset using asyncpg
    async with app.state.pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id, urn, name, origin, description, domain_urn, domain_name, 
                   domain_description, row_count, column_count, profile_timestamp,
                   all_field_paths, all_field_types, field_count, primary_keys,
                   owner_urn, owner_title, owner_email, tag_urn, tag_name, 
                   tag_description, glossary_urn, glossary_name, glossary_definition,
                   data_card, raw_json, updated_at
            FROM datahub_dataset_all WHERE urn = $1
        """, urn)
        
        if not row:
            raise HTTPException(status_code=404, detail="Dataset not found")
    
    dataset = dict(row)
    
    # Check if data_card already exists
    # if dataset.get('data_card') is not None:
    #     raise HTTPException(status_code=409, detail="Data card already exists")
    
    # Prepare fields data (top 20 fields)
    dataset['fields'] = list(zip(
        dataset['all_field_paths'] or [], 
        dataset['all_field_types'] or []
    ))[:20]
    
    # Rich professional prompt - Pre-compute complex expressions with null checks
    profile_date = datetime.fromtimestamp(dataset.get('profile_timestamp', 0)/1000).strftime('%Y-%m-%d') if dataset.get('profile_timestamp') else 'Never'
    key_fields = ', '.join([f[:20] for f in (dataset.get('all_field_paths') or [])[:3]]) or 'primary_key'
    segmentation_fields = ', '.join([f[0].split('.')[-1] for f in (dataset.get('fields') or [])[:3]]) or 'customer_id'
    column_descriptors = '\n'.join([f"• **{path.split('.')[-1]}** (`{typ}`): {path.split('.')[-1]} for {['segmentation', 'forecasting', 'anomaly detection'][i%3]}." for i, (path, typ) in enumerate((dataset.get('fields') or [])[:10])]) if dataset.get('fields') else '• No field descriptors available'
    description_text = (dataset.get('description') or 'No description available')[:400]
    dataset_name = dataset.get('name') or 'Unknown Dataset'
    row_count = dataset.get('row_count') or 0
    column_count = dataset.get('column_count') or 0
    origin = dataset.get('origin') or 'unknown'
    domain_name = dataset.get('domain_name') or 'general'
    primary_keys = dataset.get('primary_keys') or 'Not specified'
    tag_name = dataset.get('tag_name') or 'None'
    owner_title = dataset.get('owner_title') or dataset.get('owner_email') or 'Not assigned'
    field_count = dataset.get('field_count') or 0
    
    prompt = f"""Generate a professional, emoji-rich data card EXACTLY in this detailed format:

About Dataset 📊
**Dataset Overview**
"Data is the new oil, but AI needs refined datasets."

{dataset_name} contains {row_count:,} rows across {column_count} columns from {origin} domain.

This dataset powers {domain_name} analytics with key fields like {key_fields}.

🧬 **Data Science Applications** (3 use cases)
• **Customer Segmentation**: Cluster users by {segmentation_fields} for personalized marketing.
• **Trend Analysis**: Time-series forecasting using temporal fields and {row_count:,} historical records.
• **Anomaly Detection**: ML models on high-volume data with primary keys {primary_keys}.

📝 **Column Descriptors** (Top 10/{field_count})
{column_descriptors}

🛡️ **Data Quality & Provenance**
• **Source**: {origin}
• **Owner**: {owner_title}
• **Profiled**: {profile_date}
• **Tags**: {tag_name}
• **Primary Keys**: {primary_keys}

📂 **Dataset Stats**
• **Rows**: {row_count:,}
• **Columns**: {column_count}
• **Fields**: {field_count}
• **Domain**: {domain_name}

**Description**
{description_text}...

**MANDATORY FORMATTING**:
1. EXACT structure/sections above
2. Quote at top (inspirational data quote)
3. 3 specific ML use cases with field references
4. Field descriptions: "**name** (`type`): Purpose."
5. Emojis: 📊🧬📝🛡️📂
6. Max 2000 chars, professional data science tone"""


    try:
        response = await client.chat.completions.create(
            model=AZURE_CONFIG["azure_deployment"],
            messages=[{"role": "user", "content": prompt}],
            max_tokens=request.max_tokens,
            temperature=0.7
        )
        
        data_card = response.choices[0].message.content
        
        # Update dataset with generated data card
        async with app.state.pool.acquire() as conn:
            await conn.execute("""
                UPDATE datahub_dataset_all 
                SET data_card = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE urn = $2
            """, data_card, urn)
        
        logger.info(f" Generated data card for dataset {urn}")
        
        return DataCardResponse(
            dataset_id=dataset['id'],
            urn=dataset['urn'],
            name=dataset['name'],
            data_card=data_card,
            generated_at=datetime.now(),
            status="generated"
        )
        
    except Exception as e:
        logger.error(f" Data card generation failed for {urn}: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/datacard/{urn}", tags=["datacard"])
async def get_datacard(urn: str):
    """Get existing data card for dataset"""
    async with app.state.pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id, urn, name, data_card, updated_at
            FROM datahub_dataset_all WHERE urn = $1 AND data_card IS NOT NULL
        """, urn)
        
        if not row:
            raise HTTPException(status_code=404, detail="Data card not found")
    
    return {
        "dataset_id": row['id'],
        "urn": row['urn'],
        "name": row['name'],
        "data_card": row['data_card'],
        "generated_at": row['updated_at']
    }




# Database connection helper
def get_db_connection():
    return psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DB,
        user=PG_USER,
        password=PG_PASS
    )

# Chat history file configuration
RESULTS_DIR = Path("dataset-sync/results")
CHAT_HISTORY_FILE = RESULTS_DIR / "chat.json"

# Ensure results directory exists
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Initialize chat history file if it doesn't exist
if not CHAT_HISTORY_FILE.exists():
    with open(CHAT_HISTORY_FILE, 'w') as f:
        json.dump([], f, indent=2)

 #Chat history management functions
def save_chat_to_history(question: str, answer: str, query_type: str, 
                         sql_query: Optional[str] = None, session_id: Optional[str] = None):
    """Save question and answer to chat history file"""
    try:
        # Read existing history
        with open(CHAT_HISTORY_FILE, 'r') as f:
            history = json.load(f)
        
        # Create new entry
        entry = {
            "question": question,
            "answer": answer,
            "query_type": query_type,
            "sql_query": sql_query,
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session_id
        }
        
        # Append to history
        history.append(entry)
        
        # Write back to file
        with open(CHAT_HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved chat entry to {CHAT_HISTORY_FILE}")
        return True
    except Exception as e:
        logger.error(f"Error saving chat history: {str(e)}")
        return False

def load_chat_history() -> List[Dict]:
    """Load all chat history"""
    try:
        with open(CHAT_HISTORY_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading chat history: {str(e)}")
        return []

def clear_chat_history():
    """Clear all chat history"""
    try:
        with open(CHAT_HISTORY_FILE, 'w') as f:
            json.dump([], f, indent=2)
        logger.info("Chat history cleared")
        return True
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        return False

# Get database schema with sample data
def get_database_schema():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    schema_info = []
    
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    
    for table in tables:
        table_name = table['table_name']
        
        # Get columns
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position;
        """, (table_name,))
        
        columns = cursor.fetchall()
        
        # Get sample data
        try:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
            samples = cursor.fetchall()
            sample_data = [dict(row) for row in samples]
        except:
            sample_data = []
        
        schema_info.append({
            'table': table_name,
            'columns': [
                {
                    'name': col['column_name'],
                    'type': col['data_type'],
                    'nullable': col['is_nullable']
                }
                for col in columns
            ],
            'sample_data': sample_data
        })
    
    cursor.close()
    conn.close()
    
    return schema_info

# Execute SQL query safely
def execute_sql_query(sql_query: str) -> List[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Security: Only allow SELECT statements
        sql_clean = sql_query.strip().upper()
        if not sql_clean.startswith('SELECT'):
            raise ValueError("Only SELECT queries are allowed")
        
        cursor.execute(sql_query)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return [dict(row) for row in results]
    except Exception as e:
        cursor.close()
        conn.close()
        logger.error(f"SQL execution error: {str(e)}")
        raise e

# Classify question type
async def classify_question(question: str) -> str:
    """Determine if question needs SQL query or descriptive answer"""
    
    classification_prompt = f"""Classify this question as either "sql" or "descriptive":

SQL questions: Questions that need to query database data (e.g., "show all datasets", "how many users", "list domains", "find datasets with tag X")
Descriptive questions: Questions about concepts, explanations, how-to guides (e.g., "what is DataHub?", "how does lineage work?", "explain metadata management")

Question: {question}

Respond with only one word: "sql" or "descriptive"."""

    response = await client.chat.completions.create(
        model=AZURE_CONFIG["azure_deployment"],
        messages=[{"role": "user", "content": classification_prompt}],
        temperature=0,
        max_tokens=10
    )
    
    classification = response.choices[0].message.content.strip().lower()
    return "sql" if "sql" in classification else "descriptive"

# Generate SQL query
async def generate_sql_query(question: str, schema_info: List[Dict]) -> str:
    """Generate PostgreSQL query from natural language"""
    
    schema_text = ""
    for table in schema_info:
        columns_text = ", ".join([f"{col['name']} ({col['type']})" for col in table['columns']])
        schema_text += f"\nTable: {table['table']}\nColumns: {columns_text}\n"
        
        if table['sample_data']:
            schema_text += f"Sample data: {json.dumps(table['sample_data'][:2], default=str)}\n"
    
    system_prompt = f"""You are a PostgreSQL expert for a DataHub metadata database.

Database Schema:
{schema_text}

Key Tables:
- datahub_dataset_all: Main dataset information (urn, name, platform, description)
- dataset_domains: Links datasets to domains
- dataset_glossary_terms: Links datasets to business glossary terms
- dataset_ownership: Dataset owners and ownership types
- dataset_properties: Additional properties (key-value pairs)
- dataset_tags: Tags associated with datasets
- datasets: Main datasets table
- domains: Business domains
- glossary_terms: Business glossary definitions
- lineage_relationships: Dataset lineage (upstream/downstream)
- owners: Owner information (name, type)

Generate a PostgreSQL query to answer the user's question.
- Use proper JOINs when relating tables
- Limit results to 100 rows unless specified
- Return ONLY the SQL query, no explanation or markdown
- Use descriptive column aliases when needed"""

    response = await client.chat.completions.create(
        model=AZURE_CONFIG["azure_deployment"],
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ],
        temperature=0.1,
        max_tokens=600
    )
    
    sql_query = response.choices[0].message.content.strip()
    sql_query = sql_query.replace("```sql", "").replace("```", "").strip()
    
    return sql_query

# Generate answer from SQL results
async def generate_sql_answer(question: str, sql_query: str, data: List[Dict], 
                              conversation_history: List[Message]) -> str:
    """Convert SQL results into natural language answer"""
    
    data_summary = json.dumps(data[:10], indent=2, default=str) if data else "No data returned"
    row_count = len(data)
    
    messages = [
        {
            "role": "system", 
            "content": """You are a concise DataHub assistant. Provide brief, structured answers.

Format:
1. ANSWER: Direct 1-line answer
2. COUNT: Number of results (X results found)
3. KEY DATA: 2-3 most important items (bullet points)
4. NOTE: Any important detail

Be BRIEF - max 4-5 lines total. Use bullets and short phrases. Avoid lengthy paragraphs."""
        }
    ]
    
    # Add recent conversation history
    for msg in conversation_history[-4:]:
        messages.append({"role": msg.role, "content": msg.content})
    
    user_message = f"""Q: {question}
Results: {row_count} rows
Data: {data_summary}"""

    messages.append({"role": "user", "content": user_message})
    
    response = await client.chat.completions.create(
        model=AZURE_CONFIG["azure_deployment"],
        messages=messages,
        temperature=0.7,
        max_tokens=300
    )
    
    return response.choices[0].message.content

# Generate descriptive answer
async def generate_descriptive_answer(question: str, conversation_history: List[Message]) -> str:
    """Answer descriptive/explanatory questions about DataHub"""
    
    messages = [
        {
            "role": "system",
            "content": """You are a professional DataHub consultant. Provide expert-level, concise responses.

## RESPONSE STRUCTURE

**Definition**
Brief explanation of the concept (1-2 lines max)

**Business Value**
Why this matters for data management (1 line)

**Practical Example**
Real-world application or use case (1-2 lines)

**Key Takeaway**
Most critical insight or recommendation (1 line)

## GUIDELINES
• Professional and authoritative tone
• Total response: 3-5 lines maximum
• Use bullet points for clarity
• Avoid technical jargon without explanation
• Include business impact when relevant
• No padding or unnecessary elaboration"""
        }
    ]
    
    # Add conversation history
    for msg in conversation_history[-4:]:
        messages.append({"role": msg.role, "content": msg.content})
    
    messages.append({"role": "user", "content": question})
    
    response = await client.chat.completions.create(
        model=AZURE_CONFIG["azure_deployment"],
        messages=messages,
        temperature=0.7,
        max_tokens=250
    )
    
    return response.choices[0].message.content

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": "DataHub Chatbot API",
        "version": "2.0.0",
        "endpoints": {
            "chat": "/chat",
            "schema": "/schema",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    try:
        conn = get_db_connection()
        conn.close()
        return {
            "status": "healthy",
            "database": "connected",
            "azure_openai": "configured",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.get("/schema")
async def get_schema():
    """Get database schema information"""
    try:
        schema = get_database_schema()
        return {
            "schema": schema,
            "table_count": len(schema)
        }
    except Exception as e:
        logger.error(f"Schema fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching schema: {str(e)}")

@app.get("/history")
async def get_history():
    """Get all chat history"""
    try:
        history = load_chat_history()
        return {
            "history": history,
            "total_entries": len(history),
            "file_path": str(CHAT_HISTORY_FILE)
        }
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@app.delete("/history")
async def delete_history():
    """Clear all chat history"""
    try:
        success = clear_chat_history()
        if success:
            return {
                "message": "Chat history cleared successfully",
                "file_path": str(CHAT_HISTORY_FILE)
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to clear chat history")
    except Exception as e:
        logger.error(f"Error clearing history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint - handles both SQL and descriptive questions"""
    try:
        logger.info(f"Received question: {request.question}")
        
        # Classify question type
        query_type = await classify_question(request.question)
        logger.info(f"Question classified as: {query_type}")
        
        if query_type == "sql":
            # Handle SQL query questions
            schema_info = get_database_schema()
            sql_query = await generate_sql_query(request.question, schema_info)
            logger.info(f"Generated SQL: {sql_query}")
            
            # Execute query
            data = execute_sql_query(sql_query)
            logger.info(f"Query returned {len(data)} rows")
            
            # Generate natural language answer
            answer = await generate_sql_answer(
                request.question,
                sql_query,
                data,
                request.conversation_history
            )
            
            # Save to chat history
            save_chat_to_history(
                question=request.question,
                answer=answer,
                query_type="sql",
                sql_query=sql_query
            )
            
            return ChatResponse(
                answer=answer,
                query_type="sql",
                sql_query=sql_query,
                data=data[:50],  # Limit response size
                timestamp=datetime.utcnow().isoformat()
            )
        
        else:
            # Handle descriptive questions
            answer = await generate_descriptive_answer(
                request.question,
                request.conversation_history
            )
            
            # Save to chat history
            save_chat_to_history(
                question=request.question,
                answer=answer,
                query_type="descriptive"
            )
            
            return ChatResponse(
                answer=answer,
                query_type="descriptive",
                timestamp=datetime.utcnow().isoformat()
            )
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")



# # Get database schema with sample data
# def get_database_schema():
#     conn = get_db_connection()
#     cursor = conn.cursor(cursor_factory=RealDictCursor)
    
#     schema_info = []
    
#     cursor.execute("""
#         SELECT table_name 
#         FROM information_schema.tables 
#         WHERE table_schema = 'public'
#         ORDER BY table_name;
#     """)
#     tables = cursor.fetchall()
    
#     for table in tables:
#         table_name = table['table_name']
        
#         # Get columns
#         cursor.execute("""
#             SELECT column_name, data_type, is_nullable
#             FROM information_schema.columns
#             WHERE table_schema = 'public' AND table_name = %s
#             ORDER BY ordinal_position;
#         """, (table_name,))
        
#         columns = cursor.fetchall()
        
#         # Get sample data
#         try:
#             cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
#             samples = cursor.fetchall()
#             sample_data = [dict(row) for row in samples]
#         except:
#             sample_data = []
        
#         schema_info.append({
#             'table': table_name,
#             'columns': [
#                 {
#                     'name': col['column_name'],
#                     'type': col['data_type'],
#                     'nullable': col['is_nullable']
#                 }
#                 for col in columns
#             ],
#             'sample_data': sample_data
#         })
    
#     cursor.close()
#     conn.close()
    
#     return schema_info

# # Execute SQL query safely
# def execute_sql_query(sql_query: str) -> List[Dict]:
#     conn = get_db_connection()
#     cursor = conn.cursor(cursor_factory=RealDictCursor)
    
#     try:
#         # Security: Only allow SELECT statements
#         sql_clean = sql_query.strip().upper()
#         if not sql_clean.startswith('SELECT'):
#             raise ValueError("Only SELECT queries are allowed")
        
#         cursor.execute(sql_query)
#         results = cursor.fetchall()
#         cursor.close()
#         conn.close()
#         return [dict(row) for row in results]
#     except Exception as e:
#         cursor.close()
#         conn.close()
#         logger.error(f"SQL execution error: {str(e)}")
#         raise e

# # Classify question type
# async def classify_question(question: str) -> str:
#     """Determine if question needs SQL query or descriptive answer"""
    
#     classification_prompt = f"""Classify this question as either "sql" or "descriptive":

# SQL questions: Questions that need to query database data (e.g., "show all datasets", "how many users", "list domains", "find datasets with tag X")
# Descriptive questions: Questions about concepts, explanations, how-to guides (e.g., "what is DataHub?", "how does lineage work?", "explain metadata management")

# Question: {question}

# Respond with only one word: "sql" or "descriptive"."""

#     response = await client.chat.completions.create(
#         model=AZURE_CONFIG["azure_deployment"],
#         messages=[{"role": "user", "content": classification_prompt}],
#         temperature=0.7,
#         max_tokens=10
#     )
    
#     classification = response.choices[0].message.content.strip().lower()
#     return "sql" if "sql" in classification else "descriptive"

# # Generate SQL query
# async def generate_sql_query(question: str, schema_info: List[Dict]) -> str:
#     """Generate PostgreSQL query from natural language"""
    
#     schema_text = ""
#     for table in schema_info:
#         columns_text = ", ".join([f"{col['name']} ({col['type']})" for col in table['columns']])
#         schema_text += f"\nTable: {table['table']}\nColumns: {columns_text}\n"
        
#         if table['sample_data']:
#             schema_text += f"Sample data: {json.dumps(table['sample_data'][:2], default=str)}\n"
    
#     system_prompt = f"""You are a PostgreSQL expert for a DataHub metadata database.

# Database Schema:
# {schema_text}

# Key Tables:
# - datahub_dataset_all: Main dataset information (urn, name, platform, description)
# - dataset_domains: Links datasets to domains
# - dataset_glossary_terms: Links datasets to business glossary terms
# - dataset_ownership: Dataset owners and ownership types
# - dataset_properties: Additional properties (key-value pairs)
# - dataset_tags: Tags associated with datasets
# - datasets: Main datasets table
# - domains: Business domains
# - glossary_terms: Business glossary definitions
# - lineage_relationships: Dataset lineage (upstream/downstream)
# - owners: Owner information (name, type)

# Generate a PostgreSQL query to answer the user's question.
# - Use proper JOINs when relating tables
# - Limit results to 100 rows unless specified
# - Return ONLY the SQL query, no explanation or markdown
# - Use descriptive column aliases when needed"""

#     response = await client.chat.completions.create(
#         model=AZURE_CONFIG["azure_deployment"],
#         messages=[
#             {"role": "system", "content": system_prompt},
#             {"role": "user", "content": question}
#         ],
#         temperature=0.7,
#         max_tokens=600
#     )
    
#     sql_query = response.choices[0].message.content.strip()
#     sql_query = sql_query.replace("```sql", "").replace("```", "").strip()
    
#     return sql_query

# # Generate answer from SQL results
# async def generate_sql_answer(question: str, sql_query: str, data: List[Dict], 
#                               conversation_history: List[Message]) -> str:
#     """Convert SQL results into natural language answer"""
    
#     data_summary = json.dumps(data[:15], indent=2, default=str) if data else "No data returned"
#     row_count = len(data)
    
#     messages = [
#         {
#             "role": "system", 
#             "content": """You are a helpful DataHub assistant. Analyze query results and provide clear, concise answers.

# Guidelines:
# - Start with a direct answer to the question
# - Present data in a well-formatted way (use tables, lists, or paragraphs as appropriate)
# - Include relevant statistics (counts, totals)
# - If no data found, explain clearly
# - Be conversational and helpful"""
#         }
#     ]
    
#     # Add recent conversation history
#     for msg in conversation_history[-6:]:
#         messages.append({"role": msg.role, "content": msg.content})
    
#     user_message = f"""Question: {question}

# SQL Query Executed:
# {sql_query}

# Number of Results: {row_count}

# Query Results:
# {data_summary}

# Please provide a clear, well-formatted answer based on this data."""

#     messages.append({"role": "user", "content": user_message})
    
#     response = await client.chat.completions.create(
#         model=AZURE_CONFIG["azure_deployment"],
#         messages=messages,
#         temperature=0.7,
#         max_tokens=1000
#     )
    
#     return response.choices[0].message.content

# # Generate descriptive answer
# async def generate_descriptive_answer(question: str, conversation_history: List[Message]) -> str:
#     """Answer descriptive/explanatory questions about DataHub"""
    
#     messages = [
#         {
#             "role": "system",
#             "content": """You are a knowledgeable DataHub expert assistant. Answer questions about:
# - DataHub concepts and features
# - Metadata management best practices
# - Data governance and cataloging
# - Data lineage and relationships
# - Dataset discovery and documentation
# - Glossary terms and business context
# - Domain organization
# - Ownership and stewardship

# Provide clear, informative answers with examples when helpful. Be concise but thorough."""
#         }
#     ]
    
#     # Add conversation history
#     for msg in conversation_history[-8:]:
#         messages.append({"role": msg.role, "content": msg.content})
    
#     messages.append({"role": "user", "content": question})
    
#     response = await client.chat.completions.create(
#         model=AZURE_CONFIG["azure_deployment"],
#         messages=messages,
#         temperature=0.7,
#         max_tokens=800
#     )
    
#     return response.choices[0].message.content

# # API Endpoints

# @app.get("/")
# async def root():
#     return {
#         "message": "DataHub Chatbot API",
#         "version": "2.0.0",
#         "endpoints": {
#             "chat": "/chat",
#             "schema": "/schema",
#             "health": "/health"
#         }
#     }

# @app.get("/health_chat")
# async def health_check():
#     try:
#         conn = get_db_connection()
#         conn.close()
#         return {
#             "status": "healthy",
#             "database": "connected",
#             "azure_openai": "configured",
#             "timestamp": datetime.utcnow().isoformat()
#         }
#     except Exception as e:
#         raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

# @app.get("/schema")
# async def get_schema():
#     """Get database schema information"""
#     try:
#         schema = get_database_schema()
#         return {
#             "schema": schema,
#             "table_count": len(schema)
#         }
#     except Exception as e:
#         logger.error(f"Schema fetch error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error fetching schema: {str(e)}")

# @app.post("/chat", response_model=ChatResponse)
# async def chat(request: ChatRequest):
#     """Main chat endpoint - handles both SQL and descriptive questions"""
#     try:
#         logger.info(f"Received question: {request.question}")
        
#         # Classify question type
#         query_type = await classify_question(request.question)
#         logger.info(f"Question classified as: {query_type}")
        
#         if query_type == "sql":
#             # Handle SQL query questions
#             schema_info = get_database_schema()
#             sql_query = await generate_sql_query(request.question, schema_info)
#             logger.info(f"Generated SQL: {sql_query}")
            
#             # Execute query
#             data = execute_sql_query(sql_query)
#             logger.info(f"Query returned {len(data)} rows")
            
#             # Generate natural language answer
#             answer = await generate_sql_answer(
#                 request.question,
#                 sql_query,
#                 data,
#                 request.conversation_history
#             )
            
#             return ChatResponse(
#                 answer=answer,
#                 query_type="sql",
#                 sql_query=sql_query,
#                 data=data[:50],  # Limit response size
#                 timestamp=datetime.utcnow().isoformat()
#             )
        
#         else:
#             # Handle descriptive questions
#             answer = await generate_descriptive_answer(
#                 request.question,
#                 request.conversation_history
#             )
            
#             return ChatResponse(
#                 answer=answer,
#                 query_type="descriptive",
#                 timestamp=datetime.utcnow().isoformat()
#             )
    
#     except ValueError as e:
#         logger.error(f"Validation error: {str(e)}")
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         logger.error(f"Chat error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")





if __name__ == "__main__":
    create_datasets_table()
    uvicorn.run(app, host="0.0.0.0", port=8005)
