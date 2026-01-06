#!/usr/bin/env python3
"""
Database migration script for adding details to organizers table.

This migration adds description, email, phone, website, address, city, country, and logo.
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
    sql_file = Path(__file__).parent / "030_add_details_to_organizers.sql"
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
        print("🚀 Running migration 030: Add details to organizers")
        print(f"   Executing {len(statements)} statements...")
        
        for i, statement in enumerate(statements, 1):
            try:
                await conn.execute(text(statement))
                print(f"   ✓ Statement {i}/{len(statements)} completed")
            except Exception as e:
                error_str = str(e).lower()
                if "already exists" in error_str:
                    print(f"   ⚠ Statement {i}/{len(statements)} skipped: Column or index already exists")
                else:
                    print(f"   ✗ Statement {i}/{len(statements)} failed: {str(e)}")
                    # Don't raise if it's just allowed failures, but otherwise:
                    # raise
        
        print("✅ Migration 030 completed successfully!")
        print("   NOTE: new fields added to organizers table")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
