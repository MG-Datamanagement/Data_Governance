from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Generic, TypeVar
from datetime import datetime

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    page: int = Field(1, ge=1, description="Page number (starts from 1)")
    size: int = Field(20, ge=1, le=100, description="Number of items per page")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic schema for paginated responses."""
    items: List[T] = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_previous: bool = Field(..., description="Whether there are previous pages")
    total_pages: int = Field(..., description="Total number of pages")


class SearchParams(BaseModel):
    """Schema for search parameters."""
    q: Optional[str] = Field(None, min_length=1, max_length=500, description="Search query")
    domain_ids: Optional[List[int]] = Field(None, description="Filter by domain IDs")
    tag_ids: Optional[List[int]] = Field(None, description="Filter by tag IDs")
    owner_ids: Optional[List[int]] = Field(None, description="Filter by owner IDs")
    data_source_ids: Optional[List[int]] = Field(None, description="Filter by data source IDs")
    sensitivity_levels: Optional[List[str]] = Field(None, description="Filter by sensitivity levels")
    created_after: Optional[datetime] = Field(None, description="Filter by creation date")
    created_before: Optional[datetime] = Field(None, description="Filter by creation date")
    sort_by: str = Field("updated_at", description="Sort field")
    sort_order: str = Field("desc", pattern="^(asc|desc)$", description="Sort order")



class SearchResponse(BaseModel, Generic[T]):
    """Generic schema for search responses."""
    results: List[T] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    has_next: bool = Field(..., description="Whether there are more results")
    query: Optional[str] = Field(None, description="Search query used")
    query_fields: List[str] = Field(default_factory=list, description="Fields that matched the search query")
    filters_applied: Dict[str, Any] = Field(default_factory=dict, description="Filters applied")
    search_time_ms: int = Field(..., description="Search execution time in milliseconds")

class SearchSuggestion(BaseModel):
    """Schema for search suggestions."""
    text: str = Field(..., description="Suggested search text")
    type: str = Field(..., description="Suggestion type (table, column, tag, etc.)")
    category: str = Field(..., description="Suggestion category")
    score: float = Field(..., description="Relevance score")


class SearchSuggestionsResponse(BaseModel):
    """Schema for search suggestions response."""
    suggestions: List[SearchSuggestion] = Field(..., description="List of suggestions")
    query: str = Field(..., description="Original query")


class HealthCheck(BaseModel):
    """Schema for health check response."""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(..., description="Check timestamp")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Environment (dev, prod, etc.)")
    database: Dict[str, Any] = Field(..., description="Database connection status")
    redis: Dict[str, Any] = Field(..., description="Redis connection status")
    dependencies: Dict[str, Any] = Field(default_factory=dict, description="External dependencies status")


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    request_id: Optional[str] = Field(None, description="Request ID for tracing")


class SuccessResponse(BaseModel):
    """Schema for success responses."""
    success: bool = Field(True, description="Operation success status")
    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional response data")


class TagBase(BaseModel):
    """Base tag schema."""
    name: str = Field(..., min_length=1, max_length=100, description="Tag name")
    description: Optional[str] = Field(None, max_length=1000, description="Tag description")
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="Tag color (hex)")
    parent_tag_id: Optional[int] = Field(None, description="Parent tag ID for hierarchical tags")


class TagCreate(TagBase):
    """Schema for creating a tag."""
    is_system_tag: bool = Field(default=False, description="Whether this is a system tag")


class TagUpdate(BaseModel):
    """Schema for updating a tag."""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Tag name")
    description: Optional[str] = Field(None, max_length=1000, description="Tag description")
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="Tag color (hex)")
    parent_tag_id: Optional[int] = Field(None, description="Parent tag ID")
    is_active: Optional[bool] = Field(None, description="Whether tag is active")


class TagResponse(TagBase):
    """Schema for tag response."""
    id: int = Field(..., description="Tag ID")
    urn: Optional[str] = Field(None, description="Resource URN")
    is_system_tag: bool = Field(..., description="Whether this is a system tag")
    is_active: bool = Field(..., description="Whether tag is active")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    usage_count: int = Field(0, description="Number of times tag is used")
    
    class Config:
        from_attributes = True


class BulkOperation(BaseModel):
    """Schema for bulk operations."""
    operation: str = Field(..., description="Operation type (create, update, delete)")
    items: List[Dict[str, Any]] = Field(..., description="List of items to process")
    options: Optional[Dict[str, Any]] = Field(None, description="Operation options")


class BulkOperationResult(BaseModel):
    """Schema for bulk operation results."""
    total_items: int = Field(..., description="Total items processed")
    successful_items: int = Field(..., description="Successfully processed items")
    failed_items: int = Field(..., description="Failed items")
    errors: List[Dict[str, Any]] = Field(default_factory=list, description="List of errors")
    results: List[Dict[str, Any]] = Field(default_factory=list, description="Operation results")


class ActivityItem(BaseModel):
    """Schema for activity feed items."""
    id: int = Field(..., description="Activity ID")
    user_id: Optional[int] = Field(None, description="User who performed the activity")
    user_name: Optional[str] = Field(None, description="User name")
    action: str = Field(..., description="Action performed")
    resource_type: str = Field(..., description="Type of resource")
    resource_id: Optional[int] = Field(None, description="Resource ID")
    resource_name: str = Field(..., description="Resource name")
    description: str = Field(..., description="Activity description")
    timestamp: datetime = Field(..., description="Activity timestamp")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    
    class Config:
        from_attributes = True


class ActivityFeedResponse(BaseModel):
    """Schema for activity feed response."""
    activities: List[ActivityItem] = Field(..., description="List of activities")
    total: int = Field(..., description="Total number of activities")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Page size")
    has_next: bool = Field(..., description="Whether there are more activities")


class MetricsResponse(BaseModel):
    """Schema for dashboard metrics response."""
    total_assets: int = Field(0, description="Total data assets")
    certified_assets: int = Field(0, description="Certified assets")
    data_sources: int = Field(0, description="Connected data sources")
    data_owners: int = Field(0, description="Active data owners")
    tier1_assets: int = Field(0, description="Critical (Tier-1) assets")
    policy_coverage: float = Field(0.0, description="Policy coverage percentage")
    
    # Additional metrics
    active_users_last_30d: int = Field(0, description="Active users in last 30 days")
    searches_last_30d: int = Field(0, description="Searches in last 30 days")
    quality_score_avg: Optional[float] = Field(None, description="Average quality score")
    lineage_coverage: float = Field(0.0, description="Lineage coverage percentage")
    
    # Growth metrics
    assets_added_last_30d: int = Field(0, description="Assets added in last 30 days")
    users_added_last_30d: int = Field(0, description="Users added in last 30 days")


class ConnectionTestRequest(BaseModel):
    """Schema for testing data source connections."""
    connection_config: Dict[str, Any] = Field(..., description="Connection configuration")


class ConnectionTestResponse(BaseModel):
    """Schema for connection test response."""
    success: bool = Field(..., description="Whether connection test succeeded")
    message: str = Field(..., description="Test result message")
    latency_ms: Optional[int] = Field(None, description="Connection latency in milliseconds")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional test details")
    tested_at: datetime = Field(default_factory=datetime.utcnow, description="Test timestamp")