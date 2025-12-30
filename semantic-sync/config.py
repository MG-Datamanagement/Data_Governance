# semantic-sync/config.py
import os

# Try nginx-proxy first, fallback to direct GMS
DATAHUB_GRAPHQL_URL = os.getenv(
    "DATAHUB_GRAPHQL_URL", 
    "http://nginx-proxy/graphql"  # Fixed nginx path
)
DATAHUB_GMS_URL = "http://datahub-gms:8080"  # Direct fallback
DATAHUB_TOKEN = os.getenv("DATAHUB_TOKEN", "")  # if auth disabled, keep empty

PG_HOST = os.getenv("PG_HOST", "postgres")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB   = os.getenv("PG_DB", "semantic_search")
PG_USER = os.getenv("PG_USER", "semantic_user")
PG_PASS = os.getenv("PG_PASS", "semantic_pass")
