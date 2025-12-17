"""
Query performance monitoring utilities
"""
import logging
import time
from functools import wraps
from typing import Callable, TypeVar, Dict, Any
from collections import defaultdict

logger = logging.getLogger(__name__)

T = TypeVar('T')

# Performance metrics storage (in-memory, use external monitoring in production)
_query_metrics: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
    "count": 0,
    "total_time": 0.0,
    "min_time": float('inf'),
    "max_time": 0.0,
    "avg_time": 0.0,
    "slow_queries": []  # Queries > 100ms
})


def monitor_query_performance(
    threshold_ms: float = 100.0,
    log_slow_queries: bool = True
):
    """
    Decorator to monitor query performance
    
    Args:
        threshold_ms: Threshold in milliseconds to log slow queries
        log_slow_queries: Whether to log slow queries
    
    Usage:
        @monitor_query_performance(threshold_ms=100)
        async def get_item_by_id(self, item_id: str) -> Optional[Item]:
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            start_time = time.time()
            query_name = f"{func.__module__}.{func.__qualname__}"
            
            try:
                # Execute query
                result = await func(*args, **kwargs)
                
                # Calculate duration
                duration_ms = (time.time() - start_time) * 1000
                
                # Update metrics
                metrics = _query_metrics[query_name]
                metrics["count"] += 1
                metrics["total_time"] += duration_ms
                metrics["min_time"] = min(metrics["min_time"], duration_ms)
                metrics["max_time"] = max(metrics["max_time"], duration_ms)
                metrics["avg_time"] = metrics["total_time"] / metrics["count"]
                
                # Log slow queries
                if duration_ms > threshold_ms and log_slow_queries:
                    metrics["slow_queries"].append({
                        "duration_ms": duration_ms,
                        "args": str(args[1:]) if len(args) > 1 else "",  # Skip 'self'
                        "kwargs": str(kwargs) if kwargs else ""
                    })
                    
                    # Keep only last 10 slow queries
                    if len(metrics["slow_queries"]) > 10:
                        metrics["slow_queries"] = metrics["slow_queries"][-10:]
                    
                    logger.warning(
                        f"Slow query detected: {query_name} took {duration_ms:.2f}ms",
                        extra={
                            "query_name": query_name,
                            "duration_ms": duration_ms,
                            "threshold_ms": threshold_ms,
                            "args": str(args[1:]) if len(args) > 1 else "",
                            "kwargs": str(kwargs) if kwargs else ""
                        }
                    )
                
                # Log performance metrics periodically
                if metrics["count"] % 100 == 0:
                    logger.info(
                        f"Query performance: {query_name} - "
                        f"avg: {metrics['avg_time']:.2f}ms, "
                        f"min: {metrics['min_time']:.2f}ms, "
                        f"max: {metrics['max_time']:.2f}ms, "
                        f"count: {metrics['count']}",
                        extra={
                            "query_name": query_name,
                            "avg_time_ms": metrics["avg_time"],
                            "min_time_ms": metrics["min_time"],
                            "max_time_ms": metrics["max_time"],
                            "count": metrics["count"]
                        }
                    )
                
                return result
                
            except Exception as e:
                # Log query errors
                duration_ms = (time.time() - start_time) * 1000
                logger.error(
                    f"Query error: {query_name} failed after {duration_ms:.2f}ms",
                    exc_info=True,
                    extra={
                        "query_name": query_name,
                        "duration_ms": duration_ms,
                        "error": str(e)
                    }
                )
                raise
        
        return wrapper
    return decorator


def get_query_metrics() -> Dict[str, Dict[str, Any]]:
    """Get query performance metrics"""
    return dict(_query_metrics)


def get_slow_queries(threshold_ms: float = 100.0) -> Dict[str, list]:
    """Get slow queries above threshold"""
    slow_queries = {}
    for query_name, metrics in _query_metrics.items():
        if metrics["avg_time"] > threshold_ms:
            slow_queries[query_name] = {
                "avg_time_ms": metrics["avg_time"],
                "max_time_ms": metrics["max_time"],
                "count": metrics["count"],
                "recent_slow_queries": metrics["slow_queries"][-5:]  # Last 5
            }
    return slow_queries


def reset_query_metrics():
    """Reset query performance metrics"""
    _query_metrics.clear()

