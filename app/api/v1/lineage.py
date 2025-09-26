from collections.abc import Set
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Dict, Any, Optional
import structlog

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.lineage import LineageEdge, LineageJob, LineageJobRun, LineageImpactAnalysis, LineageTypeEnum
from ...models.table import Table, Column 
from ...models.user import User
from ...schemas.common import SuccessResponse, ColumnResponse


logger = structlog.get_logger()
router = APIRouter()


@router.get("/table/{table_id}/upstream")
async def get_upstream_lineage(
    table_id: int,
    depth: int = Query(1, ge=1, le=5, description="Lineage depth"),
    db: Session = Depends(get_db)
):
    """Get upstream lineage for a table."""
    try:
        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Get upstream edges
        upstream_edges = db.query(LineageEdge).filter(
            LineageEdge.target_table_id == table_id,
            LineageEdge.is_active == True
        ).all()
        
        lineage_data = {
            "table_id": table_id,
            "table_name": table.name,
            "upstream_tables": []
        }
        
        for edge in upstream_edges:
            if edge.source_table:
                lineage_data["upstream_tables"].append({
                    "table_id": edge.source_table.id,
                    "table_name": edge.source_table.name,
                    "schema_name": edge.source_table.schema_name,
                    "data_source_name": edge.source_table.data_source.name,
                    "transformation_logic": edge.transformation_logic,
                    "confidence_score": edge.confidence_score
                })
        
        return lineage_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get upstream lineage", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get upstream lineage"
        )


@router.get("/table/{table_id}/downstream")
async def get_downstream_lineage(
    table_id: int,
    depth: int = Query(1, ge=1, le=5, description="Lineage depth"),
    db: Session = Depends(get_db)
):
    """Get downstream lineage for a table."""
    try:
        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        
        # Get downstream edges
        downstream_edges = db.query(LineageEdge).filter(
            LineageEdge.source_table_id == table_id,
            LineageEdge.is_active == True
        ).all()
        
        lineage_data = {
            "table_id": table_id,
            "table_name": table.name,
            "downstream_tables": []
        }
        
        for edge in downstream_edges:
            if edge.target_table:
                lineage_data["downstream_tables"].append({
                    "table_id": edge.target_table.id,
                    "table_name": edge.target_table.name,
                    "schema_name": edge.target_table.schema_name,
                    "data_source_name": edge.target_table.data_source.name,
                    "transformation_logic": edge.transformation_logic,
                    "confidence_score": edge.confidence_score
                })
        
        return lineage_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get downstream lineage", table_id=table_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get downstream lineage"
        )


