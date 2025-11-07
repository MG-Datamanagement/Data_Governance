from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
import sqlalchemy
from sqlalchemy.orm import Session
from typing import Optional, List
import structlog
from datetime import datetime
from ...core.database import get_db
from ...core.security import get_current_user, get_optional_user
from ...core.dependencies import PaginationParams, SearchParams, get_search_params
from ...models.table import Table, DataSource, Domain, Column, TableStats
from ...models.user import User, UserFavorite
from ...models.tagging import Tag, TableTag
from ...schemas.table import (
    TableResponse, TableCreate, TableUpdate, TableDetailResponse,
    TableListResponse, TableStatsResponse
)
from ...schemas.common import SuccessResponse, TagResponse
from pydantic import BaseModel
from typing import List
from app.models.table import Table, SensitivityLevelEnum
class BulkTagRequest(BaseModel):
    tag_ids: List[int]

logger = structlog.get_logger()
router = APIRouter()


@router.get("", response_model=TableListResponse)
async def list_tables(
    pagination: PaginationParams = Depends(PaginationParams),
    search: SearchParams = Depends(SearchParams),
    db: Session = Depends(get_db)
):
    """List all tables with pagination and filtering."""
    try:
        query = db.query(Table)
        
        # Apply search filters
        if search.q:
            query = query.filter(
                Table.name.ilike(f"%{search.q}%") |
                Table.description.ilike(f"%{search.q}%")
            )
        
        if search.domain_ids:
            query = query.filter(Table.domain_id.in_(search.domain_ids))
        
        if search.data_source_ids:
            query = query.filter(Table.data_source_id.in_(search.data_source_ids))
        
        if search.owner_ids:
            query = query.filter(Table.owner_id.in_(search.owner_ids))

        if search.tag_ids:
            query = query.join(TableTag).filter(TableTag.tag_id.in_(search.tag_ids))
        
        # Apply sorting
        if search.sort_by == "name":
            query = query.order_by(Table.name.asc() if search.sort_order == "asc" else Table.name.desc())
        elif search.sort_by == "created_at":
            query = query.order_by(Table.created_at.asc() if search.sort_order == "asc" else Table.created_at.desc())
        else:
            query = query.order_by(Table.updated_at.desc())
        
        # Count total
        total = query.count()
        
        # Apply pagination
        tables = query.offset(pagination.offset).limit(pagination.size).all()
        
        # Convert to response models
        table_responses = []
        for table in tables:
            table_response = TableResponse(
                id=table.id,
                urn=table.urn or f"urn:metaportal:dev:table:{table.id}",
                name=table.name,
                schema_name=table.schema_name or "public",
                description=table.description or "",
                table_type=table.table_type or "table",
                sensitivity_level=getattr(table, 'sensitivity_level', SensitivityLevelEnum.INTERNAL),
                is_active=getattr(table, 'is_active', True),
                is_certified=getattr(table, 'is_certified', False),
                certification_notes=getattr(table, 'certification_notes', None),
                
                # Assign flattened fields from related objects
                data_source_id=table.data_source.id if table.data_source else None,
                data_source_name=table.data_source.name if table.data_source else None,
                data_source_type=table.data_source.type if table.data_source else None,
                
                domain_id=table.domain.id if table.domain else None,
                domain_name=table.domain.name if table.domain else None,
                
                owner_id=table.owner.id if table.owner else None,
                owner_name=table.owner.name if table.owner else None,
                
                created_at=table.created_at,
                updated_at=table.updated_at,
                last_schema_check_at=getattr(table, 'last_schema_check_at', None),
                stats=None,
                column_count=len(table.columns) if hasattr(table, 'columns') else 0,
                tags=[]
            )
            table_responses.append(table_response)
        
        has_next = (pagination.offset + pagination.size) < total
        
        return TableListResponse(
            tables=table_responses,
            total=total,
            page=pagination.page,
            size=pagination.size,
            has_next=has_next
        )
        
    except Exception as e:
        logger.error("Failed to list tables", error=str(e), exc_info=True)
        # You can add more specific error handling here if needed
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list tables: {str(e)}"
        )


