# semantic-sync/semantic_sync.py
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any

import psycopg2
import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import uvicorn

from config import (
    DATAHUB_GMS_URL,
    DATAHUB_GRAPHQL_URL,
    DATAHUB_TOKEN,
    PG_HOST,
    PG_PORT,
    PG_DB,
    PG_USER,
    PG_PASS,
)

# ---------- Setup Logging ----------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="DataHub Semantic Sync", version="1.0.0")

# ---------- Health Check Endpoint ----------
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "semantic-sync"}

# ---------- Sync Status Endpoint ----------
sync_status = {"last_run": None, "status": "idle", "error": None}

@app.get("/status")
async def get_status():
    """Get current sync status"""
    return sync_status

# ---------- Core Sync Functions (same as before) ----------

# def graphql(query: str, variables=None) -> Dict[str, Any]:
#     headers = {"Content-Type": "application/json"}
#     if DATAHUB_TOKEN:
#         headers["Authorization"] = f"Bearer {DATAHUB_TOKEN}"
#     payload = {"query": query}
#     if variables is not None:
#         payload["variables"] = variables
#     resp = requests.post(DATAHUB_GRAPHQL_URL, json=payload, headers=headers, timeout=60)
#     resp.raise_for_status()
#     data = resp.json()
#     if "errors" in data:
#         raise RuntimeError(f"GraphQL errors: {data['errors']}")
#     return data["data"]

def graphql(query: str, variables=None) -> Dict[str, Any]:
    """GraphQL client with nginx-proxy fallback to direct GMS"""
    headers = {"Content-Type": "application/json"}
    if DATAHUB_TOKEN:
        headers["Authorization"] = f"Bearer {DATAHUB_TOKEN}"
    
    payload = {"query": query}
    if variables is not None:
        payload["variables"] = variables
    
    # Try nginx-proxy first
    urls_to_try = [DATAHUB_GRAPHQL_URL]
    if DATAHUB_GRAPHQL_URL != DATAHUB_GMS_URL:
        urls_to_try.append(f"{DATAHUB_GMS_URL}/api/graphql")
    
    for url in urls_to_try:
        try:
            logger.info(f"Trying GraphQL at {url}")
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            if "errors" in data:
                logger.warning(f"GraphQL errors at {url}: {data['errors']}")
                continue
            logger.info(f"GraphQL success from {url}")
            return data["data"]
        except Exception as e:
            logger.warning(f"Failed {url}: {e}")
            continue
    
    raise RuntimeError(f"All GraphQL endpoints failed: {urls_to_try}")


def pg_conn():
    return psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        dbname=PG_DB,
        user=PG_USER,
        password=PG_PASS,
    )

def to_ts(millis):
    if millis is None:
        return None
    return datetime.fromtimestamp(millis / 1000.0, tz=timezone.utc)

# ---------- GraphQL Queries (unchanged) ----------
DATA_CATALOG_QUERY = """
query DataCatalog($start: Int!, $count: Int!) {
  search(input: {
    type: DATASET
    query: "*"
    start: $start
    count: $count
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
          platform {
            urn
            name
          }
          tags {
            tags {
              tag {
                urn
                properties {
                  name
                  colorHex
                  description
                }
              }
            }
          }
          domain {
            domain {
              urn

            }
          }
        }
      }
    }
  }
}
"""

DATASET_SCHEMA_QUERY = """
query IngestionFromParticularTable($urn: String!) {
  dataset(urn: $urn) {
    urn
    schemaMetadata {
      fields {
        fieldPath
        nativeDataType
        description
        nullable
        isPartOfKey
        label
      }
    }
  }
}
"""

LIST_DOMAINS_QUERY = """
query listAllDomains {
  listDomains(input: { start: 0, count: 100 }) {
    total
    domains {
      urn
      id
      ownership {
        owners {
          owner {
            ... on CorpUser {
              username
            }
          }
        }
      }
      properties {
        name
        description
        createdOn {
          actor {
            username
          }
        }
      }
    }
  }
}
"""

LIST_TAGS_QUERY = """
query ListAllTags {
  searchAcrossEntities(
    input: {
      types: [TAG]
      query: ""
      start: 0
      count: 100
    }
  ) {
    total
    searchResults {
      entity {
        urn
        ... on Tag {
          name
          description
          properties {
            description
            colorHex
          }
        }
      }
    }
  }
}
"""

LIST_GLOSSARY_TERMS_QUERY = """
query SearchGlossaryTerms {
  searchAcrossEntities(
    input: {
      types: [GLOSSARY_TERM]
      query: "*"
      start: 0
      count: 100
    }
  ) {
    total
    searchResults {
      entity {
        ... on GlossaryTerm {
          urn
          name
          glossaryTermInfo {
            definition
          }
        }
      }
    }
  }
}
"""

LIST_INGESTION_SOURCES_QUERY = """
query ListAllIngestionSources {
  listIngestionSources(input: { start: 0, count: 100 }) {
    start
    count
    total
    ingestionSources {
      urn
      name
      type
      config {
        recipe
      }
      schedule {
        interval
        timezone
      }
    }
  }
}
"""


