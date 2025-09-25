import psycopg2
import pysolr
import os
import json

# Your database connection details from docker-compose.yml
# Use environment variables for production, or hardcode for local development
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5434')
DB_USER = os.environ.get('DB_USER', 'metaportal_user')
DB_PASS = os.environ.get('DB_PASS', 'metaportal_pass')
DB_NAME = os.environ.get('DB_NAME', 'meta_portal_db')

# Your Solr connection details
SOLR_URL = os.environ.get('SOLR_URL', 'http://localhost:8983/solr/metaportal_core')

def create_solr_documents():
    """
    Connects to the PostgreSQL database, fetches data, and creates Solr documents.
    """
    conn = None
    cur = None
    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            dbname=DB_NAME
        )
        cur = conn.cursor()

        # The query joins multiple tables to create a single denormalized view
        # suitable for search. It combines tables, columns, domains, and users.
        query = """
        SELECT
            t.urn AS id,
            t.name AS table_name,
            t.description AS table_description,
            t.table_type,
            t.is_certified,
            t.sensitivity_level AS table_sensitivity,
            d.name AS domain_name,
            u.name AS owner_name,
            ARRAY_AGG(DISTINCT c.name) AS column_names,
            ARRAY_AGG(DISTINCT c.description) AS column_descriptions,
            ARRAY_AGG(DISTINCT tg.name) AS tag_names,
            json_agg(DISTINCT jsonb_build_object('name', c.name, 'description', c.description, 'is_pii', c.is_pii, 'data_type', c.data_type)) AS column_details
        FROM tables t
        LEFT JOIN domains d ON t.domain_id = d.id
        LEFT JOIN users u ON t.owner_id = u.id
        LEFT JOIN columns c ON t.id = c.table_id
        LEFT JOIN table_tags tt ON t.id = tt.table_id
        LEFT JOIN tags tg ON tt.tag_id = tg.id
        GROUP BY t.id, t.urn, t.name, t.description, d.name, u.name
        """
        
        cur.execute(query)
        records = cur.fetchall()

        documents = []
        for record in records:
            (id, table_name, table_description, table_type, is_certified, table_sensitivity, domain_name, owner_name, column_names, column_descriptions, tag_names, column_details_json) = record

            column_names_list = list(filter(None, column_names))
            column_descriptions_list = list(filter(None, column_descriptions))
            tag_names_list = list(filter(None, tag_names))

            # Fix for the JSON error: directly handle the JSON string from PostgreSQL.
            # psycopg2's jsonb_build_object returns a dict directly, so json.loads is not needed.
            # The error suggests the data might be coming as a list of dicts.
            # If so, we can convert it to a string representation of a JSON array.
            
            if column_details_json:
                # This assumes column_details_json is a Python list of dicts.
                # We convert it to a single JSON string before passing it to Solr.
                column_details_str = json.dumps(column_details_json)
                column_details_final = json.loads(column_details_str)
            else:
                column_details_final = []

            doc = {
                'id': id,
                'table_name': table_name,
                'table_description': table_description,
                'table_type': table_type,
                'is_certified': is_certified,
                'table_sensitivity': table_sensitivity,
                'domain_name': domain_name,
                'owner_name': owner_name,
                'column_names': column_names_list,
                'column_descriptions': column_descriptions_list,
                'tags': tag_names_list,
                'column_details': column_details_final
            }
            documents.append(doc)
        
        return documents

    except (psycopg2.Error, Exception) as e:
        print(f"Error during database query: {e}")
        return None
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def index_data_to_solr(documents):
    """
    Sends the list of documents to Solr for indexing.
    """
    solr = None
    try:
        solr = pysolr.Solr(SOLR_URL, always_commit=True)
        solr.add(documents)
        print(f"Successfully indexed {len(documents)} documents to Solr.")
        
    except pysolr.SolrError as e:
        print(f"Error indexing to Solr: {e}")
        print("Please ensure your Solr core is running and accessible at the specified URL.")

if __name__ == "__main__":
    print("Starting data indexing process...")
    documents_to_index = create_solr_documents()
    
    if documents_to_index is not None:
        index_data_to_solr(documents_to_index)
    else:
        print("Indexing process failed due to a database error.")