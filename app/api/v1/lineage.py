from collections.abc import Set
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, func
from sqlalchemy.exc import DatabaseError
from typing import List, Dict, Any, Optional
import structlog
import logging
from ...core.database import get_db
from ...core.security import get_current_user
from ...models.lineage import LineageEdge, LineageJob, LineageJobRun, LineageImpactAnalysis, LineageTypeEnum
from ...models.table import Table, Column 
from ...models.user import User
from ...schemas.common import SuccessResponse, ColumnResponse


logger = structlog.get_logger()
router = APIRouter()

"""create a new lineage connection node, need to add the logic is_active  = False"""
@router.get("/table/{table_id}/add_new_table_node")
async def get_table_basic_details(
    table_id: int,
    db: Session = Depends(get_db)
):
    """Get basic table information for creating a new table node."""
    try:
        # Verify table exists and get basic information
        table = db.query(Table).options(
            joinedload(Table.data_source)
        ).filter(Table.id == table_id).first()
        
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table with ID {table_id} not found"
            )

        # Return the requested fields including upstream/downstream tables
        return {
            "table_id": table.id,
            "table_name": table.name,
            "schema_name": table.schema_name,
            "data_source_name": table.data_source.name if table.data_source else None,
            "data_source_type": table.data_source.type if table.data_source else None,
            "description": table.description,
            "upstream_tables": table.upstream_tables or [],  # NEW
            "downstream_tables": table.downstream_tables or []  # NEW
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to get table details", 
            table_id=table_id, 
            error=str(e), 
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get table details"
        )


