from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import structlog

from ...core.database import get_db
from ...core.security import get_current_user
from ...core.dependencies import PaginationParams
from ...models.table import DataSource
from ...schemas.table import (
    DataSourceResponse, DataSourceCreate, DataSourceUpdate, DataSourceListResponse
)
from ...schemas.common import SuccessResponse, ConnectionTestRequest, ConnectionTestResponse

logger = structlog.get_logger()
router = APIRouter()


@router.get("", response_model=DataSourceListResponse)
async def list_data_sources(
    pagination: PaginationParams = Depends(PaginationParams),
    db: Session = Depends(get_db)
):
    """List all data sources."""
    try:
        query = db.query(DataSource).filter(DataSource.is_active == True)
        
        # Count total
        total = query.count()
        
        # Apply pagination
        data_sources = query.order_by(DataSource.name).offset(pagination.offset).limit(pagination.size).all()
        
        # Convert to response models
        data_source_responses = []
        for ds in data_sources:
            tables_count = len([t for t in ds.tables if t.is_active])
            ds_response = DataSourceResponse(
                id=ds.id,
                name=ds.name,
                description=ds.description,
                type=ds.type,
                is_active=ds.is_active,
                auto_crawl_enabled=ds.auto_crawl_enabled,
                crawl_schedule=ds.crawl_schedule,
                connection_status=ds.connection_status,
                last_crawl_at=ds.last_crawl_at,
                last_connection_test_at=ds.last_connection_test_at,
                created_at=ds.created_at,
                updated_at=ds.updated_at,
                tables_count=tables_count
            )
            data_source_responses.append(ds_response)
        
        has_next = (pagination.offset + pagination.size) < total
        
        return DataSourceListResponse(
            data_sources=data_source_responses,
            total=total,
            page=pagination.page,
            size=pagination.size,
            has_next=has_next
        )
        
    except Exception as e:
        logger.error("Failed to list data sources", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list data sources"
        )

@router.post("", response_model=DataSourceResponse)
async def create_data_source(
    data_source_data: DataSourceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new data source."""
    try:
        # Check for duplicate name
        existing = db.query(DataSource).filter(DataSource.name == data_source_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Data source name already exists"
            )
        
        # Create data source
        data_source = DataSource(
            name=data_source_data.name,
            description=data_source_data.description,
            type=data_source_data.type,
            connection_config=data_source_data.connection_config,
            is_active=data_source_data.is_active,
            auto_crawl_enabled=data_source_data.auto_crawl_enabled,
            crawl_schedule=data_source_data.crawl_schedule
        )
        
        db.add(data_source)
        db.commit()
        db.refresh(data_source)
        
        logger.info("Data source created", data_source_id=data_source.id, name=data_source.name)
        
        return DataSourceResponse(
            id=data_source.id,
            name=data_source.name,
            description=data_source.description,
            type=data_source.type,
            is_active=data_source.is_active,
            auto_crawl_enabled=data_source.auto_crawl_enabled,
            crawl_schedule=data_source.crawl_schedule,
            connection_status=data_source.connection_status,
            last_crawl_at=data_source.last_crawl_at,
            last_connection_test_at=data_source.last_connection_test_at,
            created_at=data_source.created_at,
            updated_at=data_source.updated_at,
            tables_count=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create data source", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create data source"
        )


@router.get("/{data_source_id}", response_model=DataSourceResponse)
async def get_data_source(
    data_source_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get data source details."""
    try:
        data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
        
        if not data_source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        tables_count = len([t for t in data_source.tables if t.is_active])
        
        return DataSourceResponse(
            id=data_source.id,
            name=data_source.name,
            description=data_source.description,
            type=data_source.type,
            is_active=data_source.is_active,
            auto_crawl_enabled=data_source.auto_crawl_enabled,
            crawl_schedule=data_source.crawl_schedule,
            connection_status=data_source.connection_status,
            last_crawl_at=data_source.last_crawl_at,
            last_connection_test_at=data_source.last_connection_test_at,
            created_at=data_source.created_at,
            updated_at=data_source.updated_at,
            tables_count=tables_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get data source", data_source_id=data_source_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get data source"
        )


@router.put("/{data_source_id}", response_model=DataSourceResponse)
async def update_data_source(
    data_source_id: int,
    data_source_data: DataSourceUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update data source."""
    try:
        data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
        
        if not data_source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        # Update fields
        update_data = data_source_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(data_source, field, value)
        
        db.commit()
        db.refresh(data_source)
        
        logger.info("Data source updated", data_source_id=data_source.id)
        
        tables_count = len([t for t in data_source.tables if t.is_active])
        
        return DataSourceResponse(
            id=data_source.id,
            name=data_source.name,
            description=data_source.description,
            type=data_source.type,
            is_active=data_source.is_active,
            auto_crawl_enabled=data_source.auto_crawl_enabled,
            crawl_schedule=data_source.crawl_schedule,
            connection_status=data_source.connection_status,
            last_crawl_at=data_source.last_crawl_at,
            last_connection_test_at=data_source.last_connection_test_at,
            created_at=data_source.created_at,
            updated_at=data_source.updated_at,
            tables_count=tables_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update data source", data_source_id=data_source_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update data source"
        )


@router.delete("/{data_source_id}", response_model=SuccessResponse)
async def delete_data_source(
    data_source_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete data source (soft delete)."""
    try:
        data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
        
        if not data_source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        # Check if there are active tables
        active_tables = len([t for t in data_source.tables if t.is_active])
        if active_tables > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete data source with {active_tables} active tables"
            )
        
        # Soft delete
        data_source.is_active = False
        db.commit()
        
        logger.info("Data source deleted", data_source_id=data_source_id)
        
        return SuccessResponse(message="Data source deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete data source", data_source_id=data_source_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete data source"
        )


@router.post("/{data_source_id}/test-connection", response_model=ConnectionTestResponse)
async def test_data_source_connection(
    data_source_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Test data source connection."""
    try:
        data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
        
        if not data_source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Data source not found"
            )
        
        # TODO: Implement actual connection testing logic based on data source type
        # For now, return a mock response
        import time
        from datetime import datetime
        
        # Simulate connection test
        success = True  # In real implementation, test actual connection
        message = "Connection successful" if success else "Connection failed"
        latency_ms = 45  # Mock latency
        
        # Update connection status
        data_source.connection_status = "success" if success else "failed"
        data_source.last_connection_test_at = datetime.utcnow()
        db.commit()
        
        return ConnectionTestResponse(
            success=success,
            message=message,
            latency_ms=latency_ms,
            details={"data_source_type": data_source.type.value},
            tested_at=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to test connection", data_source_id=data_source_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to test connection"
        )