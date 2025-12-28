#!/usr/bin/env python3
"""
Migration script to add price column to tickets table.

This migration adds a 'price' column to store the original ticket price,
separate from 'price_paid' which represents the actual amount paid
(may differ due to discounts, fees, etc.).
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database connection settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "ticket_system")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

def run_migration():
    """Run the migration to add price column to tickets table"""
    
    # Read the SQL migration file
    migration_file = Path(__file__).parent / "025_add_price_to_tickets.sql"
    
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
            print("Executing migration: 025_add_price_to_tickets.sql")
            conn.execute(text(sql_content))
            conn.commit()
            print("Migration completed successfully!")
            
    except Exception as e:
        print(f"Error running migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()