""" list the inactive tables """
@router.get("/table/{table_id}/add_new_connection")
async def get_inactive_tables_for_connection(
    table_id: int,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    schema_name: Optional[str] = Query(None, description="Filter by schema name"),
    data_source_id: Optional[int] = Query(None, description="Filter by data source ID"),
    search: Optional[str] = Query(None, description="Search by table name"),
    db: Session = Depends(get_db)
):
    """Get all inactive tables that can be connected as new lineage connections."""
    try:
        # Verify the source table exists
        source_table = db.query(Table).filter(Table.id == table_id).first()
        if not source_table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source table not found"
            )

        # Build query for inactive tables
        query = db.query(Table).filter(
            Table.is_active == False,
            Table.id != table_id  # Exclude the source table itself
        ).options(joinedload(Table.data_source))

        # Apply filters
        if schema_name:
            query = query.filter(Table.schema_name == schema_name)
        
        if data_source_id:
            query = query.filter(Table.data_source_id == data_source_id)
        
        if search:
            query = query.filter(Table.name.ilike(f"%{search}%"))

        # Get total count before pagination
        total_count = query.count()

        # Apply pagination
        inactive_tables = query.order_by(Table.name).offset(skip).limit(limit).all()

        # Prepare response with upstream/downstream tables
        response_data = {
            "source_table": {
                "table_id": source_table.id,
                "table_name": source_table.name,
                "schema_name": source_table.schema_name,
                "data_source_name": source_table.data_source.name if source_table.data_source else None,
                "upstream_tables": source_table.upstream_tables or [],  # NEW
                "downstream_tables": source_table.downstream_tables or []  # NEW
            },
            "available_tables": [
                {
                    "table_id": table.id,
                    "table_name": table.name,
                    "schema_name": table.schema_name,
                    "data_source_name": table.data_source.name if table.data_source else None,
                    "table_type": table.table_type,
                    "created_at": table.created_at,
                    "description": table.description,
                    "upstream_tables": table.upstream_tables or [],  # NEW
                    "downstream_tables": table.downstream_tables or []  # NEW
                }
                for table in inactive_tables
            ],
            "metadata": {
                "total_inactive_tables": total_count,
                "returned_count": len(inactive_tables),
                "skip": skip,
                "limit": limit,
                "filters_applied": {
                    "schema_name": schema_name,
                    "data_source_id": data_source_id,
                    "search_term": search
                }
            }
        }

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Failed to get inactive tables for connection", 
            table_id=table_id, 
            error=str(e), 
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get available tables for new connection"
        )

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
            "data_source_name": table.data_source.name if table.data_source else None,
            "data_source_type": table.data_source.type if table.data_source else None,
            "data_source_base64_url": table.data_source_base64_url,
            "upstream_tables": []
        }
        
        for edge in upstream_edges:
            if edge.source_table:
                lineage_data["upstream_tables"].append({
                    "table_id": edge.source_table.id,
                    "table_name": edge.source_table.name,
                    "schema_name": edge.source_table.schema_name,
                    "data_source_name": edge.source_table.data_source.name,
                    "data_source_type": edge.source_table.data_source.type,
                    "data_source_base64_url": edge.source_table.data_source_base64_url, 
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
            "data_source_name": table.data_source.name if table.data_source else None,
            "data_source_type": table.data_source.type if table.data_source else None,
            "data_source_base64_url": table.data_source_base64_url,
            "downstream_tables": []
        }

        for edge in downstream_edges:
            if edge.target_table:
                lineage_data["downstream_tables"].append({
                    "table_id": edge.target_table.id,
                    "table_name": edge.target_table.name,
                    "schema_name": edge.target_table.schema_name,
                    "data_source_name": edge.target_table.data_source.name,
                    "data_source_type": edge.target_table.data_source.type,
                    "data_source_base64_url": edge.target_table.data_source_base64_url,
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

"""Get the full graph for a table including upstream and downstream lineage."""
@router.get("/table/{table_id}/full-graph", tags=["Lineage"])
async def get_full_lineage_graph(
    table_id: int,
    max_depth: int = Query(3, ge=1, le=10, description="Maximum lineage depth to traverse"),
    include_columns: bool = Query(False, description="Include column-level lineage details"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of edges per direction"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Get the complete lineage graph for a given table, including both upstream
    (sources) and downstream (dependencies)
    """
    try:
        if table_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table ID must be a positive integer"
            )

        with db.begin():
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
                seen_edges = set()  # To deduplicate edges

                # Define query options for efficient loading
                query_options = [
                    selectinload(LineageEdge.source_table).selectinload(Table.data_source),
                    selectinload(LineageEdge.target_table).selectinload(Table.data_source),
                    selectinload(LineageEdge.source_column).selectinload(Column.table).selectinload(Table.data_source),
                    selectinload(LineageEdge.target_column).selectinload(Column.table).selectinload(Table.data_source),
                ]

                # Filter for active edges
                def active_edges(query):
                    return query.filter(LineageEdge.is_active == True)

                # Define filter conditions
                if direction == "upstream":
                    table_filter = LineageEdge.target_table_id == current_table_id
                    column_filter = LineageEdge.target_column.has(Column.table_id == current_table_id)
                else:  # downstream
                    table_filter = LineageEdge.source_table_id == current_table_id
                    column_filter = LineageEdge.source_column.has(Column.table_id == current_table_id)

                # Query edges based on include_columns
                query = active_edges(db.query(LineageEdge).options(*query_options))
                if include_columns:
                    query = query.filter(or_(table_filter, column_filter))
                else:
                    query = query.filter(table_filter)
                edges = query.limit(limit).all()

                for edge in edges:
                    # Skip column_to_column edges if include_columns=False
                    if not include_columns and edge.lineage_type.value == "column_to_column":
                        continue

                    # Determine source and target tables
                    source_table = edge.source_table or (edge.source_column and edge.source_column.table)
                    target_table = edge.target_table or (edge.target_column and edge.target_column.table)
                    
                    # Skip and log malformed edges
                    if not source_table or not target_table:
                        logging.warning(f"Malformed edge found for table_id {current_table_id}: {edge.id if hasattr(edge, 'id') else 'unknown'}")
                        continue

                    # Create a unique key for deduplication
                    edge_key = (
                        source_table.id,
                        target_table.id,
                        edge.lineage_type.value,
                        edge.transformation_logic
                    )
                    if edge_key in seen_edges:
                        continue
                    seen_edges.add(edge_key)

                    # Helper to create a clean table info dictionary with upstream/downstream tables
                    def get_table_info(table: Table) -> Dict:
                        return {
                            "id": table.id,
                            "name": table.name,
                            "schema_name": table.schema_name,
                            "data_source_name": table.data_source.name if table.data_source else None,
                            "data_source_type": table.data_source.type if table.data_source else None,
                            "data_source_base64_url": table.data_source_base64_url,
                            "upstream_tables": table.upstream_tables or [],
                            "downstream_tables": table.downstream_tables or []
                        }

                    # Build the link object
                    link_info = {
                        "source_table": get_table_info(source_table),
                        "target_table": get_table_info(target_table),
                        "transformation_logic": edge.transformation_logic,
                        "depth": depth + 1,
                        "direction": direction,
                        "lineage_type": edge.lineage_type.value
                    }
                    
                    # Add column info if requested and available
                    if include_columns and edge.lineage_type.value == "column_to_column":
                        column_map = {}
                        if edge.source_column:
                            column_map["source_column"] = {
                                "id": edge.source_column.id, 
                                "name": edge.source_column.name,
                                "table_id": edge.source_column.table_id
                            }
                        if edge.target_column:
                            column_map["target_column"] = {
                                "id": edge.target_column.id, 
                                "name": edge.target_column.name,
                                "table_id": edge.target_column.table_id
                            }
                        
                        if column_map:
                            link_info["column_mapping"] = column_map
                    
                    lineage_results.append(link_info)

                    # Determine the next table for recursive traversal
                    next_table = source_table if direction == "upstream" else target_table
                    lineage_results.extend(
                        get_connected_lineage(next_table.id, direction, visited_ids, depth + 1)
                    )
                
                return lineage_results

            # 3. Fetch lineage with separate visited sets for upstream and downstream
            visited_upstream_ids: Set[int] = set()
            upstream_links = get_connected_lineage(table_id, "upstream", visited_upstream_ids)

            visited_downstream_ids: Set[int] = set()
            downstream_links = get_connected_lineage(table_id, "downstream", visited_downstream_ids)

            # 4. Assemble the final graph response object with upstream/downstream tables
            lineage_graph = {
                "center_table": {
                    "id": center_table.id,
                    "name": center_table.name,
                    "schema_name": center_table.schema_name,
                    "data_source_name": center_table.data_source.name if center_table.data_source else None,
                    "data_source_type": center_table.data_source.type if center_table.data_source else None,
                    "data_source_base64_url": center_table.data_source_base64_url,
                    "upstream_tables": center_table.upstream_tables or [],
                    "downstream_tables": center_table.downstream_tables or []
                },
                "upstream_links": upstream_links,
                "downstream_links": downstream_links,
                "metadata": {
                    "max_depth_reached": max_depth,
                    "total_upstream_links": len(upstream_links),
                    "total_downstream_links": len(downstream_links),
                    "include_columns": include_columns,
                    "center_table_upstream_count": len(center_table.upstream_tables or []),
                    "center_table_downstream_count": len(center_table.downstream_tables or [])
                }
            }
            
            return lineage_graph
        
    except HTTPException:
        raise
    except DatabaseError as db_err:
        logging.error(f"Database error while getting lineage graph for table {table_id}: {db_err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database error occurred while generating the lineage graph."
        ) from db_err
    except Exception as e:
        logging.error(f"Failed to get lineage graph for table {table_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the lineage graph."
        ) from e


"""Update the full graph for a table including upstream and downstream lineage."""
# @router.post("/table/{table_id}/update-lineage", tags=["Lineage"])
# async def update_lineage_graph(
#     table_id: int,
#     request: dict,
#     max_depth: int = Query(3, ge=1, le=10, description="Maximum lineage depth to traverse"),
#     include_columns: bool = Query(False, description="Include column-level lineage details"),
#     limit: int = Query(100, ge=1, le=1000, description="Maximum number of edges per direction"),
#     db: Session = Depends(get_db)
# ) -> Dict:
#     """
#     Update lineage graph by adding new connections and return the updated lineage graph.
#     This creates actual LineageEdge records in the database.
#     """
#     try:
#         # Validate request parameters
#         if table_id <= 0:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Table ID must be a positive integer"
#             )

#         # Extract request parameters
#         new_table_id = request.get('new_table_id')
#         connection_table_id = request.get('connection_table_id')
#         connection_type = request.get('connection_type')
#         table_name = request.get('table_name')
#         schema_name = request.get('schema_name')
#         data_source_name = request.get('data_source_name')
#         description = request.get('description')
#         transformation_logic = request.get('transformation_logic', description)

#         # Validate required fields
#         if not all([new_table_id, connection_table_id, connection_type]):
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="new_table_id, connection_table_id, and connection_type are required"
#             )

#         if connection_type not in ['upstream', 'downstream']:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="connection_type must be either 'upstream' or 'downstream'"
#             )

#         with db.begin():
#             # 1. Verify that the central table exists
#             center_table = db.query(Table).filter(Table.id == table_id).first()
#             if not center_table:
#                 raise HTTPException(
#                     status_code=status.HTTP_404_NOT_FOUND,
#                     detail=f"Table with id {table_id} not found"
#                 )

#             # 2. Verify that the connection table exists
#             connection_table = db.query(Table).filter(Table.id == connection_table_id).first()
#             if not connection_table:
#                 raise HTTPException(
#                     status_code=status.HTTP_404_NOT_FOUND,
#                     detail=f"Connection table with id {connection_table_id} not found"
#                 )

#             # 3. Verify that the new table exists
#             new_table = db.query(Table).filter(Table.id == new_table_id).first()
#             if not new_table:
#                 raise HTTPException(
#                     status_code=status.HTTP_404_NOT_FOUND,
#                     detail=f"New table with id {new_table_id} not found"
#                 )

#             # 4. Determine source and target tables based on connection type
#             if connection_type == "upstream":
#                 source_table_id = new_table_id
#                 target_table_id = connection_table_id
#             else:  # downstream
#                 source_table_id = connection_table_id
#                 target_table_id = new_table_id

#             # 5. Check if lineage edge already exists
#             existing_edge = db.query(LineageEdge).filter(
#                 LineageEdge.source_table_id == source_table_id,
#                 LineageEdge.target_table_id == target_table_id,
#                 LineageEdge.is_active == True
#             ).first()

#             if existing_edge:
#                 # Update existing edge
#                 existing_edge.transformation_logic = transformation_logic
#                 existing_edge.transformation_type = "manual"
#                 existing_edge.confidence_score = 100  # Manual connections have high confidence
#                 existing_edge.is_verified = True
#                 existing_edge.verified_at = func.now()
#                 existing_edge.last_observed_at = func.now()
#                 logger.info(f"Updated existing lineage edge: {source_table_id} -> {target_table_id}")
#             else:
#                 # 6. Create new lineage edge
#                 lineage_edge = LineageEdge(
#                     source_table_id=source_table_id,
#                     target_table_id=target_table_id,
#                     lineage_type=LineageTypeEnum.TABLE_TO_TABLE,
#                     source_type="MANUAL",
#                     transformation_logic=transformation_logic,
#                     transformation_type="manual",
#                     confidence_score=100,  # Manual connections have high confidence
#                     is_verified=True,
#                     verified_at=func.now(),
#                     is_active=True,
#                     last_observed_at=func.now()
#                 )
#                 db.add(lineage_edge)
#                 logger.info(f"Created new lineage edge: {source_table_id} -> {target_table_id}")

#             # 7. Update the tables' upstream/downstream arrays
#             if connection_type == "upstream":
#                 # For upstream: new_table -> connection_table
#                 # Add connection_table to new_table's downstream_tables
#                 if connection_table.name not in (new_table.downstream_tables or []):
#                     current_downstream = new_table.downstream_tables or []
#                     current_downstream.append(connection_table.name)
#                     new_table.downstream_tables = current_downstream
                
#                 # Add new_table to connection_table's upstream_tables
#                 if new_table.name not in (connection_table.upstream_tables or []):
#                     current_upstream = connection_table.upstream_tables or []
#                     current_upstream.append(new_table.name)
#                     connection_table.upstream_tables = current_upstream
#             else:  # downstream
#                 # For downstream: connection_table -> new_table
#                 # Add new_table to connection_table's downstream_tables
#                 if new_table.name not in (connection_table.downstream_tables or []):
#                     current_downstream = connection_table.downstream_tables or []
#                     current_downstream.append(new_table.name)
#                     connection_table.downstream_tables = current_downstream
                
#                 # Add connection_table to new_table's upstream_tables
#                 if connection_table.name not in (new_table.upstream_tables or []):
#                     current_upstream = new_table.upstream_tables or []
#                     current_upstream.append(connection_table.name)
#                     new_table.upstream_tables = current_upstream

#             # 8. Commit all changes
#             db.commit()

#             # 9. Define the recursive function to traverse the lineage graph (same as GET endpoint)
#             def get_connected_lineage(
#                 current_table_id: int,
#                 direction: str,
#                 visited_ids: Set[int],
#                 depth: int = 0
#             ) -> List[Dict]:
#                 """Recursively fetches lineage, avoiding circular dependencies."""
#                 if depth >= max_depth or current_table_id in visited_ids:
#                     return []

#                 visited_ids.add(current_table_id)
#                 lineage_results = []
#                 seen_edges = set()  # To deduplicate edges

#                 # Define query options for efficient loading
#                 query_options = [
#                     selectinload(LineageEdge.source_table).selectinload(Table.data_source),
#                     selectinload(LineageEdge.target_table).selectinload(Table.data_source),
#                     selectinload(LineageEdge.source_column).selectinload(Column.table).selectinload(Table.data_source),
#                     selectinload(LineageEdge.target_column).selectinload(Column.table).selectinload(Table.data_source),
#                 ]

#                 # Filter for active edges
#                 def active_edges(query):
#                     return query.filter(LineageEdge.is_active == True)

#                 # Define filter conditions
#                 if direction == "upstream":
#                     table_filter = LineageEdge.target_table_id == current_table_id
#                     column_filter = LineageEdge.target_column.has(Column.table_id == current_table_id)
#                 else:  # downstream
#                     table_filter = LineageEdge.source_table_id == current_table_id
#                     column_filter = LineageEdge.source_column.has(Column.table_id == current_table_id)

#                 # Query edges based on include_columns
#                 query = active_edges(db.query(LineageEdge).options(*query_options))
#                 if include_columns:
#                     query = query.filter(or_(table_filter, column_filter))
#                 else:
#                     query = query.filter(table_filter)
#                 edges = query.limit(limit).all()

#                 for edge in edges:
#                     # Skip column_to_column edges if include_columns=False
#                     if not include_columns and edge.lineage_type.value == "column_to_column":
#                         continue

#                     # Determine source and target tables
#                     source_table = edge.source_table or (edge.source_column and edge.source_column.table)
#                     target_table = edge.target_table or (edge.target_column and edge.target_column.table)
                    
#                     # Skip and log malformed edges
#                     if not source_table or not target_table:
#                         logging.warning(f"Malformed edge found for table_id {current_table_id}: {edge.id if hasattr(edge, 'id') else 'unknown'}")
#                         continue

#                     # Create a unique key for deduplication
#                     edge_key = (
#                         source_table.id,
#                         target_table.id,
#                         edge.lineage_type.value,
#                         edge.transformation_logic
#                     )
#                     if edge_key in seen_edges:
#                         continue
#                     seen_edges.add(edge_key)

#                     # Helper to create a clean table info dictionary
#                     def get_table_info(table: Table) -> Dict:
#                         return {
#                             "id": table.id,
#                             "name": table.name,
#                             "schema_name": table.schema_name,
#                             "data_source_name": table.data_source.name if table.data_source else None,
#                         }

#                     # Build the link object
#                     link_info = {
#                         "source_table": get_table_info(source_table),
#                         "target_table": get_table_info(target_table),
#                         "transformation_logic": edge.transformation_logic,
#                         "depth": depth + 1,
#                         "direction": direction,
#                         "lineage_type": edge.lineage_type.value
#                     }
                    
#                     # Add column info if requested and available
#                     if include_columns and edge.lineage_type.value == "column_to_column":
#                         column_map = {}
#                         if edge.source_column:
#                             column_map["source_column"] = {"id": edge.source_column.id, "name": edge.source_column.name}
#                         if edge.target_column:
#                             column_map["target_column"] = {"id": edge.target_column.id, "name": edge.target_column.name}
                        
#                         if column_map:
#                             link_info["column_mapping"] = column_map
                    
#                     lineage_results.append(link_info)

#                     # Determine the next table for recursive traversal
#                     next_table = source_table if direction == "upstream" else target_table
#                     lineage_results.extend(
#                         get_connected_lineage(next_table.id, direction, visited_ids, depth + 1)
#                     )
                
#                 return lineage_results

#             # 10. Fetch updated lineage (including the new connection)
#             visited_upstream_ids: Set[int] = set()
#             upstream_links = get_connected_lineage(table_id, "upstream", visited_upstream_ids)

#             visited_downstream_ids: Set[int] = set()
#             downstream_links = get_connected_lineage(table_id, "downstream", visited_downstream_ids)

#             # 11. Create the new connection link for the response
#             new_connection_link = {
#                 "source_table": {
#                     "id": source_table_id,
#                     "name": new_table.name if source_table_id == new_table_id else connection_table.name,
#                     "schema_name": new_table.schema_name if source_table_id == new_table_id else connection_table.schema_name,
#                     "data_source_name": new_table.data_source.name if source_table_id == new_table_id and new_table.data_source else connection_table.data_source.name if connection_table.data_source else None
#                 },
#                 "target_table": {
#                     "id": target_table_id,
#                     "name": new_table.name if target_table_id == new_table_id else connection_table.name,
#                     "schema_name": new_table.schema_name if target_table_id == new_table_id else connection_table.schema_name,
#                     "data_source_name": new_table.data_source.name if target_table_id == new_table_id and new_table.data_source else connection_table.data_source.name if connection_table.data_source else None
#                 },
#                 "transformation_logic": transformation_logic,
#                 "depth": 0,
#                 "direction": connection_type,
#                 "lineage_type": "table_to_table"
#             }

#             # 12. Add the new connection to the appropriate links array
#             if connection_type == "upstream":
#                 upstream_links.append(new_connection_link)
#             else:
#                 downstream_links.append(new_connection_link)

#             # 13. Assemble the final graph response object
#             lineage_graph = {
#                 "center_table": {
#                     "id": center_table.id,
#                     "name": center_table.name,
#                     "schema_name": center_table.schema_name,
#                     "data_source_name": center_table.data_source.name if center_table.data_source else None
#                 },
#                 "upstream_links": upstream_links,
#                 "downstream_links": downstream_links,
#                 "metadata": {
#                     "max_depth_reached": max_depth,
#                     "total_upstream_links": len(upstream_links),
#                     "total_downstream_links": len(downstream_links),
#                     "include_columns": include_columns,
#                     "database_updated": True,
#                     "lineage_edge_created": not existing_edge,
#                     "lineage_edge_updated": bool(existing_edge),
#                     "connection_type": connection_type,
#                     "new_table_id": new_table_id,
#                     "connected_to_table_id": connection_table_id,
#                     "source_table_id": source_table_id,
#                     "target_table_id": target_table_id
#                 }
#             }
            
#             return lineage_graph
        
#     except HTTPException:
#         db.rollback()
#         raise
#     except DatabaseError as db_err:
#         db.rollback()
#         logging.error(f"Database error while updating lineage graph for table {table_id}: {db_err}", exc_info=True)
#         raise HTTPException(
#             status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
#             detail="Database error occurred while updating the lineage graph."
#         ) from db_err
#     except Exception as e:
#         db.rollback()
#         logging.error(f"Failed to update lineage graph for table {table_id}: {e}", exc_info=True)
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="An unexpected error occurred while updating the lineage graph."
#         ) from e

from pydantic import BaseModel
from typing import List, Optional

class UpdateLineageRequest(BaseModel):
    new_table_id: int
    connection_table_id: int
    connection_type: str
    table_name: Optional[str] = None
    schema_name: Optional[str] = None
    data_source_name: Optional[str] = None
    description: Optional[str] = None
    upstream_table: Optional[List[str]] = None
    downstream_table: Optional[List[str]] = None
    transformation_logic: Optional[str] = None

@router.post("/table/{table_id}/update-lineage", tags=["Lineage"])
async def update_lineage_graph(
    table_id: int,
    request: UpdateLineageRequest,
    max_depth: int = Query(3, ge=1, le=10, description="Maximum lineage depth to traverse"),
    include_columns: bool = Query(False, description="Include column-level lineage details"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of edges per direction"),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Update lineage graph by adding new connections and return the updated lineage graph.
    This creates actual LineageEdge records in the database.
    """
    try:
        # Validate request parameters
        if table_id <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Table ID must be a positive integer"
            )

        # Extract request parameters from the validated model
        new_table_id = request.new_table_id
        connection_table_id = request.connection_table_id
        connection_type = request.connection_type
        table_name = request.table_name
        schema_name = request.schema_name
        data_source_name = request.data_source_name
        description = request.description
        transformation_logic = request.transformation_logic or description

        # Validate required fields
        if connection_type not in ['upstream', 'downstream']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="connection_type must be either 'upstream' or 'downstream'"
            )

        # 1. Verify that the central table exists
        center_table = db.query(Table).filter(Table.id == table_id).first()
        if not center_table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table with id {table_id} not found"
            )

        # 2. Verify that the connection table exists
        connection_table = db.query(Table).filter(Table.id == connection_table_id).first()
        if not connection_table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connection table with id {connection_table_id} not found"
            )

        # 3. Verify that the new table exists
        new_table = db.query(Table).filter(Table.id == new_table_id).first()
        if not new_table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"New table with id {new_table_id} not found"
            )

        # 4. Determine source and target tables based on connection type
        if connection_type == "upstream":
            source_table_id = new_table_id
            target_table_id = connection_table_id
        else:  # downstream
            source_table_id = connection_table_id
            target_table_id = new_table_id

        # 5. Check if lineage edge already exists
        existing_edge = db.query(LineageEdge).filter(
            LineageEdge.source_table_id == source_table_id,
            LineageEdge.target_table_id == target_table_id,
            LineageEdge.is_active == True
        ).first()

        # 6. Update database - perform all database operations in a transaction
        try:
            if existing_edge:
                # Update existing edge
                existing_edge.transformation_logic = transformation_logic
                existing_edge.transformation_type = "manual"
                existing_edge.confidence_score = 100  # Manual connections have high confidence
                existing_edge.is_verified = True
                existing_edge.verified_by = None  # Remove user dependency
                existing_edge.verified_at = func.now()
                existing_edge.last_observed_at = func.now()
                logger.info(f"Updated existing lineage edge: {source_table_id} -> {target_table_id}")
            else:
                # Create new lineage edge
                lineage_edge = LineageEdge(
                    source_table_id=source_table_id,
                    target_table_id=target_table_id,
                    lineage_type=LineageTypeEnum.TABLE_TO_TABLE,
                    source_type="MANUAL",
                    transformation_logic=transformation_logic,
                    transformation_type="manual",
                    confidence_score=100,  # Manual connections have high confidence
                    is_verified=True,
                    verified_by=None,  # Remove user dependency
                    verified_at=func.now(),
                    is_active=True,
                    last_observed_at=func.now()
                )
                db.add(lineage_edge)
                logger.info(f"Created new lineage edge: {source_table_id} -> {target_table_id}")

            # 7. Update the tables' upstream/downstream arrays
            if connection_type == "upstream":
                # For upstream: new_table -> connection_table
                # Add connection_table to new_table's downstream_tables
                if connection_table.name not in (new_table.downstream_tables or []):
                    current_downstream = new_table.downstream_tables or []
                    current_downstream.append(connection_table.name)
                    new_table.downstream_tables = current_downstream
                
                # Add new_table to connection_table's upstream_tables
                if new_table.name not in (connection_table.upstream_tables or []):
                    current_upstream = connection_table.upstream_tables or []
                    current_upstream.append(new_table.name)
                    connection_table.upstream_tables = current_upstream
            else:  # downstream
                # For downstream: connection_table -> new_table
                # Add new_table to connection_table's downstream_tables
                if new_table.name not in (connection_table.downstream_tables or []):
                    current_downstream = connection_table.downstream_tables or []
                    current_downstream.append(new_table.name)
                    connection_table.downstream_tables = current_downstream
                
                # Add connection_table to new_table's upstream_tables
                if connection_table.name not in (new_table.upstream_tables or []):
                    current_upstream = new_table.upstream_tables or []
                    current_upstream.append(connection_table.name)
                    new_table.upstream_tables = current_upstream

            # Commit all database changes
            db.commit()
            
        except Exception as db_error:
            db.rollback()
            logger.error(f"Database error during lineage update: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update lineage in database"
            )

        # 8. Now fetch the updated lineage graph using a separate session context
        # Define the recursive function to traverse the lineage graph
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
            seen_edges = set()  # To deduplicate edges

            # Define query options for efficient loading
            query_options = [
                selectinload(LineageEdge.source_table).selectinload(Table.data_source),
                selectinload(LineageEdge.target_table).selectinload(Table.data_source),
                selectinload(LineageEdge.source_column).selectinload(Column.table).selectinload(Table.data_source),
                selectinload(LineageEdge.target_column).selectinload(Column.table).selectinload(Table.data_source),
            ]

            # Filter for active edges
            def active_edges(query):
                return query.filter(LineageEdge.is_active == True)

            # Define filter conditions
            if direction == "upstream":
                table_filter = LineageEdge.target_table_id == current_table_id
                column_filter = LineageEdge.target_column.has(Column.table_id == current_table_id)
            else:  # downstream
                table_filter = LineageEdge.source_table_id == current_table_id
                column_filter = LineageEdge.source_column.has(Column.table_id == current_table_id)

            # Query edges based on include_columns
            query = active_edges(db.query(LineageEdge).options(*query_options))
            if include_columns:
                query = query.filter(or_(table_filter, column_filter))
            else:
                query = query.filter(table_filter)
            edges = query.limit(limit).all()

            for edge in edges:
                # Skip column_to_column edges if include_columns=False
                if not include_columns and edge.lineage_type.value == "column_to_column":
                    continue

                # Determine source and target tables
                source_table = edge.source_table or (edge.source_column and edge.source_column.table)
                target_table = edge.target_table or (edge.target_column and edge.target_column.table)
                
                # Skip and log malformed edges
                if not source_table or not target_table:
                    logging.warning(f"Malformed edge found for table_id {current_table_id}: {edge.id if hasattr(edge, 'id') else 'unknown'}")
                    continue

                # Create a unique key for deduplication
                edge_key = (
                    source_table.id,
                    target_table.id,
                    edge.lineage_type.value,
                    edge.transformation_logic
                )
                if edge_key in seen_edges:
                    continue
                seen_edges.add(edge_key)

                # Helper to create a clean table info dictionary
                def get_table_info(table: Table) -> Dict:
                    return {
                        "id": table.id,
                        "name": table.name,
                        "schema_name": table.schema_name,
                        "data_source_name": table.data_source.name if table.data_source else None,
                    }

                # Build the link object
                link_info = {
                    "source_table": get_table_info(source_table),
                    "target_table": get_table_info(target_table),
                    "transformation_logic": edge.transformation_logic,
                    "depth": depth + 1,
                    "direction": direction,
                    "lineage_type": edge.lineage_type.value
                }
                
                # Add column info if requested and available
                if include_columns and edge.lineage_type.value == "column_to_column":
                    column_map = {}
                    if edge.source_column:
                        column_map["source_column"] = {"id": edge.source_column.id, "name": edge.source_column.name}
                    if edge.target_column:
                        column_map["target_column"] = {"id": edge.target_column.id, "name": edge.target_column.name}
                    
                    if column_map:
                        link_info["column_mapping"] = column_map
                
                lineage_results.append(link_info)

                # Determine the next table for recursive traversal
                next_table = source_table if direction == "upstream" else target_table
                lineage_results.extend(
                    get_connected_lineage(next_table.id, direction, visited_ids, depth + 1)
                )
            
            return lineage_results

        # 9. Fetch updated lineage (including the new connection)
        visited_upstream_ids: Set[int] = set()
        upstream_links = get_connected_lineage(table_id, "upstream", visited_upstream_ids)

        visited_downstream_ids: Set[int] = set()
        downstream_links = get_connected_lineage(table_id, "downstream", visited_downstream_ids)

        # 10. Create the new connection link for the response
        new_connection_link = {
            "source_table": {
                "id": source_table_id,
                "name": new_table.name if source_table_id == new_table_id else connection_table.name,
                "schema_name": new_table.schema_name if source_table_id == new_table_id else connection_table.schema_name,
                "data_source_name": new_table.data_source.name if source_table_id == new_table_id and new_table.data_source else connection_table.data_source.name if connection_table.data_source else None
            },
            "target_table": {
                "id": target_table_id,
                "name": new_table.name if target_table_id == new_table_id else connection_table.name,
                "schema_name": new_table.schema_name if target_table_id == new_table_id else connection_table.schema_name,
                "data_source_name": new_table.data_source.name if target_table_id == new_table_id and new_table.data_source else connection_table.data_source.name if connection_table.data_source else None
            },
            "transformation_logic": transformation_logic,
            "depth": 0,
            "direction": connection_type,
            "lineage_type": "table_to_table"
        }

        # 11. Add the new connection to the appropriate links array
        if connection_type == "upstream":
            upstream_links.append(new_connection_link)
        else:
            downstream_links.append(new_connection_link)

        # 12. Assemble the final graph response object
        lineage_graph = {
            "center_table": {
                "id": center_table.id,
                "name": center_table.name,
                "schema_name": center_table.schema_name,
                "data_source_name": center_table.data_source.name if center_table.data_source else None
            },
            "upstream_links": upstream_links,
            "downstream_links": downstream_links,
            "metadata": {
                "max_depth_reached": max_depth,
                "total_upstream_links": len(upstream_links),
                "total_downstream_links": len(downstream_links),
                "include_columns": include_columns,
                "database_updated": True,
                "lineage_edge_created": not existing_edge,
                "lineage_edge_updated": bool(existing_edge),
                "connection_type": connection_type,
                "new_table_id": new_table_id,
                "connected_to_table_id": connection_table_id,
                "source_table_id": source_table_id,
                "target_table_id": target_table_id
            }
        }
        
        return lineage_graph
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Failed to update lineage graph for table {table_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while updating the lineage graph."
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