@router.get("/favorites", response_model=TableListResponse)
async def list_favorite_tables(
    pagination: PaginationParams = Depends(PaginationParams),
    db: Session = Depends(get_db)
):
    """List all tables favorited by the current user with pagination."""
    try:
        user_id = 1
        
        # Base query for user's favorites
        # We join UserFavorite with Table to get the full table data
        favorite_query = db.query(Table).join(UserFavorite).filter(
            UserFavorite.user_id == user_id
        )
        
        # Note: If you want to order by when the favorite was created, 
        # you would need to adjust the query to include the UserFavorite.created_at
        # favorite_query = favorite_query.order_by(UserFavorite.created_at.desc())

        # Count total
        total = favorite_query.count()
        
        # Apply pagination
        favorite_tables = favorite_query.offset(pagination.offset).limit(pagination.size).all()
        
        # Convert to TableResponse models (reusing logic from list_tables)
        table_responses = []
        for table in favorite_tables:
            # Reusing the structure from the list_tables endpoint for consistency
            table_response = TableResponse(
                id=table.id,
                urn=table.urn or f"urn:metaportal:dev:table:{table.id}",
                name=table.name,
                schema_name=table.schema_name or "public",
                description=table.description or "",
                table_type=table.table_type or "table",
                sensitivity_level=getattr(table, 'sensitivity_level', SensitivityLevelEnum.INTERNAL),
                is_active=getattr(table, 'is_active', True),
                is_certified=getattr(table, 'is_certified', False),
                certification_notes=getattr(table, 'certification_notes', None),
                
                # Assign flattened fields from related objects
                data_source_id=table.data_source.id if table.data_source else None,
                data_source_name=table.data_source.name if table.data_source else None,
                data_source_type=table.data_source.type if table.data_source else None,
                
                domain_id=table.domain.id if table.domain else None,
                domain_name=table.domain.name if table.domain else None,
                
                owner_id=table.owner.id if table.owner else None,
                owner_name=table.owner.name if table.owner else None,
                
                created_at=table.created_at,
                updated_at=table.updated_at,
                last_schema_check_at=getattr(table, 'last_schema_check_at', None),
                stats=None,
                column_count=len(table.columns) if hasattr(table, 'columns') else 0,
                tags=[]
            )
            table_responses.append(table_response)
        
        has_next = (pagination.offset + pagination.size) < total
        
        logger.info("Listed user favorite tables", user_id=user_id, count=total)
        
        return TableListResponse(
            tables=table_responses,
            total=total,
            page=pagination.page,
            size=pagination.size,
            has_next=has_next
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to list favorite tables", user_id=user_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list favorite tables"
        )
    