@router.get("/table/{table_id}/full-graph", tags=["Lineage"])
async def get_full_lineage_graph(
    table_id: int,
    max_depth: int = Query(3, ge=1, le=10, description="Maximum lineage depth to traverse"),
    include_columns: bool = Query(False, description="Include column-level lineage details"),
    db: Session = Depends(get_db)
):
    """
    Get the complete lineage graph for a given table, including both upstream
    (sources) and downstream (dependencies).
    """
    try:
        # 1. Verify that the central table exists
        center_table = db.query(Table).filter(Table.id == table_id).first()
        if not center_table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table with id {table_id} not found"
            )

        # 2. Define the recursive function to traverse the lineage graph
        def get_connected_lineage(
            current_table_id: int,
            direction: str,
            visited_ids: Set[int],
            depth: int = 0
        ) -> List[Dict]:
            """Recursively fetches lineage, avoiding circular dependencies."""
            if depth >= max_depth or current_table_id in visited_ids:
                return []

            visited_ids.add(current_table_id)
            lineage_results = []

            # Eagerly load related models to prevent N+1 query problems
            query_options = [
                joinedload(LineageEdge.source_table).joinedload(Table.data_source),
                joinedload(LineageEdge.target_table).joinedload(Table.data_source)
            ]
            if include_columns:
                query_options.extend([
                    joinedload(LineageEdge.source_column),
                    joinedload(LineageEdge.target_column)
                ])

            # Determine the filter condition based on direction
            if direction == "upstream":
                filter_condition = (LineageEdge.target_table_id == current_table_id)
            else:  # downstream
                filter_condition = (LineageEdge.source_table_id == current_table_id)

            edges = db.query(LineageEdge).options(*query_options).filter(
                filter_condition,
                LineageEdge.is_active == True
            ).all()

            for edge in edges:
                # Determine the next table in the traversal
                next_table = edge.source_table if direction == "upstream" else edge.target_table
                if not next_table:
                    continue
                
                # Build the basic information for this lineage link
                lineage_info = {
                    "table_id": next_table.id,
                    "table_name": next_table.name,
                    "schema_name": next_table.schema_name,
                    "data_source_name": next_table.data_source.name if next_table.data_source else None,
                    "transformation_logic": edge.transformation_logic,
                    "depth": depth + 1,
                    "direction": direction,
                    "lineage_type": edge.lineage_type.value
                }
                
                # If requested, add the full column objects for column-level lineage
                if include_columns and edge.lineage_type == LineageTypeEnum.COLUMN_TO_COLUMN:
                    if edge.source_column and edge.target_column:
                        lineage_info["column_mapping"] = {
                            "source_column": ColumnResponse.model_validate(edge.source_column),
                            "target_column": ColumnResponse.model_validate(edge.target_column)
                        }
                
                lineage_results.append(lineage_info)

                # Recursively call for the next level
                lineage_results.extend(
                    get_connected_lineage(next_table.id, direction, visited_ids, depth + 1)
                )
            
            return lineage_results

        # 3. Fetch both upstream and downstream lineage starting from the center table
        visited_upstream_ids = set()
        upstream_tables = get_connected_lineage(table_id, "upstream", visited_upstream_ids)

        visited_downstream_ids = set()
        downstream_tables = get_connected_lineage(table_id, "downstream", visited_downstream_ids)

        # 4. Assemble the final graph response object
        lineage_graph = {
            "center_table": {
                "table_id": center_table.id,
                "table_name": center_table.name,
                "schema_name": center_table.schema_name,
                "data_source_name": center_table.data_source.name if center_table.data_source else None
            },
            "upstream_tables": upstream_tables,
            "downstream_tables": downstream_tables,
            "metadata": {
                "max_depth_reached": max_depth,
                "total_upstream_nodes": len(upstream_tables),
                "total_downstream_nodes": len(downstream_tables),
                "include_columns": include_columns
            }
        }
        
        return lineage_graph
        
    except HTTPException:
        # Re-raise HTTP exceptions to let FastAPI handle them
        raise
    except Exception as e:
        # Log the error for debugging
        # logger.error(f"Failed to get lineage graph for table {table_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the lineage graph."
        )

@router.get("/table/{table_id}/impact-analysis")
async def get_impact_analysis(
    table_id: int,
    db: Session = Depends(get_db)
):
    """Get impact analysis for a table."""
    try:
        # Verify table exists
        table = db.query(Table).filter(Table.id == table_id).first()
        if not table:
            return {
                "detail": "Table not found",
                "impact_analysis": "Data not available"
            }
        
        # Get impact analysis
        analysis = db.query(LineageImpactAnalysis).filter(
            LineageImpactAnalysis.table_id == table_id
        ).first()
        
        if not analysis:
            return {
                "detail": "Impact analysis not found for this table",
                "impact_analysis": "Data not available"
            }
        
        return {
            "table_id": table_id,
            "table_name": table.name,
            "impact_analysis": {
                "upstream_table_count": analysis.upstream_table_count,
                "upstream_column_count": analysis.upstream_column_count,
                "max_upstream_depth": analysis.max_upstream_depth,
                "downstream_table_count": analysis.downstream_table_count,
                "downstream_column_count": analysis.downstream_column_count,
                "max_downstream_depth": analysis.max_downstream_depth,
                "is_critical_path": analysis.is_critical_path,
                "criticality_score": analysis.criticality_score,
                "impact_radius": analysis.impact_radius,
                "upstream_tables": analysis.upstream_tables,
                "downstream_tables": analysis.downstream_tables,
                "last_computed_at": analysis.last_computed_at,
                "analysis_version": analysis.analysis_version
            }
        }
        
    except Exception as e:
        logger.error("Failed to get impact analysis", table_id=table_id, error=str(e), exc_info=True)
        return {
            "detail": "Failed to get impact analysis",
            "impact_analysis": "Data not available"
        }


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