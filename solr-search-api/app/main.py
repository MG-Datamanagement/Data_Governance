from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pysolr
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

SOLR_URL = "http://solr:8983/solr/dh_search_core"
solr = pysolr.Solr(SOLR_URL, timeout=5)

app = FastAPI(title="DataHub Solr Search API")

class SearchHit(BaseModel):
    entity_type: str
    urn: str
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    dataset_urn: Optional[str] = None
    field_path: Optional[str] = None

class SearchResult(BaseModel):
    total: int
    hits: List[SearchHit]

@app.get("/search", response_model=SearchResult)
def search(
    q: str = Query(..., description="Search text across datasets, domains, tags, glossary, columns, sources"),
    entity_types: Optional[List[str]] = Query(
        None,
        description="Optional filter: DATASET, DOMAIN, TAG, GLOSSARY_TERM, COLUMN, SOURCE",
    ),
    limit: int = 20,
):
    try:
        filters = []
        if entity_types:
            or_vals = " OR ".join(entity_types)
            filters.append(f"entity_type:({or_vals})")

        params = {
            "q": f"search_text:{q}",
            "rows": limit,
        }
        if filters:
            params["fq"] = filters

        res = solr.search(**params)
        hits: List[SearchHit] = []
        for doc in res.docs:
            hits.append(
                SearchHit(
                    entity_type=doc.get("entity_type"),
                    urn=doc.get("urn"),
                    name=doc.get("name"),
                    display_name=doc.get("display_name"),
                    description=doc.get("description"),
                    dataset_urn=doc.get("dataset_urn"),
                    field_path=doc.get("field_path"),
                )
            )

        return SearchResult(total=res.hits, hits=hits)
    except Exception as e:
        log.exception("Solr search failed")
        raise HTTPException(status_code=500, detail="Solr search failed")
