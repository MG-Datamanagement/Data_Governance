from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional
import structlog

from ...core.database import get_db
from ...core.security import get_current_user
from ...core.dependencies import PaginationParams
from ...models.table import Table, DataSource, Domain
from ...models.user import User
from ...schemas.common import SearchResponse, SearchSuggestionsResponse, SearchSuggestion
from ...schemas.table import TableResponse
from ...models.tagging import Tag

logger = structlog.get_logger()
router = APIRouter()


@router.get("", response_model=SearchResponse[TableResponse])
async def search_tables(
    q: Optional[str] = Query(None, description="Search query"),
    domain_ids: Optional[list[int]] = Query(None, description="Filter by domain IDs"),
    data_source_ids: Optional[list[int]] = Query(None, description="Filter by data source IDs"),
    owner_ids: Optional[list[int]] = Query(None, description="Filter by owner IDs"),
    sensitivity_levels: Optional[list[str]] = Query(None, description="Filter by sensitivity levels"),
    is_certified: Optional[bool] = Query(None, description="Filter by certification status"),
    pagination: PaginationParams = Depends(PaginationParams),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Search tables with advanced filtering."""
    try:
        import time
        start_time = time.time()
        
        query = db.query(Table).filter(Table.is_active == True)
        
        # Apply text search
        if q:
            search_filter = or_(
                Table.name.ilike(f"%{q}%"),
                Table.description.ilike(f"%{q}%"),
                Table.schema_name.ilike(f"%{q}%"),
                Table.domain.has(Domain.name.ilike(f"%{q}%")),
                Table.tags.any(Tag.name.ilike(f"%{q}%"))
            )
            query = query.filter(search_filter)
        
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
        
        # Count total results
        total = query.count()
        
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
                            "is_system_tag": tag_link.tag.is_system_tag, # Add the missing field
                            "is_active": tag_link.tag.is_active,         # Add the missing field
                            "created_at": tag_link.tag.created_at,       # Add the missing field
                            "updated_at": tag_link.tag.updated_at        # Add the missing field
                    # Add any other required fields from your Pydantic model
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
                data_source_name=table.data_source.name,
                data_source_type=table.data_source.type,
                domain_id=table.domain_id,
                domain_name=table.domain.name if table.domain else None,
                owner_id=table.owner_id,
                owner_name=table.owner.name if table.owner else None,
                created_at=table.created_at,
                updated_at=table.updated_at,
                last_schema_check_at=table.last_schema_check_at,
                row_count=table.stats.row_count if table.stats else None,
                size_bytes=table.stats.size_bytes if table.stats else None,
                column_count=len(table.columns),
                query_count_last_30d=table.stats.query_count_last_30d if table.stats else 0,
                unique_users_last_30d=table.stats.unique_users_last_30d if table.stats else 0,
                tags=tags_list
            )
            table_responses.append(table_response)
        
        # Calculate search time
        search_time_ms = int((time.time() - start_time) * 1000)
        
        # Prepare filters applied
        filters_applied = {}
        if domain_ids:
            filters_applied["domain_ids"] = domain_ids
        if data_source_ids:
            filters_applied["data_source_ids"] = data_source_ids
        if owner_ids:
            filters_applied["owner_ids"] = owner_ids
        if sensitivity_levels:
            filters_applied["sensitivity_levels"] = sensitivity_levels
        if is_certified is not None:
            filters_applied["is_certified"] = is_certified
        
        has_next = (pagination.offset + pagination.size) < total
        
        return SearchResponse(
            results=table_responses,
            total=total,
            page=pagination.page,
            size=pagination.size,
            has_next=has_next,
            query=q,
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
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get search suggestions based on partial query."""
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
                type="table",
                category="Tables",
                score=0.9
            ))
        
        # Data source suggestions
        data_sources = db.query(DataSource).filter(
            and_(
                DataSource.is_active == True,
                DataSource.name.ilike(f"%{q}%")
            )
        ).limit(3).all()
        
        for ds in data_sources:
            suggestions.append(SearchSuggestion(
                text=ds.name,
                type="data_source",
                category="Data Sources",
                score=0.8
            ))
        
        # Domain suggestions
        domains = db.query(Domain).filter(
            Domain.name.ilike(f"%{q}%")
        ).limit(3).all()
        
        for domain in domains:
            suggestions.append(SearchSuggestion(
                text=domain.name,
                type="domain",
                category="Domains",
                score=0.7
            ))
        
        # Owner suggestions
        owners = db.query(User).filter(
            and_(
                User.is_active == True,
                User.name.ilike(f"%{q}%")
            )
        ).limit(3).all()
        
        for owner in owners:
            suggestions.append(SearchSuggestion(
                text=owner.name,
                type="owner",
                category="Owners",
                score=0.6
            ))
        
        # Sort by score
        suggestions.sort(key=lambda x: x.score, reverse=True)
        
        return SearchSuggestionsResponse(
            suggestions=suggestions[:10],  # Limit to top 10
            query=q
        )
        
    except Exception as e:
        logger.error("Failed to get suggestions", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get suggestions"
        )