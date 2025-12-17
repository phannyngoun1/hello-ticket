#!/usr/bin/env python3
"""
Migration 008: Add Optimized Indexes for User Activity Queries
Description: Adds composite indexes optimized for user activity queries
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
        "postgresql+asyncpg://operations_user:operations_pass@localhost:5432/truths_operations"
    )
    
    # Ensure asyncpg URL
    if not database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
    
    # Create async engine
    engine = create_async_engine(database_url, echo=True)
    
    # Read SQL file
    sql_file = Path(__file__).parent / "008_add_user_activity_indexes.sql"
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    # Split SQL content into individual statements
    statements = []
    current_statement = []
    
    for line in sql_content.split('\n'):
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        
        current_statement.append(line)
        
        if stripped.endswith(';'):
            statement = '\n'.join(current_statement).strip()
            if statement:
                statements.append(statement)
            current_statement = []
    
    # Execute migration
    async with engine.begin() as conn:
        print("🚀 Running migration 008: Add User Activity Indexes")
        print(f"   Executing {len(statements)} statements...")
        
        for i, statement in enumerate(statements, 1):
            try:
                await conn.execute(text(statement))
                print(f"   ✓ Statement {i}/{len(statements)} completed")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"   ⚠ Statement {i}/{len(statements)} skipped (already exists)")
                else:
                    raise
        
        print("✅ Migration 008 completed successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())