@router.post("", response_model=TableResponse)
async def create_table(
    table_data: TableCreate,
    db: Session = Depends(get_db)
):
    """Create a new table."""
    try:
        # --- 1. VERIFICATION CHECKS (CORRECT) ---
        
        # Verify data source exists
        data_source = db.query(DataSource).filter(DataSource.id == table_data.data_source_id).first()
        if not data_source:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")
        
        # Verify domain exists (if provided)
        domain = None
        if table_data.domain_id:
            domain = db.query(Domain).filter(Domain.id == table_data.domain_id).first()
            if not domain:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
        
        # Verify owner exists (if provided)
        owner = None
        if table_data.owner_id:
            owner = db.query(User).filter(User.id == table_data.owner_id).first()
            if not owner:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")
        
        # Check for duplicate table name within data source (CORRECT)
        existing = db.query(Table).filter(
            Table.data_source_id == table_data.data_source_id,
            Table.schema_name == table_data.schema_name,
            Table.name == table_data.name
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table already exists in this data source and schema"
            )
        
        # --- 2. CREATE TABLE & URN GENERATION ---
        
        # Create table instance
        table = Table(
            name=table_data.name,
            schema_name=table_data.schema_name,
            description=table_data.description,
            table_type=table_data.table_type,
            sensitivity_level=table_data.sensitivity_level,
            is_active=table_data.is_active,
            is_certified=table_data.is_certified,
            certification_notes=table_data.certification_notes,
            data_source_id=table_data.data_source_id,
            domain_id=table_data.domain_id,
            owner_id=table_data.owner_id
        )
        
        db.add(table)
        db.flush() # Use flush to get the ID without a full commit
        
        # Generate URN after receiving the ID from the flush
        table.generate_urn(db)
        
        db.commit() # Single commit to finalize both insert and URN update
        db.refresh(table) 
        
        logger.info("Table created", table_id=table.id, name=table.name)
        
        # --- 3. RESPONSE (CORRECT) ---
        return TableResponse(
            id=table.id,
            urn=table.urn,
            name=table.name,
            schema_name=table.schema_name,
            description=table.description,
            table_type=table.table_type,
            sensitivity_level=table.sensitivity_level,
            is_active=table.is_active,
            is_certified=table.is_certified,
            certification_notes=table.certification_notes,
            
            # Use FLATTENED fields as required by the schema
            data_source_id=data_source.id,
            data_source_name=data_source.name,
            data_source_type=data_source.type,
            
            domain_id=domain.id if domain else None,
            domain_name=domain.name if domain else None,
            
            owner_id=owner.id if owner else None,
            owner_name=owner.name if owner else None,
            
            # The rest of the fields
            created_at=table.created_at,
            updated_at=table.updated_at,
            last_schema_check_at=table.last_schema_check_at,
            stats=None,
            column_count=0,
            tags=[]
        )
        
    except HTTPException:
        # Re-raise explicit HTTP exceptions (400, 404)
        raise
        
    # --- CRITICAL CORRECTION: Specific Database Error Handling ---
    except sqlalchemy.exc.IntegrityError as e:
        db.rollback()
        # Logging the full error is crucial here
        logger.error("Database Integrity Error during table creation.", error=str(e), exc_info=True)
        
        # Often occurs for NOT NULL violations, data type errors, or constraint violations
        detail_msg = "Table creation failed due to a data constraint violation (e.g., missing required field or duplicate URN)."
        
        raise HTTPException(
            # Using 400 Bad Request for client-side input errors
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail_msg
        )
        
    except Exception as e:
        # Catch all other unexpected errors (database connection loss, internal logic errors, etc.)
        logger.error("Failed to create table (Unexpected Error)", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create table"
        )
    

