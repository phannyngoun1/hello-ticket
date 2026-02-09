#!/usr/bin/env python3
"""
Helper script for managing Alembic database migrations

Usage:
    python manage_migrations.py create "Migration description"
    python manage_migrations.py upgrade [revision]
    python manage_migrations.py downgrade [revision]
    python manage_migrations.py stamp [revision]   # set DB revision without running migrations
    python manage_migrations.py clear-version      # delete alembic_version row (then run stamp or upgrade)
    python manage_migrations.py current
    python manage_migrations.py history
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from alembic.config import Config
from alembic import command
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory


def get_alembic_config():
    """Get Alembic configuration"""
    alembic_cfg = Config(str(backend_dir / "alembic.ini"))
    return alembic_cfg


def is_database_up_to_date():
    """Check if database is up to date with migration heads"""
    try:
        from dotenv import load_dotenv
        load_dotenv()
        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://ticket:ticket_pass@localhost:5432/ticket"
        )
        
        from sqlalchemy import create_engine
        engine = create_engine(database_url)
        
        alembic_cfg = get_alembic_config()
        script = ScriptDirectory.from_config(alembic_cfg)
        
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current_rev = context.get_current_revision()
            heads = script.get_revisions("head")
            head_revs = [head.revision for head in heads]
            
            # If no current revision, database is not initialized
            if not current_rev:
                return False, None, head_revs
            
            # Check if current revision is one of the heads
            if current_rev in head_revs:
                return True, current_rev, head_revs
            
            # Database is not up to date
            return False, current_rev, head_revs
    except Exception as e:
        # If we can't check, assume it's okay (might be first migration)
        return True, None, []


def create_initial_migration(message: str = "Initial migration - create all tables"):
    """Create the initial migration without checking if database is up to date"""
    print(f"Creating initial migration: {message}")
    alembic_cfg = get_alembic_config()
    try:
        command.revision(alembic_cfg, autogenerate=True, message=message)
        print("✅ Initial migration created successfully!")
        print("\n📝 Next steps:")
        print("   1. Review the generated migration file in alembic/versions/")
        print("   2. Fix any sqlmodel.sql.sqltypes.AutoString() references to sa.String() if needed")
        print("   3. Run: python tools/migrate-db.py upgrade")
    except Exception as e:
        print(f"❌ Error creating initial migration: {e}")
        raise


def create_migration(message: str):
    """Create a new migration with autogenerate"""
    print(f"Creating migration: {message}")
    
    # Check if database is up to date before creating migration
    is_up_to_date, current_rev, head_revs = is_database_up_to_date()
    
    if not is_up_to_date:
        print(f"\n⚠️  Warning: Database is not up to date!")
        if current_rev:
            print(f"   Current database revision: {current_rev}")
        else:
            print(f"   Database is not under Alembic version control")
        print(f"   Latest migration heads: {', '.join(head_revs) if head_revs else 'None'}")
        print(f"\n   Alembic requires the database to be up to date before creating a new migration.")
        print(f"   You need to apply pending migrations first.\n")
        print(f"   Run this command to upgrade the database:")
        print(f"   python manage_migrations.py upgrade head")
        print(f"\n   Or check the current status:")
        print(f"   python manage_migrations.py current")
        sys.exit(1)
    
    alembic_cfg = get_alembic_config()
    try:
        command.revision(alembic_cfg, autogenerate=True, message=message)
        print("✅ Migration created successfully!")
        print("\n📝 Next steps:")
        print("   1. Review the generated migration file in alembic/versions/")
        print("   2. Make any necessary adjustments")
        print("   3. Run: python manage_migrations.py upgrade head")
    except Exception as e:
        error_msg = str(e)
        if "Target database is not up to date" in error_msg:
            print(f"\n❌ Error: Target database is not up to date.")
            print(f"\n   This means there are pending migrations that haven't been applied.")
            print(f"   Please upgrade the database first:\n")
            print(f"   python manage_migrations.py upgrade head")
            print(f"\n   To check the current status:")
            print(f"   python manage_migrations.py current")
        else:
            raise


def upgrade_migration(revision: str = "head"):
    """Upgrade database to a specific revision"""
    print(f"Upgrading database to: {revision}")
    alembic_cfg = get_alembic_config()
    command.upgrade(alembic_cfg, revision)
    print(f"✅ Database upgraded to {revision}!")


def downgrade_migration(revision: str = "-1"):
    """Downgrade database by one or to a specific revision"""
    print(f"Downgrading database: {revision}")
    alembic_cfg = get_alembic_config()
    command.downgrade(alembic_cfg, revision)
    print(f"✅ Database downgraded!")


def stamp_migration(revision: str = "head"):
    """Set the database's current revision without running migrations.

    Use this when the DB has an orphan revision (e.g. after squashing migrations
    or deploying with different history). Example: "Can't locate revision 'f3d9b47c00fa'".
    Only run if the database schema already matches the target revision.
    """
    print(f"Stamping database to revision: {revision}")
    alembic_cfg = get_alembic_config()
    command.stamp(alembic_cfg, revision)
    print(f"✅ Database stamped to {revision}!")


def get_database_url():
    """Return DATABASE_URL with postgres:// normalized to postgresql://."""
    from dotenv import load_dotenv
    load_dotenv()
    raw = os.getenv("DATABASE_URL", "postgresql://ticket:ticket_pass@localhost:5432/ticket")
    if raw.startswith("postgres://"):
        return "postgresql://" + raw[len("postgres://"):]
    return raw


