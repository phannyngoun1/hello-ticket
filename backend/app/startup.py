"""
Application startup and initialization logic.

This module handles all startup tasks including:
- Database initialization
- Default tenant setup
- System roles synchronization
- Admin user bootstrapping

Author: Phanny
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def initialize_platform_database() -> None:
    """Initialize platform database tables (tenants, users, roles, etc.)."""
    from app.infrastructure.shared.database.platform_connection import create_platform_db_and_tables
    from sqlalchemy.exc import OperationalError, ProgrammingError
    import traceback
    import sys
    
    logger.info("📊 Initializing platform tables...")
    try:
        create_platform_db_and_tables()
        logger.info("✓  Platform tables ready")
    except (OperationalError, ProgrammingError) as e:
        logger.error("\n" + "=" * 70)
        logger.error("❌ DATABASE CONNECTION FAILED - Platform Tables")
        logger.error("=" * 70)
        
        # Extract the clean error message
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.error(f"\n📍 Root Cause:")
        logger.error(f"   {error_msg.splitlines()[0]}")
        
        logger.error(f"\n💡 Quick Fix:")
        logger.error("   1. Start PostgreSQL: docker compose up -d postgres")
        logger.error("   2. Or manually: docker compose up -d")
        logger.error("   3. Verify port 5432 is available")
        logger.error("\n" + "=" * 70)
        
        # Print only relevant traceback (app code, not library internals)
        logger.error("\n📋 Relevant Stack Trace:")
        logger.error("-" * 70)
        tb_lines = traceback.format_tb(e.__traceback__)
        app_frames = [line for line in tb_lines if '/app/' in line or 'startup.py' in line]
        if app_frames:
            logger.error(''.join(app_frames).rstrip())
        else:
            # If no app frames, show last 3 frames
            logger.error(''.join(tb_lines[-3:]).rstrip())
        logger.error(f"\n{type(e).__name__}: {error_msg.splitlines()[0]}")
        logger.error("-" * 70 + "\n")
        
        # Exit cleanly without re-raising to avoid FastAPI's verbose traceback
        logger.error("❌ Application startup aborted due to database connection failure.\n")
        sys.exit(1)



async def initialize_operational_database() -> None:
    """Initialize operational database tables (products, orders, inventory)."""
    from app.infrastructure.shared.database.connection import create_db_and_tables
    from sqlalchemy.exc import OperationalError, ProgrammingError
    import traceback
    import sys
    
    logger.info("📦 Initializing operational tables...")
    try:
        create_db_and_tables()
        logger.info("✓  Operational tables ready")
    except (OperationalError, ProgrammingError) as e:
        logger.error("\n" + "=" * 70)
        logger.error("❌ DATABASE CONNECTION FAILED - Operational Tables")
        logger.error("=" * 70)
        
        # Extract the clean error message
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        logger.error(f"\n📍 Root Cause:")
        logger.error(f"   {error_msg.splitlines()[0]}")
        
        logger.error(f"\n💡 Quick Fix:")
        logger.error("   1. Start PostgreSQL: docker compose up -d postgres")
        logger.error("   2. Or manually: docker compose up -d")
        logger.error("   3. Verify port 5432 is available")
        logger.error("\n" + "=" * 70)
        
        # Print only relevant traceback (app code, not library internals)
        logger.error("\n📋 Relevant Stack Trace:")
        logger.error("-" * 70)
        tb_lines = traceback.format_tb(e.__traceback__)
        app_frames = [line for line in tb_lines if '/app/' in line or 'startup.py' in line]
        if app_frames:
            logger.error(''.join(app_frames).rstrip())
        else:
            # If no app frames, show last 3 frames
            logger.error(''.join(tb_lines[-3:]).rstrip())
        logger.error(f"\n{type(e).__name__}: {error_msg.splitlines()[0]}")
        logger.error("-" * 70 + "\n")
        
        # Exit cleanly without re-raising to avoid FastAPI's verbose traceback
        logger.error("❌ Application startup aborted due to database connection failure.\n")
        sys.exit(1)



async def ensure_default_tenant(tenant_id: str, tenant_name: str = "Default Tenant") -> bool:
    """
    Ensure the default tenant exists in the database.
    
    Args:
        tenant_id: The ID of the default tenant
        tenant_name: The name of the default tenant
        
    Returns:
        bool: True if successful, False otherwise
    """
    from app.shared.tenant_validator import ensure_default_tenant_exists_async
    
    logger.info(f"🏢 Setting up default tenant: {tenant_id}")
    
    result = await ensure_default_tenant_exists_async(tenant_id, tenant_name)
    
    if result:
        logger.info(f"✓  Default tenant ready: {tenant_id}")
    else:
        logger.error(f"✗  Failed to setup default tenant: {tenant_id}")
        logger.warning("   Application may have issues with tenant operations")
    
    return result


async def sync_system_roles(tenant_id: Optional[str]) -> None:
    """
    Sync system roles to the database for the specified tenant.
    
    Args:
        tenant_id: The tenant ID to sync roles for
    """
    if not tenant_id:
        logger.warning("⚠  No tenant ID provided, skipping role sync")
        return
    
    logger.info("🔐 Syncing system roles...")
    
    try:
        from app.application.core.rbac import RoleSyncService
        from app.infrastructure.core.rbac.role_repository import RoleRepository
        from app.infrastructure.shared.database.platform_connection import get_platform_session
        
        # Get platform database session
        platform_session = get_platform_session()
        
        try:
            # Create role repository and sync service
            role_repository = RoleRepository(platform_session)
            role_sync_service = RoleSyncService(role_repository)
            
            # Sync system roles for default tenant
            synced_roles = await role_sync_service.sync_system_roles_for_tenant(tenant_id)
            logger.info(f"✓  Synced {len(synced_roles)} system roles: {', '.join([r.name for r in synced_roles])}")
        finally:
            # Close the session
            await platform_session.close()
            
    except Exception as e:
        logger.error(f"✗  Failed to sync system roles: {e}")
        logger.warning("   Application will continue, but system roles may not be available")


async def bootstrap_admin_user() -> bool:
    """
    Bootstrap the default admin user.
    
    Returns:
        bool: True if successful, False otherwise
    """
    logger.info("👤 Checking default admin user...")
    
    # Check if required environment variables are set
    admin_email = os.getenv("DEFAULT_ADMIN_EMAIL")
    admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD")
    
    if not admin_email or not admin_password:
        logger.warning("⚠  Default admin user not created")
        missing = []
        if not admin_email:
            missing.append("DEFAULT_ADMIN_EMAIL")
        if not admin_password:
            missing.append("DEFAULT_ADMIN_PASSWORD")
        logger.warning(f"   Missing: {', '.join(missing)}")
        logger.warning("   Set these in .env and restart")
        return False
    
    try:
        from app.application.core.admin import AdminBootstrapService
        from app.application.core.auth import AuthService
        from app.infrastructure.core.auth.repository import SQLAuthRepository
        from app.infrastructure.shared.security.password_hasher import PasswordHasher
        from app.infrastructure.shared.security.jwt_handler import JWTHandler
        
        # Create dependencies
        password_hasher = PasswordHasher()
        jwt_handler = JWTHandler()
        auth_repository = SQLAuthRepository()
        auth_service = AuthService(auth_repository, password_hasher, jwt_handler)
        
        # Bootstrap admin
        admin_bootstrap = AdminBootstrapService(auth_service, auth_repository)
        admin_result = await admin_bootstrap.ensure_default_admin_exists()
        
        if admin_result:
            logger.info("✓  Default admin user ready")
            return True
        else:
            logger.warning("⚠  Default admin user could not be verified")
            return False
            
    except Exception as e:
        logger.error(f"✗  Failed to create default admin user: {e}")
        logger.error("   Check database connection and retry")
        return False


async def validate_environment() -> None:
    """
    Validate critical environment variables.
    Development: Shows warnings for missing/weak configurations
    Production: Fails fast if critical security settings are missing
    """
    environment = os.getenv("ENVIRONMENT", "development")
    is_production = environment == "production"
    issues = []
    
    # Check SECRET_KEY
    secret_key = os.getenv("SECRET_KEY", "")
    if not secret_key or secret_key == "your-secret-key-here-change-in-production" or secret_key == "your-secret-key-change-in-production":
        issues.append("SECRET_KEY is missing or using default value")
    elif len(secret_key) < 32:
        issues.append(f"SECRET_KEY is too short ({len(secret_key)} chars, recommend 32+)")
    
    # Check ALLOWED_ORIGINS in production
    if is_production:
        allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
        if allowed_origins == "*":
            issues.append("ALLOWED_ORIGINS allows all origins (*) - security risk in production")
    
    # Check admin password strength
    admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "")
    if admin_password and (admin_password == "ChangeMe123!" or len(admin_password) < 8):
        issues.append("DEFAULT_ADMIN_PASSWORD is weak or using example value")
    
    # Handle issues based on environment
    if issues:
        logger.warning("⚠️  Configuration Issues Detected:")
        for issue in issues:
            logger.warning(f"   • {issue}")
        
        if is_production:
            logger.error("🚨 CRITICAL: Cannot start in production with these issues!")
            logger.error("   Fix these in your .env file and restart")
            raise RuntimeError(f"Production environment validation failed: {len(issues)} critical issues found")
        else:
            logger.info("ℹ️  Development mode - continuing with warnings")
            logger.info("   (These would prevent startup in production)")
    else:
        logger.info("✓  Environment validation passed")


async def register_event_handlers() -> None:
    """Register domain event handlers with the event bus"""
    logger.info("📡 Registering domain event handlers...")
    
    from app.application.shared.event_handlers.domain_event_handler import (
        event_bus,
        AuditEventHandler
    )
    
    # Register audit handler (logs all domain events)
    audit_handler = AuditEventHandler()
    event_bus.register_handler(audit_handler)
    logger.info("✓  Registered AuditEventHandler")
    
    logger.info("✓  Event handlers registered")


async def run_startup_tasks() -> None:
    """
    Execute all startup tasks in the correct order.
    
    This is the main entry point for application initialization.
    """
    logger.info("=" * 60)
    logger.info("🚀 HELLO TICKET - STARTING APPLICATION")
    logger.info("=" * 60)
    
    # 0. Validate environment (dev-friendly, prod-strict)
    await validate_environment()
    
    # 1. Initialize databases (migrations run before uvicorn in Docker CMD; create_all is fallback)
    await initialize_platform_database()
    await initialize_operational_database()
    
    # 2. Register domain event handlers
    await register_event_handlers()
    
    # 3. Ensure default tenant exists
    default_tenant_id = os.getenv("DEFAULT_TENANT_ID", "default-tenant")
    if default_tenant_id:
        await ensure_default_tenant(default_tenant_id, "Default Tenant")
    
    # 4. Sync system roles (if enabled)
    environment = os.getenv("ENVIRONMENT", "development")
    should_sync_roles = (
        environment == "development" or 
        os.getenv("SYNC_ROLES_ON_STARTUP", "true").lower() == "true"
    )
    
    if should_sync_roles:
        await sync_system_roles(default_tenant_id)
    else:
        logger.info(f"ℹ️  Skipping role sync (ENVIRONMENT={environment})")
    
    # 5. Bootstrap admin user
    await bootstrap_admin_user()
    
    logger.info("=" * 60)
    logger.info("✅ STARTUP COMPLETE - Server ready")
    logger.info("=" * 60)


async def run_shutdown_tasks() -> None:
    """
    Execute all shutdown tasks.
    
    This is called when the application is shutting down.
    """
    logger.info("Shutting down application...")
    # Add any cleanup tasks here if needed

