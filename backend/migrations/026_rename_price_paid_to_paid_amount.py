#!/usr/bin/env python3
"""
Migration script to rename price_paid column to paid_amount in tickets table.

This migration renames the 'price_paid' column to 'paid_amount' for better clarity.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text

# Database connection settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "ticket_system")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

def run_migration():
    """Run the migration to rename price_paid to paid_amount"""
    
    # Read the SQL migration file
    migration_file = Path(__file__).parent / "026_rename_price_paid_to_paid_amount.sql"
    
    if not migration_file.exists():
        print(f"Error: Migration file not found: {migration_file}")
        sys.exit(1)
    
    with open(migration_file, "r") as f:
        sql_content = f.read()
    
    # Create connection string
    conn_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    print(f"Connecting to database: {DB_NAME}@{DB_HOST}:{DB_PORT}")
    
    try:
        # Create engine and connection
        engine = create_engine(conn_string)
        
        with engine.connect() as conn:
            # Execute the migration SQL
            print("Executing migration: 026_rename_price_paid_to_paid_amount.sql")
            conn.execute(text(sql_content))
            conn.commit()
            print("Migration completed successfully!")
            
    except Exception as e:
        print(f"Error running migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()

