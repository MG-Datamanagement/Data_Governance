from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import structlog

from ...core.database import get_db
from ...core.security import get_current_user, get_steward_user, get_optional_user
from ...core.dependencies import PaginationParams
from ...models.table import Domain
from ...models.user import User
from ...schemas.table import DomainResponse, DomainCreate, DomainUpdate, DomainListResponse
from ...schemas.common import SuccessResponse

logger = structlog.get_logger()
router = APIRouter()


@router.get("", response_model=DomainListResponse)
async def list_domains(
    pagination: PaginationParams = Depends(PaginationParams),
    db: Session = Depends(get_db)
):
    """List all domains."""
    try:
        query = db.query(Domain)
        
        # Count total
        total = query.count()
        
        # Apply pagination
        domains = query.order_by(Domain.name).offset(pagination.offset).limit(pagination.size).all()
        
        # Convert to response models
        domain_responses = []
        for domain in domains:
            tables_count = len([t for t in domain.tables if t.is_active])
            domain_response = DomainResponse(
                id=domain.id,
                urn=domain.urn,
                name=domain.name,
                description=domain.description,
                color=domain.color,
                steward_id=domain.steward_id,
                steward_name=domain.steward.name if domain.steward else None,
                created_at=domain.created_at,
                updated_at=domain.updated_at,
                tables_count=tables_count
            )
            domain_responses.append(domain_response)
        
        has_next = (pagination.offset + pagination.size) < total
        
        return DomainListResponse(
            domains=domain_responses,
            total=total,
            page=pagination.page,
            size=pagination.size,
            has_next=has_next
        )
        
    except Exception as e:
        logger.error("Failed to list domains", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list domains"
        )


@router.post("", response_model=DomainResponse)
async def create_domain(
    domain_data: DomainCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_steward_user)
):
    """Create a new domain."""
    try:
        # Check for duplicate name
        existing = db.query(Domain).filter(Domain.name == domain_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain name already exists"
            )
        
        # Verify steward exists (if provided)
        if domain_data.steward_id:
            steward = db.query(User).filter(User.id == domain_data.steward_id).first()
            if not steward:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Steward not found"
                )
        
        # Create domain
        domain = Domain(
            name=domain_data.name,
            description=domain_data.description,
            color=domain_data.color,
            steward_id=domain_data.steward_id
        )
        
        db.add(domain)
        db.commit()
        db.refresh(domain)
        
        logger.info("Domain created", domain_id=domain.id, name=domain.name)
        
        return DomainResponse(
            id=domain.id,
            urn=domain.urn,
            name=domain.name,
            description=domain.description,
            color=domain.color,
            steward_id=domain.steward_id,
            steward_name=domain.steward.name if domain.steward else None,
            created_at=domain.created_at,
            updated_at=domain.updated_at,
            tables_count=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create domain", error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create domain"
        )


@router.get("/{domain_id}", response_model=DomainResponse)
async def get_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    """Get domain details."""
    try:
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        
        if not domain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Domain not found"
            )
        
        tables_count = len([t for t in domain.tables if t.is_active])
        
        return DomainResponse(
            id=domain.id,
            urn=domain.urn,
            name=domain.name,
            description=domain.description,
            color=domain.color,
            steward_id=domain.steward_id,
            steward_name=domain.steward.name if domain.steward else None,
            created_at=domain.created_at,
            updated_at=domain.updated_at,
            tables_count=tables_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get domain", domain_id=domain_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get domain"
        )


@router.put("/{domain_id}", response_model=DomainResponse)
async def update_domain(
    domain_id: int,
    domain_data: DomainUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_steward_user)
):
    """Update domain."""
    try:
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        
        if not domain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Domain not found"
            )
        
        # Update fields
        update_data = domain_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(domain, field, value)
        
        db.commit()
        db.refresh(domain)
        
        logger.info("Domain updated", domain_id=domain.id)
        
        tables_count = len([t for t in domain.tables if t.is_active])
        
        return DomainResponse(
            id=domain.id,
            urn=domain.urn,
            name=domain.name,
            description=domain.description,
            color=domain.color,
            steward_id=domain.steward_id,
            steward_name=domain.steward.name if domain.steward else None,
            created_at=domain.created_at,
            updated_at=domain.updated_at,
            tables_count=tables_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update domain", domain_id=domain_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update domain"
        )


@router.delete("/{domain_id}", response_model=SuccessResponse)
async def delete_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_steward_user)
):
    """Delete domain."""
    try:
        domain = db.query(Domain).filter(Domain.id == domain_id).first()
        
        if not domain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Domain not found"
            )
        
        # Check if there are active tables in this domain
        active_tables = len([t for t in domain.tables if t.is_active])
        if active_tables > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete domain with {active_tables} active tables"
            )
        
        # Delete domain
        db.delete(domain)
        db.commit()
        
        logger.info("Domain deleted", domain_id=domain_id)
        
        return SuccessResponse(message="Domain deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete domain", domain_id=domain_id, error=str(e), exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete domain"
        )