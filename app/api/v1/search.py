from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional
import structlog
import time
import pysolr
import logging
from datetime import datetime
import json

from ...core.database import get_db
from ...core.security import get_current_user
from ...core.dependencies import PaginationParams

from ...models.table import Table, DataSource, Domain
from ...models.user import User
from ...models.tagging import Tag, TableTag 
from ...schemas.common import SearchResponse, SearchSuggestionsResponse, SearchSuggestion
from ...schemas.table import TableResponse

# Solr configuration
SOLR_URL = "http://localhost:8983/solr/suggestions_core"

logger = structlog.get_logger()
router = APIRouter()

# Initialize Solr connection
try:
    solr = pysolr.Solr(SOLR_URL, timeout=10)
    logger.info("Solr connection initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Solr connection: {e}")
    solr = None


@router.get("", response_model=SearchResponse[TableResponse])
async def search_tables(
    q: Optional[str] = Query(None, description="Search query"),
    domain_ids: Optional[list[int]] = Query(None, description="Filter by domain IDs"),
    data_source_ids: Optional[list[int]] = Query(None, description="Filter by data source IDs"),
    owner_ids: Optional[list[int]] = Query(None, description="Filter by owner IDs"),
    sensitivity_levels: Optional[list[str]] = Query(None, description="Filter by sensitivity levels"),
    is_certified: Optional[bool] = Query(None, description="Filter by certification status"),
    pagination: PaginationParams = Depends(PaginationParams),
    db: Session = Depends(get_db)
):
    """Search tables with advanced filtering."""
    try:
        start_time = time.time()
        
        # Base query to filter only active tables
        query = db.query(Table).filter(Table.is_active == True)
        
        # Determine which fields matched the query
        query_fields = []
        
        # Apply text search
        if q:
            # We'll build the final query by joining the necessary tables
            query = query.join(Domain, isouter=True)
            # Corrected join: use TableTag instead of TableTagLink
            query = query.join(TableTag, isouter=True).join(Tag, isouter=True)
            
            # Use a single filter for all search fields
            search_filter = or_(
                Table.name.ilike(f"%{q}%"),
                Table.schema_name.ilike(f"%{q}%"),
                Table.description.ilike(f"%{q}%"),
                Domain.name.ilike(f"%{q}%"),
                Tag.name.ilike(f"%{q}%")
            )
            query = query.filter(search_filter)

            # Check which fields match the query to populate 'query_fields'
            if db.query(Table.id).filter(Table.name.ilike(f"%{q}%")).first():
                query_fields.append("table_name")
            if db.query(Table.id).filter(Table.schema_name.ilike(f"%{q}%")).first():
                query_fields.append("schema_name")
            if db.query(Table.id).filter(Table.description.ilike(f"%{q}%")).first():
                query_fields.append("description")
            if db.query(Domain.id).filter(Domain.name.ilike(f"%{q}%")).first():
                query_fields.append("domain")
            if db.query(Tag.id).filter(Tag.name.ilike(f"%{q}%")).first():
                query_fields.append("tag")
        
        # Apply filters
        if domain_ids:
            query = query.filter(Table.domain_id.in_(domain_ids))
        
        if data_source_ids:
            query = query.filter(Table.data_source_id.in_(data_source_ids))
        
        if owner_ids:
            query = query.filter(Table.owner_id.in_(owner_ids))
        
        if sensitivity_levels:
            query = query.filter(Table.sensitivity_level.in_(sensitivity_levels))
        
        if is_certified is not None:
            query = query.filter(Table.is_certified == is_certified)
        
        # Count total results (use distinct tables to avoid double counting from joins)
        total = query.group_by(Table.id).count()
        
        # Apply pagination and ordering
        tables = query.order_by(Table.updated_at.desc()).offset(pagination.offset).limit(pagination.size).all()
        
        # Convert to response models
        table_responses = []
        for table in tables:
            tags_list = []
            if table.tags:
                for tag_link in table.tags:
                    if tag_link.tag:
                        tags_list.append({
                            "id": tag_link.tag.id,
                            "name": tag_link.tag.name,
                            "is_system_tag": tag_link.tag.is_system_tag,
                            "is_active": tag_link.tag.is_active,
                            "created_at": tag_link.tag.created_at,
                            "updated_at": tag_link.tag.updated_at
                        })
            
            table_response = TableResponse(
                id=table.id,
                name=table.name,
                schema_name=table.schema_name,
                description=table.description,
                table_type=table.table_type,
                sensitivity_level=table.sensitivity_level,
                is_active=table.is_active,
                is_certified=table.is_certified,
                certification_notes=table.certification_notes,
                data_source_id=table.data_source_id,
                data_source_name=table.data_source.name if table.data_source else None,
                data_source_type=table.data_source.type if table.data_source else None,
                domain_id=table.domain_id,
                domain_name=table.domain.name if table.domain else None,
                owner_id=table.owner_id,
                owner_name=table.owner.name if table.owner else None,
                created_at=table.created_at,
                updated_at=table.updated_at,
                last_schema_check_at=table.last_schema_check_at,
                row_count=table.stats.row_count if table.stats else None,
                size_bytes=table.stats.size_bytes if table.stats else None,
                column_count=len(table.columns) if table.columns else 0,
                query_count_last_30d=table.stats.query_count_last_30d if table.stats else 0,
                unique_users_last_30d=table.stats.unique_users_last_30d if table.stats else 0,
                tags=tags_list
            )
            table_responses.append(table_response)
        
        # Calculate search time
        search_time_ms = int((time.time() - start_time) * 1000)
        
        # Prepare filters applied
        filters_applied = {
            "domain_ids": domain_ids,
            "data_source_ids": data_source_ids,
            "owner_ids": owner_ids,
            "sensitivity_levels": sensitivity_levels,
            "is_certified": is_certified
        }
        
        has_next = (pagination.offset + pagination.size) < total
        
        return SearchResponse(
            results=table_responses,
            total=total,
            page=pagination.page,
            size=pagination.size,
            has_next=has_next,
            query=q,
            query_fields=query_fields,
            filters_applied=filters_applied,
            search_time_ms=search_time_ms
        )
        
    except Exception as e:
        logger.error("Search failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )


@router.get("/suggestions", response_model=SearchSuggestionsResponse)
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Partial search query"),
    db: Session = Depends(get_db)
):
    """Get search suggestions from Solr based on partial query."""
    
    # Use Solr if available, otherwise fall back to database search
    if solr is not None:
        try:
            # Perform wildcard search on the analyzed text field
            search_query = f'search_text:{q}*'
            
            # Search Solr with relevance scoring
            results = solr.search(q=search_query, rows=10)
            
            suggestions = []
            for doc in results.docs:
                suggestions.append(SearchSuggestion(
                    text=doc.get('display_text', ''),
                    id=doc.get('source_id', 0),
                    type=doc.get('doc_type', 'unknown').lower().replace(" ", "_"),
                    category=doc.get('doc_type', 'Unknown'),
                    score=doc.get('score', 0.0)  # Real relevance score from Solr
                ))
            
            return SearchSuggestionsResponse(
                suggestions=suggestions,
                query=q
            )
            
        except pysolr.SolrError as e:
            logger.error("Solr query failed, falling back to database", error=str(e))
            # Fall through to database implementation
        except Exception as e:
            logger.error("Failed to get suggestions from Solr, falling back to database", error=str(e))
            # Fall through to database implementation
    
    # Database fallback implementation
    try:
        suggestions = []
        
        # Table name suggestions
        tables = db.query(Table).filter(
            and_(
                Table.is_active == True,
                Table.name.ilike(f"%{q}%")
            )
        ).limit(5).all()
        
        for table in tables:
            suggestions.append(SearchSuggestion(
                text=table.name,
                id=table.id,
                type="catalog",
                category="Tables",
                score=0.9
            ))
        
        # Domain suggestions
        domains = db.query(Domain).filter(
            Domain.name.ilike(f"%{q}%")
        ).limit(3).all()
        
        for domain in domains:
            suggestions.append(SearchSuggestion(
                text=domain.name,
                id=domain.id,
                type="domains",
                category="Domains",
                score=0.7
            ))
        
        # Tag suggestions
        tags = db.query(Tag).filter(
            Tag.name.ilike(f"%{q}%")
        ).limit(3).all()
        
        for tag in tags:
            suggestions.append(SearchSuggestion(
                text=tag.name,
                id=tag.id,
                type="tags",
                category="Tags",
                score=0.7
            ))
        
        
        # Sort by score
        suggestions.sort(key=lambda x: x.score, reverse=True)
        
        return SearchSuggestionsResponse(
            suggestions=suggestions[:10],  # Limit to top 10
            query=q
        )
        
    except Exception as e:
        logger.error("Failed to get suggestions from database", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get suggestions"
        )









# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlalchemy.orm import Session
# from sqlalchemy import or_, and_
# from typing import Optional
# import structlog
# import time

# from ...core.database import get_db
# from ...core.security import get_current_user
# from ...core.dependencies import PaginationParams

# from ...models.table import Table, DataSource, Domain
# from ...models.user import User
# from ...models.tagging import Tag, TableTag 
# from ...schemas.common import SearchResponse, SearchSuggestionsResponse, SearchSuggestion
# from ...schemas.table import TableResponse


# logger = structlog.get_logger()
# router = APIRouter()


# @router.get("", response_model=SearchResponse[TableResponse])
# async def search_tables(
#     q: Optional[str] = Query(None, description="Search query"),
#     domain_ids: Optional[list[int]] = Query(None, description="Filter by domain IDs"),
#     data_source_ids: Optional[list[int]] = Query(None, description="Filter by data source IDs"),
#     owner_ids: Optional[list[int]] = Query(None, description="Filter by owner IDs"),
#     sensitivity_levels: Optional[list[str]] = Query(None, description="Filter by sensitivity levels"),
#     is_certified: Optional[bool] = Query(None, description="Filter by certification status"),
#     pagination: PaginationParams = Depends(PaginationParams),
#     db: Session = Depends(get_db)
# ):
#     """Search tables with advanced filtering."""
#     try:
#         start_time = time.time()
        