@router.get("/{table_id}")
async def get_table(
    table_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed table information."""
    try:
        table = db.query(Table).filter(Table.id == table_id).first()
        
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Convert to response format
        columns = []
        if hasattr(table, 'columns'):
            for column in table.columns:
                column_response = {
                    "id": column.id,
                    "urn": column.urn or f"urn:metaportal:dev:column:{column.id}",
                    "table_id": column.table_id,
                    "name": column.name,
                    "description": column.description or "",
                    "data_type": column.data_type,
                    "max_length": getattr(column, 'max_length', None),
                    "precision": getattr(column, 'precision', None),
                    "scale": getattr(column, 'scale', None),
                    "is_nullable": getattr(column, 'is_nullable', True),
                    "is_primary_key": getattr(column, 'is_primary_key', False),
                    "is_foreign_key": getattr(column, 'is_foreign_key', False),
                    "default_value": getattr(column, 'default_value', None),
                    "is_pii": getattr(column, 'is_pii', False),
                    "sensitivity_level": getattr(column, 'sensitivity_level', 'internal'),
                    "ordinal_position": getattr(column, 'ordinal_position', 0),
                    "created_at": column.created_at,
                    "updated_at": column.updated_at,
                    "tags": []
                }
                columns.append(column_response)
        
        # Load table tags
        table_tags = db.query(TableTag).filter(TableTag.table_id == table_id).all()
        tags = []
        for table_tag in table_tags:
            tag_response = {
                "id": table_tag.tag.id,
                "name": table_tag.tag.name,
                "description": table_tag.tag.description or "",
                "color": getattr(table_tag.tag, 'color', '#3b82f6')
            }
            tags.append(tag_response)
        
        # Load table stats - generate sample stats for demo
        stats = None
        if hasattr(table, 'stats') and table.stats:
            stats = {
                "row_count": table.stats.row_count,
                "size_bytes": table.stats.size_bytes,
                "quality_score": table.stats.quality_score,
                "query_count_last_30d": table.stats.query_count_last_30d,
                "unique_users_last_30d": table.stats.unique_users_last_30d
            }
        else:
            # Generate sample stats for demo purposes
            import random
            stats = {
                "row_count": random.randint(1000, 1000000),
                "size_bytes": random.randint(1024*1024, 1024*1024*1024),  # 1MB to 1GB
                "quality_score": random.randint(85, 98),
                "query_count_last_30d": random.randint(50, 500),
                "unique_users_last_30d": random.randint(5, 25)
            }

        return {
            "id": table.id,
            "urn": table.urn or f"urn:metaportal:dev:table:{table.id}",
            "name": table.name,
            "schema_name": table.schema_name or "public",
            "description": table.description or "",
            "table_type": table.table_type or "table",
            "sensitivity_level": getattr(table, 'sensitivity_level', 'internal'),
            "is_active": getattr(table, 'is_active', True),
            "is_certified": getattr(table, 'is_certified', False),
            "certification_notes": getattr(table, 'certification_notes', None),
            "data_source": {
                "id": table.data_source.id,
                "name": table.data_source.name,
                "type": table.data_source.type
            } if table.data_source else None,
            "domain": {
                "id": table.domain.id,
                "name": table.domain.name,
                "color": getattr(table.domain, 'color', '#3b82f6')
            } if table.domain else None,
            "owner": {
                "id": table.owner.id,
                "name": table.owner.name,
                "email": table.owner.email
            } if table.owner else None,
            "created_at": table.created_at,
            "updated_at": table.updated_at,
            "last_schema_check_at": getattr(table, 'last_schema_check_at', None),
            "stats": stats,
            "tags": tags,
            "columns": columns,
            "upstream_tables_count": 0,
            "downstream_tables_count": 0,
            "last_quality_check": None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get table", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get table: {str(e)}"
        )


@router.put("/{table_id}", response_model=TableResponse)
async def update_table(
    table_id: int,
    table_data: TableUpdate,
    db: Session = Depends(get_db)
):
    """Update table information."""
    try:
        table = db.query(Table).filter(Table.id == table_id).first()
        
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Update fields
        update_data = table_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(table, field, value)
        
        db.commit()
        db.refresh(table)
        
        logger.info("Table updated", table_id=table.id)
        
        # Ensure URN is generated for updated table
        if not table.urn:
            table.generate_urn(db)
            db.commit()
        
        return TableResponse(
            id=table.id,
            urn=table.urn,
            name=table.name,
            schema_name=table.schema_name,
            description=table.description,
            table_type=table.table_type,
            sensitivity_level=table.sensitivity_level,
            is_active=table.is_active,
            is_certified=table.is_certified,
            certification_notes=table.certification_notes,
            data_source_id=table.data_source.id if table.data_source else None,
            data_source_name=table.data_source.name if table.data_source else None,
            data_source_type=table.data_source.type if table.data_source else None,
            domain_id=table.domain.id if table.domain else None,
            domain_name=table.domain.name if table.domain else None,
            owner_id=table.owner.id if table.owner else None,
            owner_name=table.owner.name if table.owner else None,
            owner_email=table.owner.email if table.owner else None,
            created_at=table.created_at,
            updated_at=table.updated_at,
            last_schema_check_at=table.last_schema_check_at,
            stats={
                "row_count": table.stats.row_count,
                "size_bytes": table.stats.size_bytes,
                "quality_score": table.stats.quality_score,
                "query_count_last_30d": table.stats.query_count_last_30d,
                "unique_users_last_30d": table.stats.unique_users_last_30d
            } if table.stats else None,
            column_count=len(table.columns),
            tags=[
                TagResponse(
                    id=table_tag.tag.id,
                    name=table_tag.tag.name,
                    description=table_tag.tag.description,
                    color=table_tag.tag.color,
                    parent_tag_id=table_tag.tag.parent_tag_id,
                    is_system_tag=table_tag.tag.is_system_tag,
                    is_active=table_tag.tag.is_active,
                    created_at=table_tag.tag.created_at,
                    updated_at=table_tag.tag.updated_at,
                    usage_count=len(table_tag.tag.table_tags) + len(table_tag.tag.column_tags)
                )
                for table_tag in table.tags
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update table", table_id=table_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update table"
        )


@router.delete("/{table_id}", response_model=SuccessResponse)
async def delete_table(
    table_id: int,
    db: Session = Depends(get_db)
):
    """Delete a table (soft delete)."""
    try:
        table = db.query(Table).filter(Table.id == table_id).first()
        
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Soft delete
        table.is_active = False
        db.commit()
        
        logger.info("Table deleted", table_id=table_id)
        
        return SuccessResponse(message="Table deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete table", table_id=table_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete table"
        )


@router.get("/{table_id}/stats", response_model=TableStatsResponse)
async def get_table_stats(
    table_id: int,
    db: Session = Depends(get_db)
):
    """Get table statistics."""
    try:
        table = db.query(Table).filter(Table.id == table_id).first()
        
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        if not table.stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table statistics not available"
            )
        
        return TableStatsResponse(
            table_id=table.stats.table_id,
            row_count=table.stats.row_count,
            size_bytes=table.stats.size_bytes,
            null_count=table.stats.null_count,
            duplicate_count=table.stats.duplicate_count,
            quality_score=table.stats.quality_score,
            last_updated=table.stats.last_updated,
            update_frequency=table.stats.update_frequency,
            query_count_last_30d=table.stats.query_count_last_30d,
            unique_users_last_30d=table.stats.unique_users_last_30d,
            created_at=table.stats.created_at,
            updated_at=table.stats.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get table stats", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get table statistics"
        )


# Table tagging endpoints

@router.post("/{table_id}/tags/{tag_id}", response_model=SuccessResponse)
async def add_tag_to_table(
    table_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    """Add a tag to a table."""
    try:
        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Verify tag exists
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tag not found"
            )
        
        # Check if tag is already assigned
        existing = db.query(TableTag).filter(
            TableTag.table_id == table_id,
            TableTag.tag_id == tag_id
        ).first()
        
        if existing:
            return SuccessResponse(message="Tag already assigned to table")
        
        # For demo purposes, allow without authentication
        user_id = current_user.get("user_id") if current_user else 1  # Default user for demo
        
        # Create table tag
        table_tag = TableTag(
            table_id=table_id,
            tag_id=tag_id,
            created_by=user_id,
            confidence_score=1.0,  # Default confidence for manual tags
            is_auto_tagged=False
        )
        
        db.add(table_tag)
        db.commit()
        
        logger.info("Tag added to table", table_id=table_id, tag_id=tag_id)
        
        return SuccessResponse(message="Tag added to table successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to add tag to table", table_id=table_id, tag_id=tag_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add tag to table"
        )


@router.delete("/{table_id}/tags/{tag_id}", response_model=SuccessResponse)
async def remove_tag_from_table(
    table_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    """Remove a tag from a table."""
    try:
        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Find the table tag
        table_tag = db.query(TableTag).filter(
            TableTag.table_id == table_id,
            TableTag.tag_id == tag_id
        ).first()
        
        if not table_tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tag not found on table"
            )
        
        # Remove the tag
        db.delete(table_tag)
        db.commit()
        
        logger.info("Tag removed from table", table_id=table_id, tag_id=tag_id)
        
        return SuccessResponse(message="Tag removed from table successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to remove tag from table", table_id=table_id, tag_id=tag_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove tag from table"
        )


@router.get("/{table_id}/tags", response_model=dict)
async def get_table_tags(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    """Get all tags for a table."""
    try:
        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Get tags for the table
        table_tags = db.query(TableTag).filter(TableTag.table_id == table_id).all()
        
        # Convert to response format
        tags = []
        for table_tag in table_tags:
            from ...schemas.common import TagResponse
            tag_response = TagResponse(
                id=table_tag.tag.id,
                name=table_tag.tag.name,
                description=table_tag.tag.description,
                color=table_tag.tag.color,
                parent_tag_id=table_tag.tag.parent_tag_id,
                is_system_tag=table_tag.tag.is_system_tag,
                is_active=table_tag.tag.is_active,
                created_at=table_tag.tag.created_at,
                updated_at=table_tag.tag.updated_at,
                usage_count=len(table_tag.tag.table_tags) + len(table_tag.tag.column_tags)
            )
            tags.append(tag_response)
        
        return {"items": tags}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get table tags", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get table tags"
        )


@router.post("/{table_id}/tags", response_model=SuccessResponse)
async def add_tags_to_table(
    table_id: int,
    request: BulkTagRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    """Add multiple tags to a table."""
    try:
        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Verify all tags exist
        tags = db.query(Tag).filter(Tag.id.in_(request.tag_ids)).all()
        found_tag_ids = {tag.id for tag in tags}
        missing_tag_ids = set(request.tag_ids) - found_tag_ids
        
        if missing_tag_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tags not found: {list(missing_tag_ids)}"
            )
        
        # Get existing table tags
        existing_table_tags = db.query(TableTag).filter(
            TableTag.table_id == table_id,
            TableTag.tag_id.in_(request.tag_ids)
        ).all()
        existing_tag_ids = {table_tag.tag_id for table_tag in existing_table_tags}
        
        # For demo purposes, allow without authentication
        user_id = current_user.get("user_id") if current_user else 1  # Default user for demo
        
        # Add new tags
        new_tag_ids = set(request.tag_ids) - existing_tag_ids
        added_count = 0
        
        for tag_id in new_tag_ids:
            table_tag = TableTag(
                table_id=table_id,
                tag_id=tag_id,
                created_by=user_id,
                confidence_score=1.0,  # Default confidence for manual tags
                is_auto_tagged=False
            )
            db.add(table_tag)
            added_count += 1
        
        db.commit()
        
        logger.info("Tags added to table", table_id=table_id, tag_ids=list(new_tag_ids), count=added_count)
        
        return SuccessResponse(message=f"Added {added_count} tags to table successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to add tags to table", table_id=table_id, tag_ids=request.tag_ids, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add tags to table"
        )

 

@router.post("/{table_id}/favorite", response_model=SuccessResponse)
async def add_table_to_favorites(
    table_id: int,
    db: Session = Depends(get_db)
):
    """Add table to user favorites."""
    try:
        user_id = 1

        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Check if already favorited
        existing_favorite = db.query(UserFavorite).filter(
            UserFavorite.user_id == user_id,
            UserFavorite.table_id == table_id
        ).first()
        
        if existing_favorite:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Table is already in favorites"
            )
        
        # Create new favorite
        favorite = UserFavorite(
            user_id=user_id,
            table_id=table_id
        )
        db.add(favorite)
        db.commit()
        db.refresh(favorite)
        
        logger.info("Table added to favorites", user_id=user_id, table_id=table_id)
        
        return SuccessResponse(message="Table added to favorites successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Failed to add table to favorites", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add table to favorites"
        )
    


@router.delete("/{table_id}/favorite", response_model=SuccessResponse)
async def remove_table_from_favorites(
    table_id: int,
    db: Session = Depends(get_db)  # Updated to User model
):
    """Remove table from user favorites."""
    try:
        user_id = 1

        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Check if favorite exists
        favorite = db.query(UserFavorite).filter(
            UserFavorite.user_id == user_id,
            UserFavorite.table_id == table_id
        ).first()
        
        if not favorite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Favorite not found"
            )
        
        # Delete the favorite
        db.delete(favorite)
        db.commit()
        
        logger.info("Table removed from favorites", user_id=user_id, table_id=table_id)
        
        return SuccessResponse(message="Table removed from favorites successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error("Failed to remove table from favorites", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove table from favorites"
        )
    

@router.put("/{table_id}/columns/{column_id}", response_model=SuccessResponse)
async def update_column(
    table_id: int,
    column_id: int,
    column_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    """Update column information."""
    try:
        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Verify column exists and belongs to the table
        column = db.query(Column).filter(
            Column.id == column_id,
            Column.table_id == table_id
        ).first()
        if not column:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Column not found"
            )
        
        # Update allowed fields (only description for now)
        if 'description' in column_data:
            column.description = column_data['description']

        if 'name' in column_data:
            column.name = column_data['name']
        


        # Ensure URN is generated for the column
        if not column.urn:
            column.generate_urn(db)
        
        db.commit()
        db.refresh(column)
        
        logger.info("Column updated", table_id=table_id, column_id=column_id)
        
        return SuccessResponse(message="Column updated successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update column", table_id=table_id, column_id=column_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update column"
        )
 