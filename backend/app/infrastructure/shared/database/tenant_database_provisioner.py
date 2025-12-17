"""
Utilities for provisioning and managing tenant databases
"""
import os
from typing import Optional
from sqlmodel import SQLModel, create_engine, text
from sqlalchemy.engine import Engine
from app.shared.database_strategy import DatabaseStrategy, TenantDatabaseConfig
from app.infrastructure.shared.database.tenant_connection_manager import get_connection_manager
import logging

logger = logging.getLogger(__name__)


class TenantDatabaseProvisioner:
    """Provisions and manages tenant databases"""
    
    def __init__(self, admin_connection_url: str = None):
        """
        Initialize provisioner
        
        Args:
            admin_connection_url: PostgreSQL connection with database creation privileges
                                 (e.g., postgresql://postgres:password@localhost:5432/postgres)
        """
        self.admin_connection_url = admin_connection_url or os.getenv(
            "ADMIN_DATABASE_URL",
            "postgresql://postgres:password@localhost:5432/postgres"
        )
    
    def create_database_for_tenant(
        self,
        tenant_id: str,
        database_name: str = None
    ) -> TenantDatabaseConfig:
        """
        Create a dedicated database for a tenant
        
        Args:
            tenant_id: Tenant ID
            database_name: Database name (defaults to tenant_{tenant_id})
        
        Returns:
            TenantDatabaseConfig with connection details
        """
        if database_name is None:
            # Sanitize tenant_id for use as database name
            database_name = f"tenant_{tenant_id.replace('-', '_').replace(' ', '_').lower()}"
        
        # Connect to PostgreSQL with admin privileges
        admin_engine = create_engine(self.admin_connection_url)
        
        try:
            # Create database
            with admin_engine.connect() as conn:
                # Need to use autocommit for CREATE DATABASE
                conn = conn.execution_options(isolation_level="AUTOCOMMIT")
                
                # Check if database exists
                result = conn.execute(
                    text(f"SELECT 1 FROM pg_database WHERE datname = '{database_name}'")
                )
                
                if not result.fetchone():
                    # Create database
                    conn.execute(text(f"CREATE DATABASE {database_name}"))
                    logger.info(f"✅ Created database: {database_name}")
                else:
                    logger.info(f"ℹ️  Database already exists: {database_name}")
            
            # Parse admin connection to get host, port, username, password
            from urllib.parse import urlparse
            parsed = urlparse(self.admin_connection_url)
            
            # Create configuration for tenant
            config = TenantDatabaseConfig(
                strategy=DatabaseStrategy.DEDICATED,
                database_name=database_name,
                host=parsed.hostname,
                port=parsed.port or 5432,
                username=parsed.username,
                password=parsed.password,
                database_url=f"postgresql://{parsed.username}:{parsed.password}@{parsed.hostname}:{parsed.port or 5432}/{database_name}"
            )
            
            # Initialize tables in the new database
            self.initialize_tenant_database(config)
            
            # Register with connection manager
            connection_manager = get_connection_manager()
            connection_manager.register_tenant_database(tenant_id, config)
            
            return config
            
        finally:
            admin_engine.dispose()
    
    def initialize_tenant_database(self, config: TenantDatabaseConfig) -> None:
        """
        Initialize database schema for tenant
        Creates all necessary tables
        """
        connection_url = config.get_connection_url()
        engine = create_engine(connection_url)
        
        try:
            # Create all tables
            SQLModel.metadata.create_all(engine)
            logger.info(f"✅ Initialized database schema for tenant database")
        finally:
            engine.dispose()
    
    def drop_database_for_tenant(
        self,
        tenant_id: str,
        database_name: str,
        force: bool = False
    ) -> bool:
        """
        Drop a tenant's dedicated database
        
        Args:
            tenant_id: Tenant ID
            database_name: Database name to drop
            force: Force drop even if there are active connections
        
        Returns:
            True if successful, False otherwise
        """
        if not force:
            logger.warning("⚠️  WARNING: This will permanently delete all tenant data!")
            logger.warning(f"Database: {database_name}")
            logger.warning("Use force=True to confirm deletion")
            return False
        
        # Close any existing connections
        connection_manager = get_connection_manager()
        connection_manager.close_tenant_connection(tenant_id)
        
        # Connect with admin privileges
        admin_engine = create_engine(self.admin_connection_url)
        
        try:
            with admin_engine.connect() as conn:
                conn = conn.execution_options(isolation_level="AUTOCOMMIT")
                
                # Terminate active connections to the database
                conn.execute(text(f"""
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = '{database_name}'
                    AND pid <> pg_backend_pid()
                """))
                
                # Drop database
                conn.execute(text(f"DROP DATABASE IF EXISTS {database_name}"))
                logger.info(f"✅ Dropped database: {database_name}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error dropping database: {e}")
            return False
        finally:
            admin_engine.dispose()
    
    def migrate_tenant_to_dedicated_database(
        self,
        tenant_id: str,
        from_database_url: str = None
    ) -> TenantDatabaseConfig:
        """
        Migrate a tenant from shared to dedicated database
        
        Args:
            tenant_id: Tenant ID
            from_database_url: Source database URL (defaults to default connection)
        
        Returns:
            TenantDatabaseConfig for new dedicated database
        """
        # Create dedicated database
        config = self.create_database_for_tenant(tenant_id)
        
        # TODO: Implement data migration from shared to dedicated
        # This would involve:
        # 1. Copy tenant's data from shared database
        # 2. Verify data integrity
        # 3. Update tenant configuration
        # 4. Delete data from shared database (optional)
        
        # 4. Delete data from shared database (optional)
        
        logger.warning(f"⚠️  Data migration not yet implemented")
        logger.warning(f"Please manually migrate data for tenant {tenant_id}")
        
        return config
    
    def check_database_health(self, config: TenantDatabaseConfig) -> dict:
        """
        Check health of tenant database
        
        Returns:
            Dictionary with health status information
        """
        connection_url = config.get_connection_url()
        engine = create_engine(connection_url)
        
        try:
            with engine.connect() as conn:
                # Check connection
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
                
                # Get database size
                result = conn.execute(text("""
                    SELECT pg_size_pretty(pg_database_size(current_database())) as size
                """))
                size = result.fetchone()[0]
                
                # Get table count
                result = conn.execute(text("""
                    SELECT COUNT(*) FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """))
                table_count = result.fetchone()[0]
                
                return {
                    "status": "healthy",
                    "database_size": size,
                    "table_count": table_count,
                    "strategy": config.strategy.value
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "strategy": config.strategy.value
            }
        finally:
            engine.dispose()

