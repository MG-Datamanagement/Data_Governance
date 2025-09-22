from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import time
import psutil
import json
from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from threading import Lock
import structlog
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, generate_latest
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import redis
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db

logger = structlog.get_logger("monitoring")

# Prometheus metrics
REGISTRY = CollectorRegistry()

# Request metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code'],
    registry=REGISTRY
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint'],
    registry=REGISTRY
)

REQUEST_SIZE = Histogram(
    'http_request_size_bytes',
    'HTTP request size',
    ['method', 'endpoint'],
    registry=REGISTRY
)

RESPONSE_SIZE = Histogram(
    'http_response_size_bytes',
    'HTTP response size',
    ['method', 'endpoint'],
    registry=REGISTRY
)

# System metrics
ACTIVE_CONNECTIONS = Gauge(
    'active_connections',
    'Number of active connections',
    registry=REGISTRY
)

MEMORY_USAGE = Gauge(
    'memory_usage_bytes',
    'Memory usage in bytes',
    ['type'],
    registry=REGISTRY
)

CPU_USAGE = Gauge(
    'cpu_usage_percent',
    'CPU usage percentage',
    registry=REGISTRY
)

DISK_USAGE = Gauge(
    'disk_usage_percent',
    'Disk usage percentage',
    ['mount'],
    registry=REGISTRY
)

# Application metrics
DATABASE_CONNECTIONS = Gauge(
    'database_connections',
    'Number of database connections',
    ['state'],
    registry=REGISTRY
)

CACHE_HITS = Counter(
    'cache_hits_total',
    'Total cache hits',
    ['cache_type'],
    registry=REGISTRY
)

CACHE_MISSES = Counter(
    'cache_misses_total',
    'Total cache misses',
    ['cache_type'],
    registry=REGISTRY
)

BUSINESS_METRICS = Counter(
    'business_events_total',
    'Business events',
    ['event_type', 'status'],
    registry=REGISTRY
)

# Security metrics
AUTHENTICATION_ATTEMPTS = Counter(
    'authentication_attempts_total',
    'Authentication attempts',
    ['result', 'method'],
    registry=REGISTRY
)

RATE_LIMIT_HITS = Counter(
    'rate_limit_hits_total',
    'Rate limit hits',
    ['endpoint'],
    registry=REGISTRY
)

SECURITY_VIOLATIONS = Counter(
    'security_violations_total',
    'Security violations',
    ['violation_type'],
    registry=REGISTRY
)


@dataclass
class MetricPoint:
    """Single metric data point."""
    timestamp: datetime
    value: float
    labels: Dict[str, str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


@dataclass
class Alert:
    """Alert definition."""
    name: str
    condition: str
    threshold: float
    severity: str
    message: str
    enabled: bool = True
    cooldown: int = 300  # 5 minutes


class MetricsCollector:
    """Collects and stores application metrics."""
    
    def __init__(self, max_points: int = 1000):
        self.metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_points))
        self.lock = Lock()
        self.alerts: List[Alert] = []
        self.alert_states: Dict[str, datetime] = {}
        self.redis_client = redis.Redis.from_url(settings.redis_url) if settings.redis_url else None
    
    def record_metric(self, name: str, value: float, labels: Dict[str, str] = None):
        """Record a metric point."""
        with self.lock:
            point = MetricPoint(
                timestamp=datetime.utcnow(),
                value=value,
                labels=labels or {}
            )
            self.metrics[name].append(point)
            
            # Store in Redis for persistence
            if self.redis_client:
                try:
                    key = f"metric:{name}"
                    data = json.dumps(point.to_dict(), default=str)
                    self.redis_client.lpush(key, data)
                    self.redis_client.expire(key, 3600)  # 1 hour TTL
                except Exception as e:
                    logger.error("Failed to store metric in Redis", error=str(e))
    
    def get_metrics(self, name: str, start_time: datetime = None, end_time: datetime = None) -> List[MetricPoint]:
        """Get metric points for a given time range."""
        with self.lock:
            points = list(self.metrics[name])
            
            if start_time or end_time:
                filtered_points = []
                for point in points:
                    if start_time and point.timestamp < start_time:
                        continue
                    if end_time and point.timestamp > end_time:
                        continue
                    filtered_points.append(point)
                return filtered_points
            
            return points
    
    def get_latest_value(self, name: str) -> Optional[float]:
        """Get the latest value for a metric."""
        with self.lock:
            if name in self.metrics and self.metrics[name]:
                return self.metrics[name][-1].value
            return None
    
    def get_average(self, name: str, duration: timedelta = timedelta(minutes=5)) -> Optional[float]:
        """Get average value over a duration."""
        end_time = datetime.utcnow()
        start_time = end_time - duration
        points = self.get_metrics(name, start_time, end_time)
        
        if not points:
            return None
        
        return sum(p.value for p in points) / len(points)
    
    def add_alert(self, alert: Alert):
        """Add an alert rule."""
        self.alerts.append(alert)
        logger.info("Alert added", alert_name=alert.name, threshold=alert.threshold)
    
    def check_alerts(self):
        """Check all alert conditions."""
        current_time = datetime.utcnow()
        
        for alert in self.alerts:
            if not alert.enabled:
                continue
            
            # Check cooldown
            if alert.name in self.alert_states:
                if current_time - self.alert_states[alert.name] < timedelta(seconds=alert.cooldown):
                    continue
            
            # Evaluate condition
            try:
                if self._evaluate_alert_condition(alert):
                    self._trigger_alert(alert)
                    self.alert_states[alert.name] = current_time
            except Exception as e:
                logger.error("Error evaluating alert", alert=alert.name, error=str(e))
    
    def _evaluate_alert_condition(self, alert: Alert) -> bool:
        """Evaluate alert condition."""
        # Simple condition evaluation (extend as needed)
        if alert.condition == "greater_than":
            value = self.get_latest_value(alert.name)
            return value is not None and value > alert.threshold
        elif alert.condition == "less_than":
            value = self.get_latest_value(alert.name)
            return value is not None and value < alert.threshold
        elif alert.condition == "average_greater_than":
            value = self.get_average(alert.name)
            return value is not None and value > alert.threshold
        
        return False
    
    def _trigger_alert(self, alert: Alert):
        """Trigger an alert."""
        logger.warning("Alert triggered", 
                      alert_name=alert.name,
                      severity=alert.severity,
                      message=alert.message)
        
        # Send to external alerting system (Slack, PagerDuty, etc.)
        # For now, just log it
        if alert.severity == "critical":
            logger.error("CRITICAL ALERT", alert=alert.name, message=alert.message)


