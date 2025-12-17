"""
Migration: Convert all timestamp columns to TIMESTAMP WITH TIME ZONE
Date: 2025-10-25
Description: Update all timestamp columns from TIMESTAMP WITHOUT TIME ZONE 
             to TIMESTAMP WITH TIME ZONE for proper timezone handling.
             This fixes asyncpg errors with timezone-aware datetime objects.
"""
import os
from sqlalchemy import create_engine, text

def run_migration():
    """Run the migration to convert timestamp columns to timezone-aware"""
    
    # Get database URL from environment
    platform_db_url = os.getenv(
        "PLATFORM_DATABASE_URL",
        "postgresql://platform_user:platform_pass@localhost:5433/truths_platform"
    )
    
    engine = create_engine(platform_db_url)
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            print("Converting timestamp columns to TIMESTAMP WITH TIME ZONE...")
            
            # Update roles table
            print("  - Updating roles table...")
            conn.execute(text("""
                ALTER TABLE roles 
                  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE
            """))
            
            # Update groups table
            print("  - Updating groups table...")
            conn.execute(text("""
                ALTER TABLE groups 
                  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE
            """))
            
            # Update user_groups table
            print("  - Updating user_groups table...")
            conn.execute(text("""
                ALTER TABLE user_groups 
                  ALTER COLUMN added_at TYPE TIMESTAMP WITH TIME ZONE
            """))
            
            # Update users table
            print("  - Updating users table...")
            conn.execute(text("""
                ALTER TABLE users 
                  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN last_login TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN locked_until TYPE TIMESTAMP WITH TIME ZONE
            """))
            
            # Update tenants table
            print("  - Updating tenants table...")
            conn.execute(text("""
                ALTER TABLE tenants 
                  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE
            """))
            
            # Update tenant_subscriptions table
            print("  - Updating tenant_subscriptions table...")
            conn.execute(text("""
                ALTER TABLE tenant_subscriptions 
                  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE
            """))
            
            # Update sessions table
            print("  - Updating sessions table...")
            conn.execute(text("""
                ALTER TABLE sessions 
                  ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN last_activity_at TYPE TIMESTAMP WITH TIME ZONE,
                  ALTER COLUMN revoked_at TYPE TIMESTAMP WITH TIME ZONE
            """))
            
            # Commit transaction
            trans.commit()
            print("✅ Migration completed successfully!")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    run_migration()

