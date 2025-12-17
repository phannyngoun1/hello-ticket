"""
Redis client configuration and connection management
"""
import os
import redis
from typing import Optional
from redis.connection import ConnectionPool
import logging

logger = logging.getLogger(__name__)


class RedisClient:
    """Redis client singleton for managing Redis connections"""
    
    _instance: Optional['RedisClient'] = None
    _client: Optional[redis.Redis] = None
    _pool: Optional[ConnectionPool] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Redis client with connection pool"""
        redis_url = os.getenv(
            "REDIS_URL",
            "redis://localhost:6379/0"
        )
        
        # Parse Redis URL components for custom configuration
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_db = int(os.getenv("REDIS_DB", "0"))
        redis_password = os.getenv("REDIS_PASSWORD", None)
        
        # Connection pool configuration for better performance
        self._pool = ConnectionPool(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            password=redis_password,
            decode_responses=True,  # Automatically decode responses to strings
            max_connections=50,     # Maximum number of connections in the pool
            socket_keepalive=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True
        )
        
        self._client = redis.Redis(connection_pool=self._pool)
        
        # Test connection
        try:
            self._client.ping()
            logger.info("✅ Redis connection established successfully")
        except redis.ConnectionError as e:
            logger.warning(f"⚠️  Redis connection failed: {e}")
            logger.warning("   Continuing without cache. Install Redis or check REDIS_URL configuration.")
    
    @property
    def client(self) -> redis.Redis:
        """Get Redis client instance"""
        if self._client is None:
            self._initialize_client()
        return self._client
    
    def is_available(self) -> bool:
        """Check if Redis is available"""
        try:
            return self._client is not None and self._client.ping()
        except:
            return False
    
    def close(self):
        """Close Redis connections"""
        if self._client:
            self._client.close()
        if self._pool:
            self._pool.disconnect()


# Global Redis client instance
redis_client = RedisClient()