class SystemMonitor:
    """Monitor system resources."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
    
    def collect_system_metrics(self):
        """Collect system metrics."""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self.metrics.record_metric("cpu_usage", cpu_percent)
            CPU_USAGE.set(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            self.metrics.record_metric("memory_usage", memory.percent)
            self.metrics.record_metric("memory_used", memory.used)
            self.metrics.record_metric("memory_available", memory.available)
            
            MEMORY_USAGE.labels(type="used").set(memory.used)
            MEMORY_USAGE.labels(type="available").set(memory.available)
            
            # Disk usage
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    self.metrics.record_metric(
                        f"disk_usage_{partition.mountpoint.replace('/', '_')}",
                        usage.percent
                    )
                    DISK_USAGE.labels(mount=partition.mountpoint).set(usage.percent)
                except PermissionError:
                    pass
            
            # Network I/O
            net_io = psutil.net_io_counters()
            self.metrics.record_metric("network_bytes_sent", net_io.bytes_sent)
            self.metrics.record_metric("network_bytes_recv", net_io.bytes_recv)
            
            # Process information
            process = psutil.Process()
            self.metrics.record_metric("process_memory", process.memory_info().rss)
            self.metrics.record_metric("process_cpu", process.cpu_percent())
            
        except Exception as e:
            logger.error("Error collecting system metrics", error=str(e))


class DatabaseMonitor:
    """Monitor database performance."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
    
    def collect_database_metrics(self, db: Session):
        """Collect database metrics."""
        try:
            # Connection pool stats
            engine = db.get_bind()
            pool = engine.pool
            
            self.metrics.record_metric("db_pool_size", pool.size())
            self.metrics.record_metric("db_pool_checked_out", pool.checkedout())
            self.metrics.record_metric("db_pool_overflow", pool.overflow())
            
            DATABASE_CONNECTIONS.labels(state="active").set(pool.checkedout())
            DATABASE_CONNECTIONS.labels(state="idle").set(pool.size() - pool.checkedout())
            
            # Query performance stats
            result = db.execute(text("""
                SELECT 
                    schemaname,
                    tablename,
                    n_tup_ins,
                    n_tup_upd,
                    n_tup_del,
                    n_tup_hot_upd,
                    n_live_tup,
                    n_dead_tup
                FROM pg_stat_user_tables
                WHERE schemaname = 'public'
            """))
            
            for row in result:
                table_name = row.tablename
                self.metrics.record_metric(f"db_table_{table_name}_inserts", row.n_tup_ins)
                self.metrics.record_metric(f"db_table_{table_name}_updates", row.n_tup_upd)
                self.metrics.record_metric(f"db_table_{table_name}_deletes", row.n_tup_del)
                self.metrics.record_metric(f"db_table_{table_name}_live_tuples", row.n_live_tup)
                self.metrics.record_metric(f"db_table_{table_name}_dead_tuples", row.n_dead_tup)
        
        except Exception as e:
            logger.error("Error collecting database metrics", error=str(e))


