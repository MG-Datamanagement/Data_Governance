"""
API v1 endpoints for MetaPortal.
"""

from .auth import router as auth_router
from .users import router as users_router  
from .data_sources import router as data_sources_router
from .tables import router as tables_router
from .domains import router as domains_router
from .tags import router as tags_router
from .search import router as search_router
from .lineage import router as lineage_router
from .quality import router as quality_router

__all__ = [
    "auth_router",
    "users_router", 
    "data_sources_router",
    "tables_router",
    "domains_router", 
    "tags_router",
    "search_router",
    "lineage_router",
    "quality_router"
]