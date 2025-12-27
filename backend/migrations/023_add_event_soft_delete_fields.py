#!/usr/bin/env python3
"""
Database migration script for adding soft delete and configuration fields to events table.

This migration adds:
- configuration_type (VARCHAR, default 'seat_setup')
- is_deleted (BOOLEAN, default false)
- version (INTEGER, default 0)
- deleted_at (TIMESTAMP WITH TIME ZONE, nullable)
"""

import asyncio
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run_migration():
    """Execute the migration"""
    # Get database URL from environment
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://ticket:ticket_pass@localhost:5432/ticket"
    )
    
    # Ensure asyncpg URL
    if not database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
    
    # Create async engine
    engine = create_async_engine(database_url, echo=True)
    
    # Read SQL file
    sql_file = Path(__file__).parent / "023_add_event_soft_delete_fields.sql"
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
    async with engine.begin() as conn:
        print("🚀 Running migration 023: Add soft delete and configuration fields to events")
        print(f"   Executing {len(statements)} statements...")
        
        for i, statement in enumerate(statements, 1):
            try:
                await conn.execute(text(statement))
                print(f"   ✓ Statement {i}/{len(statements)} completed")
            except Exception as e:
                error_str = str(e).lower()
                if "already exists" in error_str or "does not exist" in error_str or "duplicate" in error_str:
                    print(f"   ⚠ Statement {i}/{len(statements)} skipped: {str(e)}")
                else:
                    print(f"   ✗ Statement {i}/{len(statements)} failed: {str(e)}")
                    raise
        
        print("✅ Migration 023 completed successfully!")
        print("   NOTE: configuration_type, is_deleted, version, and deleted_at columns added to events table")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())