class ApplicationMonitor:
    """Monitor application-specific metrics."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
    
    def record_business_event(self, event_type: str, status: str = "success", metadata: Dict = None):
        """Record a business event."""
        self.metrics.record_metric(
            f"business_event_{event_type}",
            1,
            labels={"status": status}
        )
        
        BUSINESS_METRICS.labels(event_type=event_type, status=status).inc()
        
        logger.info("Business event recorded",
                   event_type=event_type,
                   status=status,
                   metadata=metadata)
    
    def record_user_action(self, user_id: int, action: str, resource: str = None):
        """Record user action."""
        self.metrics.record_metric(
            "user_action",
            1,
            labels={"action": action, "resource": resource or "unknown"}
        )
        
        logger.info("User action recorded",
                   user_id=user_id,
                   action=action,
                   resource=resource)
    
    def record_api_call(self, endpoint: str, method: str, status_code: int, duration: float):
        """Record API call metrics."""
        self.metrics.record_metric(
            "api_call_duration",
            duration,
            labels={"endpoint": endpoint, "method": method}
        )
        
        self.metrics.record_metric(
            "api_call_count",
            1,
            labels={"endpoint": endpoint, "method": method, "status": str(status_code)}
        )


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware to collect request metrics."""
    
    def __init__(self, app, metrics_collector: MetricsCollector):
        super().__init__(app)
        self.metrics = metrics_collector
    
    async def dispatch(self, request: Request, call_next):
        """Collect request metrics."""
        start_time = time.time()
        
        # Record request
        endpoint = request.url.path
        method = request.method
        
        # Get request size
        request_size = int(request.headers.get("content-length", 0))
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Get response size
        response_size = int(response.headers.get("content-length", 0))
        
        # Record metrics
        self.metrics.record_api_call(endpoint, method, response.status_code, duration)
        
        # Update Prometheus metrics
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status_code=response.status_code
        ).inc()
        
        REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
        
        if request_size > 0:
            REQUEST_SIZE.labels(
                method=method,
                endpoint=endpoint
            ).observe(request_size)
        
        if response_size > 0:
            RESPONSE_SIZE.labels(
                method=method,
                endpoint=endpoint
            ).observe(response_size)
        
        return response


class HealthChecker:
    """Health check utilities."""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
    
    def check_database_health(self, db: Session) -> Dict[str, Any]:
        """Check database health."""
        try:
            start_time = time.time()
            db.execute(text("SELECT 1"))
            duration = time.time() - start_time
            
            self.metrics.record_metric("health_check_db_duration", duration)
            
            return {
                "status": "healthy",
                "duration": duration,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.metrics.record_metric("health_check_db_failures", 1)
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def check_redis_health(self) -> Dict[str, Any]:
        """Check Redis health."""
        if not self.metrics.redis_client:
            return {
                "status": "not_configured",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        try:
            start_time = time.time()
            self.metrics.redis_client.ping()
            duration = time.time() - start_time
            
            self.metrics.record_metric("health_check_redis_duration", duration)
            
            return {
                "status": "healthy",
                "duration": duration,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.metrics.record_metric("health_check_redis_failures", 1)
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def get_overall_health(self, db: Session) -> Dict[str, Any]:
        """Get overall system health."""
        db_health = self.check_database_health(db)
        redis_health = self.check_redis_health()
        
        overall_status = "healthy"
        if db_health["status"] != "healthy":
            overall_status = "unhealthy"
        elif redis_health["status"] == "unhealthy":
            overall_status = "degraded"
        
        return {
            "status": overall_status,
            "components": {
                "database": db_health,
                "redis": redis_health
            },
            "timestamp": datetime.utcnow().isoformat()
        }


# Global instances
metrics_collector = MetricsCollector()
system_monitor = SystemMonitor(metrics_collector)
database_monitor = DatabaseMonitor(metrics_collector)
application_monitor = ApplicationMonitor(metrics_collector)
health_checker = HealthChecker(metrics_collector)

# Setup default alerts
metrics_collector.add_alert(Alert(
    name="high_cpu_usage",
    condition="greater_than",
    threshold=80.0,
    severity="warning",
    message="CPU usage is above 80%"
))

metrics_collector.add_alert(Alert(
    name="high_memory_usage",
    condition="greater_than",
    threshold=85.0,
    severity="warning",
    message="Memory usage is above 85%"
))

metrics_collector.add_alert(Alert(
    name="slow_api_response",
    condition="average_greater_than",
    threshold=2.0,
    severity="warning",
    message="Average API response time is above 2 seconds"
))

# Export for use in main application
__all__ = [
    "metrics_collector",
    "system_monitor",
    "database_monitor",
    "application_monitor",
    "health_checker",
    "MonitoringMiddleware",
    "REGISTRY"
]