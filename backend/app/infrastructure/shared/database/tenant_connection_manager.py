"""
Tenant-aware database connection manager
Supports both shared database and dedicated database per tenant strategies
"""
from typing import Dict, Optional
from sqlmodel import Session, create_engine
from sqlalchemy.engine import Engine
from app.shared.database_strategy import DatabaseStrategy, TenantDatabaseConfig
from app.shared.tenant_context import get_tenant_context


class TenantConnectionManager:
    """
    Manages database connections for multi-tenant application
    Supports both shared and dedicated database strategies
    """
    
    def __init__(self, default_database_url: str):
        self.default_database_url = default_database_url
        self.default_engine = create_engine(default_database_url, echo=False)
        
        # Cache for tenant-specific engines (for dedicated database strategy)
        self._tenant_engines: Dict[str, Engine] = {}
        
        # Cache for tenant database configurations
        self._tenant_configs: Dict[str, TenantDatabaseConfig] = {}
    
    def register_tenant_database(
        self,
        tenant_id: str,
        config: TenantDatabaseConfig
    ) -> None:
        """Register a tenant's database configuration"""
        self._tenant_configs[tenant_id] = config
        
        # If dedicated database, create engine
        if config.strategy == DatabaseStrategy.DEDICATED:
            connection_url = config.get_connection_url()
            if connection_url and tenant_id not in self._tenant_engines:
                self._tenant_engines[tenant_id] = create_engine(
                    connection_url,
                    echo=True,
                    pool_size=5,
                    max_overflow=10
                )
    
    def get_engine_for_tenant(self, tenant_id: str) -> Engine:
        """Get database engine for specific tenant"""
        config = self._tenant_configs.get(tenant_id)
        
        if not config or config.strategy == DatabaseStrategy.SHARED:
            # Use default shared database
            return self.default_engine
        
        # Use dedicated database
        if tenant_id in self._tenant_engines:
            return self._tenant_engines[tenant_id]
        
        # Create engine on-demand
        connection_url = config.get_connection_url()
        engine = create_engine(
            connection_url,
            echo=True,
            pool_size=5,
            max_overflow=10
        )
        self._tenant_engines[tenant_id] = engine
        return engine
    
    def get_session_for_tenant(self, tenant_id: str) -> Session:
        """Get database session for specific tenant"""
        engine = self.get_engine_for_tenant(tenant_id)
        return Session(engine)
    
    def get_session_from_context(self) -> Session:
        """Get database session based on current tenant context"""
        tenant_id = get_tenant_context()
        if not tenant_id:
            # No tenant context, use default database
            return Session(self.default_engine)
        
        return self.get_session_for_tenant(tenant_id)
    
    def close_tenant_connection(self, tenant_id: str) -> None:
        """Close and remove tenant-specific database connection"""
        if tenant_id in self._tenant_engines:
            self._tenant_engines[tenant_id].dispose()
            del self._tenant_engines[tenant_id]
    
    def close_all_connections(self) -> None:
        """Close all database connections"""
        for engine in self._tenant_engines.values():
            engine.dispose()
        self._tenant_engines.clear()
        self.default_engine.dispose()
    
    def get_tenant_config(self, tenant_id: str) -> Optional[TenantDatabaseConfig]:
        """Get tenant database configuration"""
        return self._tenant_configs.get(tenant_id)
    
    def is_dedicated_database(self, tenant_id: str) -> bool:
        """Check if tenant uses dedicated database"""
        config = self._tenant_configs.get(tenant_id)
        return config and config.strategy == DatabaseStrategy.DEDICATED


# Global connection manager instance
_connection_manager: Optional[TenantConnectionManager] = None


def get_connection_manager() -> TenantConnectionManager:
    """Get global connection manager instance"""
    global _connection_manager
    if _connection_manager is None:
        from app.infrastructure.shared.database.connection import DATABASE_URL
        _connection_manager = TenantConnectionManager(DATABASE_URL)
    return _connection_manager


def initialize_connection_manager(database_url: str) -> TenantConnectionManager:
    """Initialize global connection manager"""
    global _connection_manager
    _connection_manager = TenantConnectionManager(database_url)
    return _connection_manager

