#!/usr/bin/env python3
"""
Migration 017: Change seat section to section_id
Description: Changes section string field to section_id foreign key reference
"""

import asyncio
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run_migration():
    """Execute the migration SQL file."""
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
    sql_file = Path(__file__).parent / "017_change_seat_section_to_section_id.sql"
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    # Split SQL content into individual statements
    # Remove comments and split by semicolon
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
        print("🚀 Running migration 017: Change seat section to section_id")
        print(f"   Executing {len(statements)} statements...")
        
        for i, statement in enumerate(statements, 1):
            try:
                await conn.execute(text(statement))
                print(f"   ✓ Statement {i}/{len(statements)} completed")
            except Exception as e:
                # Some statements might fail if already exists (IF NOT EXISTS)
                error_str = str(e).lower()
                if "already exists" in error_str or "does not exist" in error_str:
                    print(f"   ⚠ Statement {i}/{len(statements)} skipped: {str(e)}")
                else:
                    print(f"   ✗ Statement {i}/{len(statements)} failed: {str(e)}")
                    raise
        
        print("✅ Migration 017 completed successfully!")
        print("   NOTE: All existing seat section strings have been converted to section records")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())

