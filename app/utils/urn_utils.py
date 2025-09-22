"""
URN utility functions for resource management and operations.

This module provides helper functions for working with URNs in the Infinity Governance Platform.
"""

from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models.table import Table, Column, DataSource, Domain
from ..models.resource_urn import URNGenerator, ParsedURN, Environment
import structlog

logger = structlog.get_logger()


def generate_all_missing_urns(db: Session) -> Dict[str, int]:
    """
    Generate URNs for all resources that don't have them.
    
    Args:
        db: Database session
        
    Returns:
        Dict with counts of URNs generated per resource type
    """
    counts = {
        "data_sources": 0,
        "domains": 0,
        "tables": 0,
        "columns": 0
    }
    
    try:
        # Generate URNs for data sources
        data_sources = db.query(DataSource).filter(DataSource.urn.is_(None)).all()
        for ds in data_sources:
            ds.generate_urn()
            counts["data_sources"] += 1
        
        # Generate URNs for domains
        domains = db.query(Domain).filter(Domain.urn.is_(None)).all()
        for domain in domains:
            domain.generate_urn()
            counts["domains"] += 1
        
        # Generate URNs for tables
        tables = db.query(Table).filter(Table.urn.is_(None)).all()
        for table in tables:
            table.generate_urn(db)
            counts["tables"] += 1
        
        # Generate URNs for columns
        columns = db.query(Column).filter(Column.urn.is_(None)).all()
        for column in columns:
            column.generate_urn(db)
            counts["columns"] += 1
        
        db.commit()
        logger.info("Generated missing URNs", counts=counts)
        return counts
        
    except Exception as e:
        logger.error("Failed to generate URNs", error=str(e))
        db.rollback()
        raise


def find_resource_by_urn(db: Session, urn: str) -> Optional[Dict[str, Any]]:
    """
    Find a resource by its URN.
    
    Args:
        db: Database session
        urn: Resource URN to search for
        
    Returns:
        Dict with resource info or None if not found
    """
    parsed = URNGenerator.parse_urn(urn)
    if not parsed:
        return None
    
    try:
        if parsed.resource_type.value == "dataset":
            table = db.query(Table).filter(Table.urn == urn).first()
            if table:
                return {
                    "type": "table",
                    "id": table.id,
                    "name": table.name,
                    "schema": table.schema_name,
                    "data_source": table.data_source.name,
                    "urn": table.urn
                }
                
        elif parsed.resource_type.value == "field":
            column = db.query(Column).filter(Column.urn == urn).first()
            if column:
                return {
                    "type": "column",
                    "id": column.id,
                    "name": column.name,
                    "table": column.table.name,
                    "data_source": column.table.data_source.name,
                    "urn": column.urn
                }
                
        elif parsed.resource_type.value == "domain":
            domain = db.query(Domain).filter(Domain.urn == urn).first()
            if domain:
                return {
                    "type": "domain",
                    "id": domain.id,
                    "name": domain.name,
                    "urn": domain.urn
                }
                
        elif parsed.resource_type.value == "platform":
            data_source = db.query(DataSource).filter(DataSource.urn == urn).first()
            if data_source:
                return {
                    "type": "data_source",
                    "id": data_source.id,
                    "name": data_source.name,
                    "type_name": data_source.type.value,
                    "urn": data_source.urn
                }
                
    except Exception as e:
        logger.error("Failed to find resource by URN", urn=urn, error=str(e))
    
    return None


def validate_urn_uniqueness(db: Session, urn: str, exclude_id: Optional[int] = None, resource_type: str = None) -> bool:
    """
    Validate that a URN is unique across all resources.
    
    Args:
        db: Database session
        urn: URN to validate
        exclude_id: ID to exclude from check (for updates)
        resource_type: Type of resource being checked
        
    Returns:
        True if URN is unique, False otherwise
    """
    try:
        # Check tables
        query = db.query(Table).filter(Table.urn == urn)
        if exclude_id and resource_type == "table":
            query = query.filter(Table.id != exclude_id)
        if query.first():
            return False
        
        # Check columns
        query = db.query(Column).filter(Column.urn == urn)
        if exclude_id and resource_type == "column":
            query = query.filter(Column.id != exclude_id)
        if query.first():
            return False
        
        # Check domains
        query = db.query(Domain).filter(Domain.urn == urn)
        if exclude_id and resource_type == "domain":
            query = query.filter(Domain.id != exclude_id)
        if query.first():
            return False
        
        # Check data sources
        query = db.query(DataSource).filter(DataSource.urn == urn)
        if exclude_id and resource_type == "data_source":
            query = query.filter(DataSource.id != exclude_id)
        if query.first():
            return False
        
        return True
        
    except Exception as e:
        logger.error("Failed to validate URN uniqueness", urn=urn, error=str(e))
        return False


