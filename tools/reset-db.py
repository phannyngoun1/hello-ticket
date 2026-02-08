#!/usr/bin/env python3
"""
Reset database - drop all tables for a fresh deploy.

Use this when you need to start clean (e.g. after migration squash).
WARNING: Destroys all data. Use only for development or fresh production setup.

Usage:
    DATABASE_URL=postgresql://... python tools/reset-db.py

On Railway: Run once from a local shell with DATABASE_URL from Railway dashboard,
or add as a one-off script in Railway.
"""
import os
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
backend_dir = project_root / "backend"
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")
load_dotenv(project_root / ".env")

def main():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)

    # Confirm in production
    if "production" in database_url.lower() or os.getenv("ENVIRONMENT") == "production":
        confirm = input("WARNING: This will DESTROY all data. Type 'yes' to confirm: ")
        if confirm.lower() != "yes":
            print("Aborted.")
            sys.exit(0)

    from sqlalchemy import create_engine, text

    engine = create_engine(database_url)

    with engine.connect() as conn:
        # Drop alembic_version first
        conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
        conn.commit()

        # Get all tables in public schema
        result = conn.execute(text("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public' AND tablename != 'alembic_version'
        """))
        tables = [row[0] for row in result]

        if tables:
            for t in tables:
                conn.execute(text(f'DROP TABLE IF EXISTS "{t}" CASCADE'))
            conn.commit()
            print(f"Dropped {len(tables)} tables")
        else:
            print("No tables to drop")

    print("Database reset. Run migrations to recreate schema: python tools/migrate-db.py upgrade")

if __name__ == "__main__":
    main()
