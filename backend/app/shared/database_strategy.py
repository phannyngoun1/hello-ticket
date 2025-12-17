"""
Database strategy configuration for multi-tenancy
"""
from enum import Enum


class DatabaseStrategy(str, Enum):
    """
    Database isolation strategy for multi-tenancy
    
    SHARED_DATABASE:
        - All tenants share the same database
        - Data isolation via tenant_id column
        - Most cost-effective
        - Best for: Small to medium tenants, SaaS applications
    
    DEDICATED_DATABASE:
        - Each tenant has their own database
        - Complete database isolation
        - Better performance and security
        - Best for: Enterprise clients, compliance requirements
    """
    SHARED = "shared_database"
    DEDICATED = "dedicated_database"


class TenantDatabaseConfig:
    """Configuration for tenant database connection"""
    
    def __init__(
        self,
        strategy: DatabaseStrategy,
        database_url: str = None,
        database_name: str = None,
        host: str = None,
        port: int = None,
        username: str = None,
        password: str = None
    ):
        self.strategy = strategy
        self.database_url = database_url
        self.database_name = database_name
        self.host = host
        self.port = port
        self.username = username
        self.password = password
    
    def get_connection_url(self) -> str:
        """Get database connection URL"""
        if self.database_url:
            return self.database_url
        
        if self.strategy == DatabaseStrategy.DEDICATED:
            # Build connection string for dedicated database
            if all([self.host, self.port, self.username, self.password, self.database_name]):
                return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database_name}"
        
        # Fallback to default connection
        from app.infrastructure.shared.database.connection import DATABASE_URL
        return DATABASE_URL
    
    def to_dict(self) -> dict:
        """Convert to dictionary for storage"""
        return {
            "strategy": self.strategy.value,
            "database_url": self.database_url,
            "database_name": self.database_name,
            "host": self.host,
            "port": self.port,
            "username": self.username,
            # Don't store password in dict - should be in secure vault
        }
    
    @staticmethod
    def from_dict(data: dict) -> 'TenantDatabaseConfig':
        """Create from dictionary"""
        return TenantDatabaseConfig(
            strategy=DatabaseStrategy(data.get('strategy', DatabaseStrategy.SHARED.value)),
            database_url=data.get('database_url'),
            database_name=data.get('database_name'),
            host=data.get('host'),
            port=data.get('port'),
            username=data.get('username')
        )