def clear_version_table():
    """Remove the row from alembic_version so stamp/upgrade can run (fixes 'Can't locate revision')."""
    from dotenv import load_dotenv
    load_dotenv()
    from sqlalchemy import create_engine, text
    database_url = get_database_url()
    engine = create_engine(database_url)
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM alembic_version"))
        conn.commit()
    print("✅ Cleared alembic_version table.")
    print("   Next: run 'python tools/migrate-db.py stamp head' (if schema is up to date)")
    print("         or 'python tools/migrate-db.py upgrade' to apply migrations.")


def show_current():
    """Show current database revision"""
    alembic_cfg = get_alembic_config()
    script = ScriptDirectory.from_config(alembic_cfg)
    
    # Get database URL
    from dotenv import load_dotenv
    load_dotenv()
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql://ticket:ticket_pass@localhost:5432/ticket"
    )
    
    from sqlalchemy import create_engine
    engine = create_engine(database_url)
    
    with engine.connect() as connection:
        context = MigrationContext.configure(connection)
        current_rev = context.get_current_revision()
        
        if current_rev:
            print(f"Current database revision: {current_rev}")
            try:
                script_rev = script.get_revision(current_rev)
                if script_rev:
                    print(f"Description: {script_rev.doc}")
            except Exception:
                pass
        else:
            print("Database is not under Alembic version control")
            print("Run 'python manage_migrations.py upgrade head' to initialize")


def show_history():
    """Show migration history"""
    alembic_cfg = get_alembic_config()
    command.history(alembic_cfg)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command_name = sys.argv[1].lower()
    
    try:
        if command_name == "create":
            if len(sys.argv) < 3:
                print("Error: Migration message is required")
                print("Usage: python manage_migrations.py create 'Migration description'")
                sys.exit(1)
            message = sys.argv[2]
            create_migration(message)
        
        elif command_name == "upgrade":
            revision = sys.argv[2] if len(sys.argv) > 2 else "head"
            upgrade_migration(revision)
        
        elif command_name == "downgrade":
            revision = sys.argv[2] if len(sys.argv) > 2 else "-1"
            downgrade_migration(revision)
        
        elif command_name == "stamp":
            revision = sys.argv[2] if len(sys.argv) > 2 else "head"
            stamp_migration(revision)
        
        elif command_name == "clear-version":
            clear_version_table()
        
        elif command_name == "current":
            show_current()
        
        elif command_name == "history":
            show_history()
        
        else:
            print(f"Unknown command: {command_name}")
            print(__doc__)
            sys.exit(1)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

