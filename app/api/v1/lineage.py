from collections.abc import Set
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, func
from sqlalchemy.exc import DatabaseError
from typing import List, Dict, Any, Optional
from collections import defaultdict
import structlog

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.lineage import LineageEdge, LineageJob, LineageJobRun, LineageImpactAnalysis, LineageTypeEnum
from ...models.table import Table, Column 
from ...models.user import User
from ...schemas.common import SuccessResponse, ColumnResponse


logger = structlog.get_logger()
router = APIRouter()

@router.get("/table/{table_id}/upstream", response_model=Dict)
async def get_upstream_lineage(
    table_id: int,
    depth: int = Query(3, ge=1, le=10, description="Maximum lineage depth to traverse"),
    db: Session = Depends(get_db)
):
    """
    Get the overall upstream lineage for a given table as a nested tree,
    focusing only on table-to-table relationships.
    """
    try:
        # 1. Verify the starting table exists
        center_table = db.query(Table).options(
            joinedload(Table.data_source)
        ).filter(Table.id == table_id).first()

        if not center_table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table with id {table_id} not found"
            )

        # --- PHASE 1: Optimized Batch Fetching ---
        nodes_to_process = {table_id}
        visited_ids = set()
        all_lineage_nodes: Dict[int, Dict] = {}
        adjacency_list = defaultdict(list)

        def get_table_info(table: Table) -> Dict:
            data_source = table.data_source
            return {
                "table_id": table.id,
                "table_name": table.name,
                "schema_name": table.schema_name,
                "data_source_name": data_source.name if data_source else None,
                "data_source_type": data_source.type.value if data_source and data_source.type else None,
            }

        all_lineage_nodes[table_id] = get_table_info(center_table)

        for current_depth in range(depth):
            if not nodes_to_process:
                break
            current_batch_ids = nodes_to_process - visited_ids
            if not current_batch_ids:
                break
            
            visited_ids.update(current_batch_ids)
            next_nodes_to_process: Set[int] = set()

            # **Query is simplified to only fetch table-level lineage**
            edges = db.query(LineageEdge).options(
                joinedload(LineageEdge.source_table).joinedload(Table.data_source)
            ).filter(
                LineageEdge.target_table_id.in_(current_batch_ids),
                LineageEdge.is_active == True
            ).all()

            for edge in edges:
                source_table = edge.source_table
                target_table_id = edge.target_table_id
                
                if not source_table or not target_table_id:
                    continue

                if source_table.id not in all_lineage_nodes:
                    all_lineage_nodes[source_table.id] = get_table_info(source_table)

                adjacency_list[target_table_id].append({
                    "source_id": source_table.id,
                    "transformation_logic": edge.transformation_logic,
                    "confidence_score": edge.confidence_score
                })
                
                if source_table.id not in visited_ids:
                    next_nodes_to_process.add(source_table.id)
            
            nodes_to_process = next_nodes_to_process

        # --- PHASE 2: In-Memory Tree Assembly ---
        def build_response_tree(current_table_id: int) -> Dict:
            node_data = all_lineage_nodes.get(current_table_id, {}).copy()
            node_data["upstream"] = []
            
            source_edges = adjacency_list.get(current_table_id, [])
            
            if not source_edges:
                # If a node has no parents, show its data source as the origin
                table_info = all_lineage_nodes.get(current_table_id)
                if table_info and table_info.get("data_source_name"):
                    node_data["upstream"].append({
                        "is_origin_source": True,
                        "data_source_name": table_info["data_source_name"],
                        "data_source_type": table_info["data_source_type"]
                    })
                return node_data

            for edge_info in source_edges:
                upstream_tree = build_response_tree(edge_info["source_id"])
                
                upstream_tree["transformation_logic"] = edge_info["transformation_logic"]
                upstream_tree["confidence_score"] = edge_info["confidence_score"]
                
                node_data["upstream"].append(upstream_tree)

            return node_data

        return build_response_tree(table_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get upstream lineage for table {table_id}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching upstream lineage."
        )
    
