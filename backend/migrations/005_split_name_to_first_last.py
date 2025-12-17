"""
Migration: Split name field into first_name and last_name

This migration:
1. Adds first_name and last_name columns to users table
2. Populates the new columns by splitting the existing name field
3. Drops the old name column
4. Updates indexes accordingly
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlmodel import SQLModel, create_engine, text
from app.infrastructure.database.platform_models import UserModel, platform_metadata


def upgrade():
    """Apply the migration"""
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL", "sqlite:///truths_platform.db")
    
    # Create engine
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # Step 1: Add new columns
            print("Adding first_name and last_name columns...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN first_name VARCHAR(50) DEFAULT ''
            """))
            
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN last_name VARCHAR(50) DEFAULT ''
            """))
            
            # Step 2: Populate new columns by splitting existing name field
            print("Populating first_name and last_name from name field...")
            conn.execute(text("""
                UPDATE users 
                SET 
                    first_name = CASE 
                        WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name, 1, POSITION(' ' IN name) - 1)
                        ELSE name
                    END,
                    last_name = CASE 
                        WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name, POSITION(' ' IN name) + 1)
                        ELSE ''
                    END
            """))
            
            # Step 3: Add indexes for new columns
            print("Adding indexes for first_name and last_name...")
            conn.execute(text("""
                CREATE INDEX ix_users_first_name ON users(first_name)
            """))
            
            conn.execute(text("""
                CREATE INDEX ix_users_last_name ON users(last_name)
            """))
            
            # Step 4: Drop old name column and its index
            print("Dropping old name column and index...")
            conn.execute(text("""
                DROP INDEX IF EXISTS ix_users_name
            """))
            
            conn.execute(text("""
                ALTER TABLE users DROP COLUMN name
            """))
            
            # Commit transaction
            trans.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"Migration failed: {e}")
            raise


def downgrade():
    """Rollback the migration"""
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL", "sqlite:///truths_platform.db")
    
    # Create engine
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # Step 1: Add name column back
            print("Adding name column back...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN name VARCHAR(100) DEFAULT ''
            """))
            
            # Step 2: Populate name column by concatenating first_name and last_name
            print("Populating name field from first_name and last_name...")
            conn.execute(text("""
                UPDATE users 
                SET name = CASE 
                    WHEN last_name = '' THEN first_name
                    ELSE first_name || ' ' || last_name
                END
            """))
            
            # Step 3: Add index for name column
            print("Adding index for name column...")
            conn.execute(text("""
                CREATE INDEX ix_users_name ON users(name)
            """))
            
            # Step 4: Drop new columns and their indexes
            print("Dropping first_name and last_name columns and indexes...")
            conn.execute(text("""
                DROP INDEX IF EXISTS ix_users_first_name
            """))
            
            conn.execute(text("""
                DROP INDEX IF EXISTS ix_users_last_name
            """))
            
            conn.execute(text("""
                ALTER TABLE users DROP COLUMN first_name
            """))
            
            conn.execute(text("""
                ALTER TABLE users DROP COLUMN last_name
            """))
            
            # Commit transaction
            trans.commit()
            print("Rollback completed successfully!")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"Rollback failed: {e}")
            raise


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "downgrade":
        downgrade()
    else:
        upgrade()
