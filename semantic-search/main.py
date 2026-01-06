import os
import time
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from rank_bm25 import BM25Okapi
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="DataHub Semantic Search (BM25+TF-IDF)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Globals
bm25_index = None
tfidf_vectorizer = None
documents = []
doc_metadata = []

def get_pg_conn():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "postgres"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        dbname=os.getenv("POSTGRES_DB", "semantic_search"),
        user=os.getenv("POSTGRES_USER", "semantic_user"),
        password=os.getenv("POSTGRES_PASS", "semantic_pass")
    )

class SearchRequest(BaseModel):
    query: str
    limit: int = 10

class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    total: int
    took_ms: float

@app.get("/health")
async def health():
    return {"status": "healthy", "method": "BM25 + TF-IDF"}

@app.post("/index")
async def index_all_entities():
    global bm25_index, tfidf_vectorizer, documents, doc_metadata
    
    start_time = time.time()
    conn = get_pg_conn()
    cur = conn.cursor()
    
    print("Indexing ALL DataHub entities...")
    
    # Collect ALL entities
    all_entities = []
    
    # 1. DATASETS
    print(" Datasets...")
    cur.execute("""
        SELECT 'dataset' as type, urn, name, COALESCE(description,''), platform_name, COALESCE(domain_urn,'')
        FROM dh_dataset 
        WHERE name IS NOT NULL AND COALESCE(is_soft_deleted, FALSE) = FALSE
    """)
    for row in cur.fetchall():
        all_entities.append(row)
    
    # 2. FIELDS
    print(" Fields...")
    cur.execute("""
        SELECT 'field' as type, d.urn||'::'||df.field_path as urn, df.field_path, 
               COALESCE(df.description,''), d.platform_name, COALESCE(d.domain_urn,'')
        FROM dh_dataset_field df JOIN dh_dataset d ON df.dataset_urn = d.urn
        WHERE df.field_path IS NOT NULL AND d.name IS NOT NULL AND COALESCE(d.is_soft_deleted, FALSE) = FALSE
    """)
    for row in cur.fetchall():
        all_entities.append(row)
    
    # 3. DOMAINS
    print(" Domains...")
    cur.execute("SELECT 'domain' as type, urn, name, COALESCE(description,''), '' as platform, '' as domain FROM dh_domain WHERE name IS NOT NULL")
    for row in cur.fetchall():
        all_entities.append(row)
    
    # 4. TAGS
    print("Tags...")
    cur.execute("SELECT 'tag' as type, urn, name, COALESCE(description,''), '' as platform, '' as domain FROM dh_tag WHERE name IS NOT NULL")
    for row in cur.fetchall():
        all_entities.append(row)
    
    # 5. GLOSSARY TERMS
    print("Glossary...")
    cur.execute("SELECT 'glossary_term' as type, urn, name, COALESCE(description,''), 'glossary' as platform, '' as domain FROM dh_glossary_term WHERE name IS NOT NULL")
    for row in cur.fetchall():
        all_entities.append(row)
    
    # 6. DATA SOURCES
    print("🔌 Data Sources...")
    cur.execute("SELECT 'data_source' as type, urn, name, type||' ingestion source', type as platform, '' as domain FROM dh_ingestion_source WHERE name IS NOT NULL")
    for row in cur.fetchall():
        all_entities.append(row)
    
    # 7. USERS
    print("👥 Users...")
    cur.execute("SELECT 'user' as type, urn, username, '' as description, 'user' as platform, '' as domain FROM dh_user WHERE username IS NOT NULL")
    for row in cur.fetchall():
        all_entities.append(row)
    
    # Build search index
    documents = []
    doc_metadata = []
    tokenized_docs = []
    
    for entity_type, urn, name, desc, platform, domain in all_entities:
        content = f"{name} {desc} {platform} {domain}".lower().strip()
        if len(content.split()) > 1:  # Skip very short
            documents.append(content)
            doc_metadata.append({
                "entity_type": entity_type,
                "urn": urn,
                "name": name,
                "description": desc,
                "platform": platform,
                "domain": domain
            })
            tokenized_docs.append(content.split())
    
    # BM25 (exact match)
    bm25_index = BM25Okapi(tokenized_docs)
    
    # TF-IDF (semantic)
    tfidf_vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
    tfidf_vectorizer.fit(documents)
    
    cur.close()
    conn.close()
    
    took_ms = (time.time() - start_time) * 1000
    print(f"Indexed {len(documents)} entities in {took_ms:.1f}ms")
    
    return {
        "status": "success",
        "indexed": len(documents),
        "took_ms": round(took_ms, 1),
        "entities": {
            "datasets": sum(1 for m in doc_metadata if m["entity_type"] == "dataset"),
            "fields": sum(1 for m in doc_metadata if m["entity_type"] == "field"),
            "domains": sum(1 for m in doc_metadata if m["entity_type"] == "domain"),
            "tags": sum(1 for m in doc_metadata if m["entity_type"] == "tag"),
            "glossary_terms": sum(1 for m in doc_metadata if m["entity_type"] == "glossary_term"),
            "data_sources": sum(1 for m in doc_metadata if m["entity_type"] == "data_source"),
            "users": sum(1 for m in doc_metadata if m["entity_type"] == "user")
        }
    }

@app.post("/search", response_model=SearchResponse)
async def semantic_search(req: SearchRequest):
    global bm25_index, tfidf_vectorizer, documents, doc_metadata
    
    if bm25_index is None:
        await index_all_entities()
    
    start_time = time.time()
    
    # BM25 scores (exact keyword matching)
    tokenized_query = req.query.lower().split()
    bm25_scores = bm25_index.get_scores(tokenized_query)
    bm25_norm = np.array(bm25_scores) / (np.max(bm25_scores) + 1e-8)
    
    # TF-IDF scores (semantic similarity)
    query_vec = tfidf_vectorizer.transform([req.query])
    doc_vecs = tfidf_vectorizer.transform(documents)
    tfidf_scores = cosine_similarity(query_vec, doc_vecs).flatten()
    tfidf_norm = tfidf_scores / (np.max(tfidf_scores) + 1e-8)
    
    # HYBRID: 70% BM25 + 30% TF-IDF (Google-style)
    combined_scores = 0.7 * bm25_norm + 0.3 * tfidf_norm
    
    # Top results
    top_indices = np.argsort(combined_scores)[::-1][:req.limit]
    
    results = []
    for idx in top_indices:
        if idx < len(doc_metadata) and combined_scores[idx] > 0.05:
            meta = doc_metadata[idx]
            results.append({
                "entity_type": meta["entity_type"],
                "urn": meta["urn"],
                "name": meta["name"],
                "description": meta["description"][:200] + "..." if len(meta["description"]) > 200 else meta["description"],
                "platform": meta["platform"],
                "domain": meta["domain"],
                "score": round(float(combined_scores[idx]), 4),
                "bm25_score": round(float(bm25_norm[idx]), 4),
                "tfidf_score": round(float(tfidf_norm[idx]), 4)
            })
    
    took_ms = (time.time() - start_time) * 1000
    return SearchResponse(
        results=results,
        total=len(results),
        took_ms=round(took_ms, 1)
    )

@app.get("/stats")
async def stats():
    if documents:
        return {
            "total_documents": len(documents),
            "method": "BM25 (70%) + TF-IDF (30%)",
            "dimensions": "Sparse (5000 TF-IDF features)"
        }
    return {"status": "index first"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