@router.get("/table/{table_id}/downstream", response_model=List[Dict])
async def get_downstream_lineage(
    table_id: int,
    depth: int = Query(3, ge=1, le=10, description="Maximum lineage depth to traverse"),
    db: Session = Depends(get_db)
):
    """
    Get the overall downstream lineage for a given table as a nested tree,
    focusing only on table-to-table relationships.
    """
    try:
        # 1. Verify the starting table exists
        center_table = db.query(Table).filter(Table.id == table_id).first()

        if not center_table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table with id {table_id} not found"
            )

        # --- PHASE 1: Optimized Batch Fetching ---
        nodes_to_process = {table_id}
        visited_ids = set()
        all_lineage_nodes: Dict[int, Dict] = {}
        adjacency_list = defaultdict(list)

        def get_table_info(table: Table) -> Dict:
            return {
                "table_id": table.id,
                "table_name": table.name,
                "schema_name": table.schema_name,
            }

        all_lineage_nodes[table_id] = get_table_info(center_table)

        for current_depth in range(depth):
            if not nodes_to_process:
                break
            current_batch_ids = nodes_to_process - visited_ids
            if not current_batch_ids:
                break
            
            visited_ids.update(current_batch_ids)
            next_nodes_to_process: Set[int] = set()

            # **Query is now simplified to only fetch table-level lineage**
            edges = db.query(LineageEdge).options(
                joinedload(LineageEdge.target_table)
            ).filter(
                LineageEdge.source_table_id.in_(current_batch_ids),
                LineageEdge.is_active == True
            ).all()

            for edge in edges:
                target_table = edge.target_table
                source_table_id = edge.source_table_id
                
                if not target_table or not source_table_id:
                    continue

                if target_table.id not in all_lineage_nodes:
                    all_lineage_nodes[target_table.id] = get_table_info(target_table)

                adjacency_list[source_table_id].append({
                    "target_id": target_table.id,
                    "transformation_logic": edge.transformation_logic,
                    "confidence_score": edge.confidence_score,
                })
                
                if target_table.id not in visited_ids:
                    next_nodes_to_process.add(target_table.id)
            
            nodes_to_process = next_nodes_to_process

        # --- PHASE 2: In-Memory Tree Assembly ---
        def build_response_tree(current_table_id: int) -> Dict:
            node_info = all_lineage_nodes.get(current_table_id, {})
            node_data = {
                "table_id": node_info.get("table_id"),
                "table_name": node_info.get("table_name"),
                "schema_name": node_info.get("schema_name"),
                "children": []
            }
            
            target_edges = adjacency_list.get(current_table_id, [])
            for edge_info in target_edges:
                downstream_tree = build_response_tree(edge_info["target_id"])
                
                downstream_tree["transformation_logic"] = edge_info["transformation_logic"]
                downstream_tree["confidence_score"] = edge_info["confidence_score"]
                
                node_data["children"].append(downstream_tree)

            return node_data

        full_tree = build_response_tree(table_id)
        return full_tree.get("children", [])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get downstream lineage for table {table_id}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching downstream lineage."
        )


