import logging
import pysolr
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.table import Table, DataSource, Domain
from app.models.user import User
from app.models.tagging import Tag

# --- Configuration ---
DATABASE_URL = "postgresql://metaportal_user:metaportal_pass@localhost:5434/metaportal_db"
SOLR_URL = "http://localhost:8983/solr/suggestions_core"

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Connections ---
# Setup Solr connection
solr = pysolr.Solr(SOLR_URL, always_commit=True)

# Setup database connection
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def index_data():
    """
    Fetches data from PostgreSQL and indexes it into Solr.
    """
    db = SessionLocal()
    try:
        logger.info("Starting indexing process from PostgreSQL to Solr.")

        # First, clear the existing Solr index to avoid duplicates
        logger.info("Clearing existing Solr index...")
        solr.delete(q='*:*')
        logger.info("Index cleared.")

        solr_docs = []

        # 1. Index Tables
        logger.info("Fetching Tables...")
        tables = db.query(Table).filter(Table.is_active == True).all()
        for table in tables:
            solr_docs.append({
                "id": f"table_{table.id}", # Create a unique ID for Solr
                "display_text": table.name,
                "doc_type": "Tables",
                "source_id": table.id
            })

        # 2. Index Data Sources
        logger.info("Fetching Data Sources...")
        data_sources = db.query(DataSource).filter(DataSource.is_active == True).all()
        for ds in data_sources:
            solr_docs.append({
                "id": f"ds_{ds.id}",
                "display_text": ds.name,
                "doc_type": "Data Sources",
                "source_id": ds.id
            })

        # 3. Index Domains
        logger.info("Fetching Domains...")
        domains = db.query(Domain).all()
        for domain in domains:
            solr_docs.append({
                "id": f"domain_{domain.id}",
                "display_text": domain.name,
                "doc_type": "Domains",
                "source_id": domain.id
            })

        # 4. Index Tags
        logger.info("Fetching Tags...")
        tags = db.query(Tag).all()
        for tag in tags:
            solr_docs.append({
                "id": f"tag_{tag.id}",
                "display_text": tag.name,
                "doc_type": "Tags",
                "source_id": tag.id
            })
            
        # 5. Index Owners (Users)
        logger.info("Fetching Owners...")
        owners = db.query(User).filter(User.is_active == True).all()
        for owner in owners:
            solr_docs.append({
                "id": f"owner_{owner.id}",
                "display_text": owner.name,
                "doc_type": "Owners",
                "source_id": owner.id
            })

        # Add all documents to Solr
        if solr_docs:
            logger.info(f"Adding {len(solr_docs)} documents to the Solr index.")
            solr.add(solr_docs)
            logger.info("Indexing complete!")
        else:
            logger.warning("No documents found to index.")

    except Exception as e:
        logger.error(f"An error occurred during indexing: {e}", exc_info=True)
    finally:
        db.close()

if __name__ == "__main__":
    # This allows you to run the script from the command line
    index_data()