def get_lineage_by_urn(db: Session, urn: str) -> Dict[str, List[str]]:
    """
    Get upstream and downstream URNs for a given resource URN.
    
    Args:
        db: Database session
        urn: Resource URN
        
    Returns:
        Dict with upstream and downstream URN lists
    """
    parsed = URNGenerator.parse_urn(urn)
    if not parsed or parsed.resource_type.value != "dataset":
        return {"upstream": [], "downstream": []}
    
    try:
        table = db.query(Table).filter(Table.urn == urn).first()
        if not table:
            return {"upstream": [], "downstream": []}
        
        upstream_urns = []
        downstream_urns = []
        
        # Get upstream tables
        for edge in table.upstream_edges:
            if edge.source_table and edge.source_table.urn:
                upstream_urns.append(edge.source_table.urn)
        
        # Get downstream tables
        for edge in table.downstream_edges:
            if edge.target_table and edge.target_table.urn:
                downstream_urns.append(edge.target_table.urn)
        
        return {
            "upstream": upstream_urns,
            "downstream": downstream_urns
        }
        
    except Exception as e:
        logger.error("Failed to get lineage by URN", urn=urn, error=str(e))
        return {"upstream": [], "downstream": []}


def search_resources_by_pattern(db: Session, pattern: str, resource_types: List[str] = None) -> List[Dict[str, Any]]:
    """
    Search for resources by URN pattern or hierarchy.
    
    Args:
        db: Database session
        pattern: Search pattern (can include wildcards)
        resource_types: List of resource types to search in
        
    Returns:
        List of matching resources
    """
    results = []
    
    try:
        if not resource_types:
            resource_types = ["dataset", "field", "domain", "platform"]
        
        # Search tables
        if "dataset" in resource_types:
            tables = db.query(Table).filter(
                (Table.urn.ilike(f"%{pattern}%")) |
                (Table.name.ilike(f"%{pattern}%"))
            ).all()
            
            for table in tables:
                if table.urn:
                    results.append({
                        "type": "table",
                        "id": table.id,
                        "name": table.name,
                        "urn": table.urn,
                        "hierarchy": table.dataset_hierarchy
                    })
        
        # Search columns
        if "field" in resource_types:
            columns = db.query(Column).filter(
                (Column.urn.ilike(f"%{pattern}%")) |
                (Column.name.ilike(f"%{pattern}%"))
            ).all()
            
            for column in columns:
                if column.urn:
                    results.append({
                        "type": "column", 
                        "id": column.id,
                        "name": column.name,
                        "urn": column.urn,
                        "hierarchy": column.field_hierarchy
                    })
        
        # Search domains
        if "domain" in resource_types:
            domains = db.query(Domain).filter(
                (Domain.urn.ilike(f"%{pattern}%")) |
                (Domain.name.ilike(f"%{pattern}%"))
            ).all()
            
            for domain in domains:
                if domain.urn:
                    results.append({
                        "type": "domain",
                        "id": domain.id,
                        "name": domain.name,
                        "urn": domain.urn
                    })
        
        # Search data sources
        if "platform" in resource_types:
            data_sources = db.query(DataSource).filter(
                (DataSource.urn.ilike(f"%{pattern}%")) |
                (DataSource.name.ilike(f"%{pattern}%"))
            ).all()
            
            for ds in data_sources:
                if ds.urn:
                    results.append({
                        "type": "data_source",
                        "id": ds.id,
                        "name": ds.name,
                        "urn": ds.urn
                    })
        
        return results
        
    except Exception as e:
        logger.error("Failed to search resources by pattern", pattern=pattern, error=str(e))
        return []


def get_resource_hierarchy(urn: str) -> Optional[List[str]]:
    """
    Get the hierarchy components from a URN.
    
    Args:
        urn: Resource URN
        
    Returns:
        List of hierarchy components or None
    """
    parsed = URNGenerator.parse_urn(urn)
    if not parsed:
        return None
    
    return parsed.hierarchy.split(".")


def build_urn_from_components(resource_type: str, platform: str, hierarchy: List[str], 
                             environment: str = "PROD") -> str:
    """
    Build a URN from components.
    
    Args:
        resource_type: Type of resource (dataset, field, domain, platform)
        platform: Platform name
        hierarchy: List of hierarchy components
        environment: Environment name
        
    Returns:
        Built URN string
    """
    hierarchy_str = ".".join(hierarchy)
    env = Environment(environment)
    
    if resource_type == "dataset":
        return f"urn:infinity:dataset:({platform},{hierarchy_str},{env.value})"
    elif resource_type == "field":
        return f"urn:infinity:field:({platform},{hierarchy_str},{env.value})"
    elif resource_type == "domain":
        return f"urn:infinity:domain:(domain,{hierarchy_str},{env.value})"
    elif resource_type == "platform":
        return f"urn:infinity:platform:(platform,{hierarchy_str},{env.value})"
    else:
        raise ValueError(f"Unsupported resource type: {resource_type}")