#         # Base query to filter only active tables
#         query = db.query(Table).filter(Table.is_active == True)
        
#         # Determine which fields matched the query
#         query_fields = []
        
#         # Apply text search
#         if q:
#             # We'll build the final query by joining the necessary tables
#             query = query.join(Domain, isouter=True)
#             # Corrected join: use TableTag instead of TableTagLink
#             query = query.join(TableTag, isouter=True).join(Tag, isouter=True)
            
#             # Use a single filter for all search fields
#             search_filter = or_(
#                 Table.name.ilike(f"%{q}%"),
#                 Table.schema_name.ilike(f"%{q}%"),
#                 Table.description.ilike(f"%{q}%"),
#                 Domain.name.ilike(f"%{q}%"),
#                 Tag.name.ilike(f"%{q}%")
#             )
#             query = query.filter(search_filter)

#             # Check which fields match the query to populate 'query_fields'
#             if db.query(Table.id).filter(Table.name.ilike(f"%{q}%")).first():
#                 query_fields.append("table_name")
#             if db.query(Table.id).filter(Table.schema_name.ilike(f"%{q}%")).first():
#                 query_fields.append("schema_name")
#             if db.query(Table.id).filter(Table.description.ilike(f"%{q}%")).first():
#                 query_fields.append("description")
#             if db.query(Domain.id).filter(Domain.name.ilike(f"%{q}%")).first():
#                 query_fields.append("domain")
#             if db.query(Tag.id).filter(Tag.name.ilike(f"%{q}%")).first():
#                 query_fields.append("tag")
        
#         # Apply filters
#         if domain_ids:
#             query = query.filter(Table.domain_id.in_(domain_ids))
        
#         if data_source_ids:
#             query = query.filter(Table.data_source_id.in_(data_source_ids))
        
#         if owner_ids:
#             query = query.filter(Table.owner_id.in_(owner_ids))
        
#         if sensitivity_levels:
#             query = query.filter(Table.sensitivity_level.in_(sensitivity_levels))
        
#         if is_certified is not None:
#             query = query.filter(Table.is_certified == is_certified)
        
#         # Count total results (use distinct tables to avoid double counting from joins)
#         total = query.group_by(Table.id).count()
        
#         # Apply pagination and ordering
#         tables = query.order_by(Table.updated_at.desc()).offset(pagination.offset).limit(pagination.size).all()
        
#         # Convert to response models
#         table_responses = []
#         for table in tables:
#             tags_list = []
#             if table.tags:
#                 for tag_link in table.tags:
#                     if tag_link.tag:
#                         tags_list.append({
#                             "id": tag_link.tag.id,
#                             "name": tag_link.tag.name,
#                             "is_system_tag": tag_link.tag.is_system_tag,
#                             "is_active": tag_link.tag.is_active,
#                             "created_at": tag_link.tag.created_at,
#                             "updated_at": tag_link.tag.updated_at
#                         })
            