# ---------- Sync Implementation ----------

def sync_domains(cur):
    data = graphql(LIST_DOMAINS_QUERY)
    domains = data["listDomains"]["domains"]
    
    cur.execute("TRUNCATE TABLE dh_domain RESTART IDENTITY;")
    rows = []
    for d in domains:
        urn = d["urn"]
        dom_id = d.get("id")
        props = d.get("properties") or {}
        name = props.get("name")
        description = props.get("description")
        created_actor = None
        created_on = props.get("createdOn")
        if created_on and created_on.get("actor"):
            created_actor = created_on["actor"].get("username")
        rows.append((urn, dom_id, name, None, description, created_actor, None, False))
    
    cur.executemany(
        """
        INSERT INTO dh_domain (
          urn, domain_id, name, display_name, description,
          created_actor, created_at, is_soft_deleted
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        rows,
    )
    logger.info(f"Synced {len(rows)} domains")

def sync_tags(cur):
    data = graphql(LIST_TAGS_QUERY)
    results = data["searchAcrossEntities"]["searchResults"]
    
    cur.execute("TRUNCATE TABLE dh_tag RESTART IDENTITY;")
    cur.execute("TRUNCATE TABLE dh_entity_tag RESTART IDENTITY;")
    rows = []
    for r in results:
        e = r["entity"]
        urn = e["urn"]
        name = e.get("name")
        desc = e.get("description") or (e.get("properties") or {}).get("description")
        color = (e.get("properties") or {}).get("colorHex")
        rows.append((urn, name, desc, color))
    
    cur.executemany(
        "INSERT INTO dh_tag (urn, name, description, color_hex) VALUES (%s,%s,%s,%s)",
        rows,
    )
    logger.info(f"Synced {len(rows)} tags")

def sync_glossary_terms(cur):
    data = graphql(LIST_GLOSSARY_TERMS_QUERY)
    results = data["searchAcrossEntities"]["searchResults"]
    
    cur.execute("TRUNCATE TABLE dh_glossary_term RESTART IDENTITY;")
    rows = []
    for r in results:
        e = r["entity"]
        urn = e["urn"]
        name = e["name"]
        info = e.get("glossaryTermInfo") or {}
        definition = info.get("definition")
        rows.append((urn, name, None, definition, None, False))
    
    cur.executemany(
        """
        INSERT INTO dh_glossary_term (
          urn, name, display_name, description, parent_urn, deprecated
        )
        VALUES (%s,%s,%s,%s,%s,%s)
        """,
        rows,
    )
    logger.info(f"Synced {len(rows)} glossary terms")

def sync_ingestion_sources(cur):
    data = graphql(LIST_INGESTION_SOURCES_QUERY)
    sources = data["listIngestionSources"]["ingestionSources"]
    
    cur.execute("TRUNCATE TABLE dh_ingestion_source RESTART IDENTITY;")
    rows = []
    for s in sources:
        urn = s["urn"]
        name = s["name"]
        type_ = s["type"]
        executor_id = s.get("executorId")  # This might be None now
        config = s.get("config") or {}
        recipe = config.get("recipe")
        config_json = json.dumps({"recipe": recipe}) if recipe else None
        sched = s.get("schedule") or {}
        interval = sched.get("interval")
        timezone = sched.get("timezone")
        rows.append(
            (urn, name, type_, executor_id, config_json, interval, timezone, None, None)
        )
    
    cur.executemany(
        """
        INSERT INTO dh_ingestion_source (
          urn, name, type, executor_id,
          config_json, schedule_interval, schedule_timezone,
          created_at, updated_at
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        rows,
    )
    logger.info(f"Synced {len(rows)} ingestion sources")

def sync_datasets_and_fields(cur, page_size=100):
    start = 0
    total = None
    all_dataset_rows = []
    all_field_rows = []
    all_tag_rows = []

    cur.execute("TRUNCATE TABLE dh_dataset_field RESTART IDENTITY;")
    cur.execute("TRUNCATE TABLE dh_dataset RESTART IDENTITY;")
    cur.execute("TRUNCATE TABLE dh_entity_tag RESTART IDENTITY;")

    while True:
        data = graphql(DATA_CATALOG_QUERY, {"start": start, "count": page_size})
        search = data["search"]
        if total is None:
            total = search["total"]
        results = search["searchResults"]

        if not results:
            break

        page_dataset_rows = []
        page_field_rows = []
        page_tag_rows = []

        for r in results:
            ds = r["entity"]
            if ds is None:
                continue
            urn = ds["urn"]
            name = ds["name"]
            props = ds.get("properties") or {}
            desc = props.get("description")
            created_at = to_ts(props.get("created"))
            created_actor = props.get("createdActor")
            last_modified_at = to_ts((props.get("lastModified") or {}).get("time"))
            platform = ds.get("platform") or {}
            platform_urn = platform.get("urn")
            platform_name = platform.get("name")
            domain = (ds.get("domain") or {}).get("domain") or {}
            domain_urn = domain.get("urn")
            # domain_name = (domain.get("properties") or {}).get("name")

            page_dataset_rows.append(
                (
                    urn,
                    platform_urn,
                    platform_name,
                    name,
                    None,
                    desc,
                    domain_urn,
                    created_at,
                    created_actor,
                    last_modified_at,
                    None,
                    False,
                )
            )

            # tags on dataset
            tag_container = ds.get("tags") or {}
            for t in tag_container.get("tags") or []:
                tag_entity = t.get("tag")
                if not tag_entity:
                    continue
                tag_urn = tag_entity["urn"]
                page_tag_rows.append((urn, tag_urn, None))

            # fetch schema for this dataset
            schema_data = graphql(DATASET_SCHEMA_QUERY, {"urn": urn})
            schema = (schema_data.get("dataset") or {}).get("schemaMetadata") or {}
            for f in schema.get("fields") or []:
                page_field_rows.append(
                    (
                        urn,
                        f["fieldPath"],
                        f.get("nativeDataType"),
                        f.get("description"),
                        f.get("nullable"),
                        f.get("isPartOfKey", False),
                        f.get("label"),
                        False,
                    )
                )

        all_dataset_rows.extend(page_dataset_rows)
        all_field_rows.extend(page_field_rows)
        all_tag_rows.extend(page_tag_rows)

        start += page_size
        if start >= total:
            break

    # Bulk insert all pages at once
    if all_dataset_rows:
        cur.executemany(
            """
            INSERT INTO dh_dataset (
              urn, platform_urn, platform_name, name, full_name,
              description, domain_urn, 
              created_at, created_actor, last_modified_at,
              glossary_summary, is_soft_deleted
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            all_dataset_rows,
        )
        logger.info(f"Synced {len(all_dataset_rows)} datasets")

    if all_field_rows:
        cur.executemany(
            """
            INSERT INTO dh_dataset_field (
              dataset_urn, field_path, native_data_type,
              description, nullable, is_primary_key,
              label, is_partition_key
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            all_field_rows,
        )
        logger.info(f"Synced {len(all_field_rows)} dataset fields")

    if all_tag_rows:
        cur.executemany(
            """
            INSERT INTO dh_entity_tag (entity_urn, tag_urn, subresource)
            VALUES (%s,%s,%s)
            ON CONFLICT (entity_urn, tag_urn, subresource) DO NOTHING
            """,
            all_tag_rows,
        )
        logger.info(f"Synced {len(all_tag_rows)} dataset tags")

# ---------- Main Sync Function ----------

def run_full_sync():
    """Execute complete semantic sync with truncate + reload"""
    global sync_status
    sync_status["status"] = "running"
    sync_status["error"] = None
    
    start_time = datetime.now()
    logger.info("Starting full semantic sync...")
    
    try:
        conn = pg_conn()
        conn.autocommit = False
        cur = conn.cursor()
        
        # Sync in dependency order
        sync_domains(cur)
        sync_tags(cur)
        sync_glossary_terms(cur)
        sync_ingestion_sources(cur)
        sync_datasets_and_fields(cur)
        
        conn.commit()
        conn.close()
        
        duration = (datetime.now() - start_time).total_seconds()
        sync_status["status"] = "completed"
        sync_status["last_run"] = start_time.isoformat()
        logger.info(f"Full semantic sync completed in {duration:.2f}s")
        
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        sync_status["status"] = "failed"
        sync_status["error"] = str(e)
        raise

# ---------- REST Endpoints ----------
@app.post("/sync")
async def trigger_sync(background_tasks: BackgroundTasks):
    """Trigger full semantic sync (returns immediately, runs in background)"""
    if sync_status["status"] == "running":
        return {
            "message": "Sync already running, check /status",
            "status": "already_running",
            "endpoint": "/status"
        }  # Don't 409, just inform
    
    background_tasks.add_task(run_full_sync)
    return {
        "message": "Sync triggered successfully",
        "status": "queued",
        "endpoint": "/status"
    }

@app.post("/sync/sync")
async def sync_now():
    """Synchronous sync (blocks until complete)"""
    if sync_status["status"] == "running":
        return {
            "message": "Sync already running, check /status", 
            "status": "already_running",
            "current_status": sync_status
        }
    
    try:
        run_full_sync()
        return {
            "message": "Sync completed successfully",
            "status": "completed",
            "last_run": sync_status["last_run"]
        }
    except Exception as e:
        return {
            "message": "Sync failed",
            "status": "failed", 
            "error": str(e),
            "current_status": sync_status
        }, 500

# Add reset endpoint
@app.post("/sync/reset")
async def reset_sync():
    """Reset sync status (for stuck states)"""
    global sync_status
    sync_status = {"last_run": None, "status": "idle", "error": None}
    return {"message": "Sync status reset to idle"}


# ---------- Server Startup ----------
if __name__ == "__main__":
    uvicorn.run(
        "semantic_sync:app",
        host="0.0.0.0",
        port=8001,
        log_level="info",
        reload=False
    )
