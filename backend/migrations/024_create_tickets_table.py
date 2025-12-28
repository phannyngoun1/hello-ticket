#!/usr/bin/env python3
"""
Database migration script for creating tickets table.

This migration creates:
- tickets table with all ticket fields
- Foreign keys to events, event_seats, and bookings
- Unique constraints on ticket_number, barcode, and qr_code
- Indexes for performance
"""

import os
from pathlib import Path
from sqlalchemy import create_engine, text

def run_migration():
    """Execute the migration"""
    # Get database URL from environment
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql://ticket:ticket_pass@localhost:5432/ticket"
    )
    
    # Create sync engine
    engine = create_engine(database_url, echo=True)
    
    # Read SQL file
    sql_file = Path(__file__).parent / "024_create_tickets_table.sql"
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    # Split SQL content into individual statements
    statements = []
    current_statement = []
    
    for line in sql_content.split('\n'):
        # Skip comment-only lines and empty lines
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        
        current_statement.append(line)
        
        # If line ends with semicolon, it's the end of a statement
        if stripped.endswith(';'):
            statement = '\n'.join(current_statement).strip()
            if statement:
                statements.append(statement)
            current_statement = []
    
    # Execute migration
    with engine.begin() as conn:
        print("🚀 Running migration 024: Create tickets table")
        print(f"   Executing {len(statements)} statements...")
        
        for i, statement in enumerate(statements, 1):
            try:
                conn.execute(text(statement))
                print(f"   ✓ Statement {i}/{len(statements)} completed")
            except Exception as e:
                error_str = str(e).lower()
                if "already exists" in error_str or "does not exist" in error_str or "duplicate" in error_str:
                    print(f"   ⚠ Statement {i}/{len(statements)} skipped: {str(e)}")
                else:
                    print(f"   ✗ Statement {i}/{len(statements)} failed: {str(e)}")
                    raise
        
        print("✅ Migration 024 completed successfully!")
        print("   NOTE: tickets table created with all required fields and indexes")
    
    engine.dispose()

if __name__ == "__main__":
    run_migration()