#             table_response = TableResponse(
#                 id=table.id,
#                 name=table.name,
#                 schema_name=table.schema_name,
#                 description=table.description,
#                 table_type=table.table_type,
#                 sensitivity_level=table.sensitivity_level,
#                 is_active=table.is_active,
#                 is_certified=table.is_certified,
#                 certification_notes=table.certification_notes,
#                 data_source_id=table.data_source_id,
#                 data_source_name=table.data_source.name if table.data_source else None,
#                 data_source_type=table.data_source.type if table.data_source else None,
#                 domain_id=table.domain_id,
#                 domain_name=table.domain.name if table.domain else None,
#                 owner_id=table.owner_id,
#                 owner_name=table.owner.name if table.owner else None,
#                 created_at=table.created_at,
#                 updated_at=table.updated_at,
#                 last_schema_check_at=table.last_schema_check_at,
#                 row_count=table.stats.row_count if table.stats else None,
#                 size_bytes=table.stats.size_bytes if table.stats else None,
#                 column_count=len(table.columns) if table.columns else 0,
#                 query_count_last_30d=table.stats.query_count_last_30d if table.stats else 0,
#                 unique_users_last_30d=table.stats.unique_users_last_30d if table.stats else 0,
#                 tags=tags_list
#             )
#             table_responses.append(table_response)
        
#         # Calculate search time
#         search_time_ms = int((time.time() - start_time) * 1000)
        
#         # Prepare filters applied
#         filters_applied = {
#             "domain_ids": domain_ids,
#             "data_source_ids": data_source_ids,
#             "owner_ids": owner_ids,
#             "sensitivity_levels": sensitivity_levels,
#             "is_certified": is_certified
#         }
        
#         has_next = (pagination.offset + pagination.size) < total
        
#         return SearchResponse(
#             results=table_responses,
#             total=total,
#             page=pagination.page,
#             size=pagination.size,
#             has_next=has_next,
#             query=q,
#             query_fields=query_fields,
#             filters_applied=filters_applied,
#             search_time_ms=search_time_ms
#         )
        
#     except Exception as e:
#         logger.error("Search failed", error=str(e), exc_info=True)
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Search failed"
#         )


# @router.get("/suggestions", response_model=SearchSuggestionsResponse)
# async def get_search_suggestions(
#     q: str = Query(..., min_length=1, description="Partial search query"),
#     db: Session = Depends(get_db)
# ):
#     """Get search suggestions based on partial query."""
#     try:
#         suggestions = []
        
#         # Table name suggestions
#         tables = db.query(Table).filter(
#             and_(
#                 Table.is_active == True,
#                 Table.name.ilike(f"%{q}%")
#             )
#         ).limit(5).all()
        
#         for table in tables:
#             suggestions.append(SearchSuggestion(
#                 text=table.name,
#                 id=table.id,
#                 type="catalog",
#                 category="Tables",
#                 score=0.9
#             ))
        
#         # Data source suggestions
#         # data_sources = db.query(DataSource).filter(
#         #     and_(
#         #         DataSource.is_active == True,
#         #         DataSource.name.ilike(f"%{q}%")
#         #     )
#         # ).limit(3).all()
        
#         # for ds in data_sources:
#         #     suggestions.append(SearchSuggestion(
#         #         text=ds.name,
#         #         id=ds.id,
#         #         type="data_source",
#         #         category="Data Sources",
#         #         score=0.8
#         #     ))
        
#         # Domain suggestions
#         domains = db.query(Domain).filter(
#             Domain.name.ilike(f"%{q}%")
#         ).limit(3).all()
        
#         for domain in domains:
#             suggestions.append(SearchSuggestion(
#                 text=domain.name,
#                 id=domain.id,
#                 type="domains",
#                 category="Domains",
#                 score=0.7
#             ))
        
#               # tag suggestions
#         tags = db.query(Tag).filter(
#             Tag.name.ilike(f"%{q}%")
#         ).limit(3).all()
        
#         for tag in tags:
#             suggestions.append(SearchSuggestion(
#                 text=tag.name,
#                 id=tag.id,
#                 type="tags",
#                 category="tags",
#                 score=0.7
#             ))
        
#         # Owner suggestions
#         owners = db.query(User).filter(
#             and_(
#                 User.is_active == True,
#                 User.name.ilike(f"%{q}%")
#             )
#         ).limit(3).all()
        
#         for owner in owners:
#             suggestions.append(SearchSuggestion(
#                 text=owner.name,
#                 id=owner.id,
#                 type="owner",
#                 category="Owners",
#                 score=0.6
#             ))
        
#         # Sort by score
#         suggestions.sort(key=lambda x: x.score, reverse=True)
        
#         return SearchSuggestionsResponse(
#             suggestions=suggestions[:10],  # Limit to top 10
#             query=q
#         )
        
#     except Exception as e:
#         logger.error("Failed to get suggestions", error=str(e), exc_info=True)
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Failed to get suggestions"
#         )