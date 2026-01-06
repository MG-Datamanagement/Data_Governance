import logging
import psycopg2
import pysolr
from contextlib import closing

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

# NOTE: these match your docker-compose Postgres service
PG_DSN = "dbname=semantic_search user=semantic_user password=semantic_pass host=postgres port=5432"
SOLR_URL = "http://solr:8983/solr/dh_search_core"

# Solr client
solr = pysolr.Solr(SOLR_URL, always_commit=True, timeout=10)

def fetchall_dict(cur):
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]

def build_docs_from_db():
    docs = []

    with closing(psycopg2.connect(PG_DSN)) as conn:
        with conn.cursor() as cur:
            # DOMAINS
            cur.execute("""
                SELECT urn, domain_id, name, display_name, description
                FROM dh_domain
                WHERE is_soft_deleted IS FALSE
            """)
            for r in fetchall_dict(cur):
                docs.append({
                    "id": f"domain::{r['urn']}",
                    "entity_type": "DOMAIN",
                    "urn": r["urn"],
                    "name": r["name"],
                    "display_name": r.get("display_name") or r["name"],
                    "description": r.get("description"),
                })

            # DATASETS
            cur.execute("""
                SELECT urn, platform_name, name, full_name, description, domain_urn
                FROM dh_dataset
                WHERE is_soft_deleted IS FALSE
            """)
            for r in fetchall_dict(cur):
                disp = r.get("full_name") or r["name"]
                docs.append({
                    "id": f"dataset::{r['urn']}",
                    "entity_type": "DATASET",
                    "urn": r["urn"],
                    "name": r["name"],
                    "display_name": disp,
                    "description": r.get("description"),
                })

            # COLUMNS
            cur.execute("""
                SELECT dataset_urn, field_path, description, native_data_type
                FROM dh_dataset_field
            """)
            for r in fetchall_dict(cur):
                col_urn = f"{r['dataset_urn']}?field={r['field_path']}"
                name = r["field_path"]
                desc = r.get("description") or r.get("native_data_type")
                docs.append({
                    "id": f"column::{col_urn}",
                    "entity_type": "COLUMN",
                    "urn": col_urn,
                    "name": name,
                    "display_name": name,
                    "description": desc,
                    "dataset_urn": r["dataset_urn"],
                    "field_path": r["field_path"],
                })

            # TAGS
            cur.execute("""
                SELECT urn, name, description
                FROM dh_tag
            """)
            for r in fetchall_dict(cur):
                docs.append({
                    "id": f"tag::{r['urn']}",
                    "entity_type": "TAG",
                    "urn": r["urn"],
                    "name": r["name"],
                    "display_name": r["name"],
                    "description": r.get("description"),
                })

            # GLOSSARY TERMS
            cur.execute("""
                SELECT urn, name, display_name, description
                FROM dh_glossary_term
            """)
            for r in fetchall_dict(cur):
                docs.append({
                    "id": f"glossary_term::{r['urn']}",
                    "entity_type": "GLOSSARY_TERM",
                    "urn": r["urn"],
                    "name": r["name"],
                    "display_name": r.get("display_name") or r["name"],
                    "description": r.get("description"),
                })

            # INGESTION SOURCES (data sources)
            cur.execute("""
                SELECT urn, name, type
                FROM dh_ingestion_source
            """)
            for r in fetchall_dict(cur):
                docs.append({
                    "id": f"source::{r['urn']}",
                    "entity_type": "SOURCE",
                    "urn": r["urn"],
                    "name": r["name"],
                    "display_name": r["name"],
                    "description": r.get("type"),
                })

    return docs

def reindex():
    log.info("Clearing existing Solr index...")
    solr.delete(q="*:*")

    docs = build_docs_from_db()
    if not docs:
        log.warning("No docs to index.")
        return

    log.info("Indexing %d docs into Solr", len(docs))
    batch_size = 500
    for i in range(0, len(docs), batch_size):
        solr.add(docs[i:i+batch_size])
    log.info("Index complete.")

if __name__ == "__main__":
    reindex()