@router.get("/table/{table_id}/full-graph", tags=["Lineage"])
async def get_full_lineage_graph(
    table_id: int,
    max_depth: int = Query(3, ge=1, le=10, description="Maximum lineage depth to traverse"),
    include_columns: bool = Query(False, description="Include column-level lineage details"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of edges to fetch per level"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get the complete lineage graph for a given table.
    - Upstream lineage is grouped by data source.
    - Downstream lineage is a nested tree structure of dependent tables.
    - Includes column-level mappings when requested.
    """

    def get_table_info(table: Table) -> Dict:
        """Helper to create a standardized table info dictionary."""
        if not table or not table.data_source:
            return {
                "id": table.id if table else None, "name": table.name if table else "Unknown",
                "schema_name": table.schema_name if table else "Unknown", "data_source_name": None,
                "data_source_type": None,
            }
        return {
            "id": table.id, "name": table.name, "schema_name": table.schema_name,
            "data_source_name": table.data_source.name,
            "data_source_type": table.data_source.type.value,
        }

    def fetch_lineage_links(direction: str) -> List[Dict]:
        """Iteratively fetches all lineage connections up to the max_depth."""
        all_links, visited_table_ids, current_level_ids, seen_edge_keys = [], {table_id}, {table_id}, set()
        query_options = [
            selectinload(LineageEdge.source_table).selectinload(Table.data_source),
            selectinload(LineageEdge.target_table).selectinload(Table.data_source),
            selectinload(LineageEdge.source_column).selectinload(Column.table).selectinload(Table.data_source),
            selectinload(LineageEdge.target_column).selectinload(Column.table).selectinload(Table.data_source),
        ]
        for depth in range(max_depth):
            if not current_level_ids: break
            if direction == "upstream":
                table_filter = LineageEdge.target_table_id.in_(current_level_ids)
                column_filter = LineageEdge.target_column.has(Column.table_id.in_(current_level_ids))
            else:
                table_filter = LineageEdge.source_table_id.in_(current_level_ids)
                column_filter = LineageEdge.source_column.has(Column.table_id.in_(current_level_ids))
            
            query = db.query(LineageEdge).options(*query_options).filter(LineageEdge.is_active == True)
            query = query.filter(or_(table_filter, column_filter)) if include_columns else query.filter(table_filter)
            edges = query.limit(limit).all()
            
            next_level_ids = set()
            for edge in edges:
                source_table = edge.source_table or (edge.source_column and edge.source_column.table)
                target_table = edge.target_table or (edge.target_column and edge.target_column.table)
                if not source_table or not target_table: continue
                
                # Deduplicate edges to prevent cycles in the response
                edge_key = (source_table.id, target_table.id, edge.lineage_type.value)
                if edge_key in seen_edge_keys: continue
                seen_edge_keys.add(edge_key)

                link_info = {
                    "source_table": get_table_info(source_table),
                    "target_table": get_table_info(target_table),
                    "transformation_logic": edge.transformation_logic,
                    "depth": depth + 1,
                    "direction": direction,
                    "lineage_type": edge.lineage_type.value,
                }
                
                # **This block adds the column mapping when requested**
                if include_columns and edge.lineage_type.value == "COLUMN_TO_COLUMN":
                    column_map = {}
                    if edge.source_column:
                        column_map["source_column"] = {"id": edge.source_column.id, "name": edge.source_column.name}
                    if edge.target_column:
                        column_map["target_column"] = {"id": edge.target_column.id, "name": edge.target_column.name}
                    if column_map:
                        link_info["column_mapping"] = column_map
                
                all_links.append(link_info)
                next_table = source_table if direction == "upstream" else target_table
                if next_table.id not in visited_table_ids:
                    next_level_ids.add(next_table.id)
            
            visited_table_ids.update(next_level_ids)
            current_level_ids = next_level_ids
        return all_links

    def structure_upstream_by_datasource(links: List[Dict]) -> List[Dict]:
        """Groups upstream tables by their data source."""
        datasources = {}
        for link in links:
            connected_table_info = link["source_table"]
            ds_name = connected_table_info.get("data_source_name", "Unknown Data Source")
            if ds_name not in datasources:
                datasources[ds_name] = {
                    "data_source_name": ds_name, "data_source_type": connected_table_info.get("data_source_type"), "tables": []
                }
            table_detail = {
                "id": connected_table_info["id"], "name": connected_table_info["name"], "schema_name": connected_table_info["schema_name"],
                "depth": link["depth"], "lineage_type": link["lineage_type"], "transformation_logic": link["transformation_logic"]
            }
            # **Propagates the column mapping into the final structure**
            if "column_mapping" in link:
                table_detail["column_mapping"] = link["column_mapping"]
            datasources[ds_name]["tables"].append(table_detail)
        return list(datasources.values())

    # --- MAIN FUNCTION LOGIC ---
    try:
        if table_id <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Table ID must be a positive integer")

        center_table = db.query(Table).options(selectinload(Table.data_source), selectinload(Table.domain)).filter(Table.id == table_id).first()

        if not center_table:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Table with id {table_id} not found")

        # --- Upstream Processing ---
        upstream_links_flat = fetch_lineage_links("upstream")
        structured_upstream = structure_upstream_by_datasource(upstream_links_flat)
        if not structured_upstream and center_table.data_source:
            structured_upstream = [{
                "data_source_name": center_table.data_source.name, "data_source_type": center_table.data_source.type.value,
                "is_origin_source": True, "tables": []
            }]

        # --- Downstream Processing ---
        downstream_links_flat = fetch_lineage_links("downstream")
        nodes = {}
        structured_downstream = []

        # First pass: Create a node for every table in the downstream lineage
        for link in downstream_links_flat:
            target_info = link["target_table"]
            node_id = target_info["id"]
            if node_id not in nodes:
                nodes[node_id] = {
                    "id": target_info["id"], "name": target_info["name"], "schema_name": target_info["schema_name"],
                    "depth": link["depth"], "lineage_type": link["lineage_type"], "transformation_logic": link["transformation_logic"],
                    "children": []
                }
                # **Propagates the column mapping into the final structure**
                if "column_mapping" in link:
                    nodes[node_id]["column_mapping"] = link["column_mapping"]

        # Second pass: Connect the nodes into a tree
        for link in downstream_links_flat:
            source_id = link["source_table"]["id"]
            target_id = link["target_table"]["id"]
            target_node = nodes.get(target_id)
            if not target_node: continue

            if source_id == table_id:
                if not any(n['id'] == target_id for n in structured_downstream):
                    structured_downstream.append(target_node)
            else:
                parent_node = nodes.get(source_id)
                if parent_node:
                    if not any(c['id'] == target_id for c in parent_node["children"]):
                        parent_node["children"].append(target_node)

        return {
            "table_id": center_table.id, "table_name": center_table.name,
            "domain_name": center_table.domain.name if center_table.domain else None,
            "upstream_lineage": structured_upstream,
            "downstream_lineage": structured_downstream,
            "metadata": {
                "max_depth_applied": max_depth, "total_upstream_links_found": len(upstream_links_flat),
                "total_downstream_links_found": len(downstream_links_flat), "include_columns": include_columns,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get lineage graph for table {table_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred.") from e
    

@router.get("/jobs")
async def get_lineage_jobs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    db: Session = Depends(get_db)
):
    """Get lineage jobs with optional filtering."""
    try:
        query = db.query(LineageJob).options(joinedload(LineageJob.owner))
        
        if is_active is not None:
            query = query.filter(LineageJob.is_active == is_active)
        
        if job_type:
            query = query.filter(LineageJob.job_type == job_type)
        
        jobs = query.offset(skip).limit(limit).all()
        
        return {
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "description": job.description,
                    "external_job_id": job.external_job_id,
                    "job_type": job.job_type,
                    "schedule": job.schedule,
                    "is_scheduled": job.is_scheduled,
                    "last_run_at": job.last_run_at,
                    "next_run_at": job.next_run_at,
                    "last_run_status": job.last_run_status,
                    "owner": {
                        "id": job.owner.id,
                        "name": job.owner.name,
                        "email": job.owner.email
                    } if job.owner else None,
                    "is_active": job.is_active,
                    "created_at": job.created_at,
                    "updated_at": job.updated_at
                }
                for job in jobs
            ],
            "metadata": {
                "total_count": query.count(),
                "returned_count": len(jobs),
                "skip": skip,
                "limit": limit
            }
        }
        
    except Exception as e:
        logger.error("Failed to get lineage jobs", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get lineage jobs"
        )


@router.get("/jobs/{job_id}/runs")
async def get_job_runs(
    job_id: int,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=500, description="Number of records to return"),
    status: Optional[str] = Query(None, description="Filter by run status"),
    db: Session = Depends(get_db)
):
    """Get runs for a specific lineage job."""
    try:
        # Verify job exists
        job = db.query(LineageJob).filter(LineageJob.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lineage job not found"
            )
        
        query = db.query(LineageJobRun).filter(LineageJobRun.job_id == job_id)
        
        if status:
            query = query.filter(LineageJobRun.status == status)
        
        runs = query.order_by(LineageJobRun.started_at.desc()).offset(skip).limit(limit).all()
        
        return {
            "job_id": job_id,
            "job_name": job.name,
            "runs": [
                {
                    "id": run.id,
                    "run_id": run.run_id,
                    "started_at": run.started_at,
                    "ended_at": run.ended_at,
                    "status": run.status,
                    "tables_processed": run.tables_processed,
                    "lineage_edges_created": run.lineage_edges_created,
                    "lineage_edges_updated": run.lineage_edges_updated,
                    "error_message": run.error_message,
                    "execution_context": run.execution_context
                }
                for run in runs
            ],
            "metadata": {
                "total_count": query.count(),
                "returned_count": len(runs),
                "skip": skip,
                "limit": limit
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get job runs", job_id=job_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job runs"
        )


@router.get("/statistics")
async def get_lineage_statistics(
    db: Session = Depends(get_db)
):
    """Get overall lineage statistics."""
    try:
        # Count various lineage entities
        total_edges = db.query(LineageEdge).filter(LineageEdge.is_active == True).count()
        total_jobs = db.query(LineageJob).filter(LineageJob.is_active == True).count()
        
        # Count by lineage type
        edge_types = db.query(LineageEdge.lineage_type, func.count(LineageEdge.id)).filter(
            LineageEdge.is_active == True
        ).group_by(LineageEdge.lineage_type).all()
        
        # Count by source type
        source_types = db.query(LineageEdge.source_type, func.count(LineageEdge.id)).filter(
            LineageEdge.is_active == True
        ).group_by(LineageEdge.source_type).all()
        
        # Count tables with lineage
        tables_with_upstream = db.query(LineageEdge.target_table_id).filter(
            LineageEdge.is_active == True
        ).distinct().count()
        
        tables_with_downstream = db.query(LineageEdge.source_table_id).filter(
            LineageEdge.is_active == True
        ).distinct().count()
        
        # Recent job runs
        recent_runs = db.query(LineageJobRun).order_by(
            LineageJobRun.started_at.desc()
        ).limit(10).all()
        
        return {
            "overview": {
                "total_active_edges": total_edges,
                "total_active_jobs": total_jobs,
                "tables_with_upstream_lineage": tables_with_upstream,
                "tables_with_downstream_lineage": tables_with_downstream
            },
            "edge_breakdown": {
                "by_type": [{"type": edge_type, "count": count} for edge_type, count in edge_types],
                "by_source": [{"source": source_type, "count": count} for source_type, count in source_types]
            },
            "recent_job_runs": [
                {
                    "job_name": run.job.name,
                    "run_id": run.run_id,
                    "status": run.status,
                    "started_at": run.started_at,
                    "tables_processed": run.tables_processed,
                    "lineage_edges_created": run.lineage_edges_created
                }
                for run in recent_runs
            ]
        }
        
    except Exception as e:
        logger.error("Failed to get lineage statistics", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get lineage statistics"
        )