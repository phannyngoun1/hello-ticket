"""
Migration: Rename 'role' column to 'base_role' in users table
Date: 2025-10-25
Description: Update users table to use 'base_role' instead of 'role' 
             to better distinguish between base system roles and 
             additional custom roles.
"""
import os
from sqlalchemy import create_engine, text

def run_migration():
    """Run the migration to rename role column to base_role"""
    
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
            print("Renaming 'role' column to 'base_role'...")
            conn.execute(text("ALTER TABLE users RENAME COLUMN role TO base_role"))
            
            print("Dropping old index...")
            conn.execute(text("DROP INDEX IF EXISTS ix_users_role"))
            
            print("Creating new index...")
            conn.execute(text("CREATE INDEX ix_users_base_role ON users(base_role)"))
            
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

