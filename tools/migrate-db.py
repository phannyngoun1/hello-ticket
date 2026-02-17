#!/usr/bin/env python3
"""
Hello Ticket Database Migration CLI Tool

Command-line interface for managing database migrations using Alembic.

Usage:
    python tools/migrate-db.py upgrade [revision]
    python tools/migrate-db.py upgrade-or-stamp           # Only for recovery: if DB has unknown revision after squashing, stamp to head (use upgrade for normal deploys)
    python tools/migrate-db.py downgrade [revision]
    python tools/migrate-db.py current
    python tools/migrate-db.py history
    python tools/migrate-db.py create "Migration description"
    python tools/migrate-db.py create-initial [message]  # Create initial migration (bypasses up-to-date check)
    python tools/migrate-db.py stamp [revision]           # Set DB revision without running migrations (fix Railway "Can't locate revision")
    python tools/migrate-db.py status
    
    # All commands can also be used with "migrate" prefix:
    # python tools/migrate-db.py migrate <command>
"""
import sys
import os
import argparse
from pathlib import Path

# Add backend directory to path (from root tools/ directory)
# File is at: tools/migrate-db.py
# Backend is at: backend/
project_root = Path(__file__).parent.parent
backend_dir = project_root / "backend"
sys.path.insert(0, str(backend_dir))

# Load .env from project root and backend (production uses env vars from Railway/etc.)
def _load_env():
    try:
        from dotenv import load_dotenv
        load_dotenv(project_root / ".env")
        load_dotenv(backend_dir / ".env")
    except ImportError:
        pass

# Note: Working directory will be changed to backend_dir when running migration commands
# This ensures Alembic can find alembic.ini and alembic/ directory


def setup_migration_functions():
    """Import migration functions from manage_migrations"""
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        "manage_migrations", backend_dir / "manage_migrations.py"
    )
    manage_migrations = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(manage_migrations)
    return manage_migrations


def migrate_upgrade(args):
    """Upgrade database to a specific revision"""
    # Change to backend directory so Alembic can find alembic.ini and alembic/ folder
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        revision = args.revision if args.revision else "head"
        migrations.upgrade_migration(revision)
    finally:
        os.chdir(original_cwd)


def migrate_upgrade_or_stamp(args):
    """Upgrade to head. If DB has an unknown revision (e.g. after squashing migrations), clear and stamp to head.
    WARNING: Use 'upgrade' for normal production deploys. Only use upgrade-or-stamp when you intentionally
    changed migration history (squashed) and production schema already matches head."""
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        try:
            migrations.upgrade_migration("head")
        except Exception as e:
            err_msg = str(e)
            if "Can't locate revision" in err_msg or "No such revision" in err_msg:
                print("WARNING: Database has an unknown revision. This should only happen after squashing migrations.")
                print("If production schema already matches head, stamping. Otherwise, fix manually.")
                print("Clearing alembic_version and stamping to head...")
                migrations.clear_version_table()
                migrations.stamp_migration("head")
            else:
                raise
    finally:
        os.chdir(original_cwd)


def migrate_downgrade(args):
    """Downgrade database by one or to a specific revision"""
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        revision = args.revision if args.revision else "-1"
        migrations.downgrade_migration(revision)
    finally:
        os.chdir(original_cwd)


def migrate_current(args):
    """Show current database revision"""
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        migrations.show_current()
    finally:
        os.chdir(original_cwd)


def migrate_history(args):
    """Show migration history"""
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        migrations.show_history()
    finally:
        os.chdir(original_cwd)


def migrate_create_initial(args):
    """Create the initial migration (bypasses up-to-date check)"""
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        message = args.message if args.message else "Initial migration - create all tables"
        migrations.create_initial_migration(message)
    finally:
        os.chdir(original_cwd)


def migrate_create(args):
    """Create a new migration"""
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        if not args.message:
            print("Error: Migration message is required")
            print('Usage: python tools/migrate-db.py create "Migration description"')
            sys.exit(1)
        migrations.create_migration(args.message)
    finally:
        os.chdir(original_cwd)


def migrate_stamp(args):
    """Set database revision without running migrations (fixes 'Can't locate revision' on Railway etc.)."""
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        revision = args.revision if args.revision else "head"
        migrations.stamp_migration(revision)
    finally:
        os.chdir(original_cwd)


def migrate_clear_version(args):
    """Delete the alembic_version row so stamp/upgrade can run (when DB has unknown revision)."""
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        migrations.clear_version_table()
    finally:
        os.chdir(original_cwd)


def migrate_status(args):
    """Show migration status (pending migrations)"""
    original_cwd = os.getcwd()
    os.chdir(str(backend_dir))
    try:
        migrations = setup_migration_functions()
        is_up_to_date, current_rev, head_revs = migrations.is_database_up_to_date()
        
        if is_up_to_date:
            print("✅ Database is up to date!")
            if current_rev:
                print(f"   Current revision: {current_rev}")
        else:
            print("⚠️  Database is not up to date!")
            if current_rev:
                print(f"   Current database revision: {current_rev}")
            else:
                print("   Database is not under Alembic version control")
            if head_revs:
                print(f"   Latest migration heads: {', '.join(head_revs)}")
            print("\n   Run 'python tools/migrate-db.py upgrade' to apply pending migrations")
    finally:
        os.chdir(original_cwd)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Hello Ticket Database Migration CLI - Manage database migrations using Alembic",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Upgrade to latest migration
  python tools/migrate-db.py upgrade

  # Upgrade to specific revision
  python tools/migrate-db.py upgrade abc123

  # Check current migration status
  python tools/migrate-db.py status

  # Show current revision
  python tools/migrate-db.py current

  # View migration history
  python tools/migrate-db.py history

  # Create a new migration
  python tools/migrate-db.py create "Add new field to table"

  # Create initial migration (first time setup)
  python tools/migrate-db.py create-initial

  # Fix "Can't locate revision" (e.g. on Railway after migration history change)
  python tools/migrate-db.py stamp head

  # Downgrade one revision
  python tools/migrate-db.py downgrade

  # Downgrade to specific revision
  python tools/migrate-db.py downgrade abc123

  # Note: All commands can also be used with "migrate" prefix:
  # python tools/migrate-db.py migrate <command>
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Migrate command group
    migrate_parser = subparsers.add_parser(
        "migrate",
        help="Database migration commands",
        description="Manage database migrations using Alembic"
    )
    migrate_subparsers = migrate_parser.add_subparsers(dest="migrate_command", help="Migration subcommands")
    
    # Migrate upgrade
    upgrade_parser = migrate_subparsers.add_parser(
        "upgrade",
        help="Upgrade database to a specific revision (default: head)"
    )
    upgrade_parser.add_argument(
        "revision",
        nargs="?",
        default="head",
        help="Target revision (default: head)"
    )
    upgrade_parser.set_defaults(func=migrate_upgrade)
    
    # Migrate upgrade-or-stamp (for Railway: self-heals when DB has unknown revision)
    upgrade_or_stamp_parser = migrate_subparsers.add_parser(
        "upgrade-or-stamp",
        help="Upgrade to head; if 'Can't locate revision', stamp head then upgrade (use as Railway release command)"
    )
    upgrade_or_stamp_parser.set_defaults(func=migrate_upgrade_or_stamp)
    
    # Migrate downgrade
    downgrade_parser = migrate_subparsers.add_parser(
        "downgrade",
        help="Downgrade database by one or to a specific revision"
    )
    downgrade_parser.add_argument(
        "revision",
        nargs="?",
        default="-1",
        help="Target revision (default: -1, one step back)"
    )
    downgrade_parser.set_defaults(func=migrate_downgrade)
    
    # Migrate current
    current_parser = migrate_subparsers.add_parser(
        "current",
        help="Show current database revision"
    )
    current_parser.set_defaults(func=migrate_current)
    
    # Migrate history
    history_parser = migrate_subparsers.add_parser(
        "history",
        help="Show migration history"
    )
    history_parser.set_defaults(func=migrate_history)
    
    # Migrate create
    create_parser = migrate_subparsers.add_parser(
        "create",
        help="Create a new migration"
    )
    create_parser.add_argument(
        "message",
        help="Migration description message"
    )
    create_parser.set_defaults(func=migrate_create)
    
    # Migrate create-initial
    create_initial_parser = migrate_subparsers.add_parser(
        "create-initial",
        help="Create the initial migration (bypasses up-to-date check)"
    )
    create_initial_parser.add_argument(
        "message",
        nargs="?",
        default="Initial migration - create all tables",
        help="Migration description message (default: 'Initial migration - create all tables')"
    )
    create_initial_parser.set_defaults(func=migrate_create_initial)
    
    # Migrate status
    status_parser = migrate_subparsers.add_parser(
        "status",
        help="Check migration status (show pending migrations)"
    )
    status_parser.set_defaults(func=migrate_status)
    
    # Migrate stamp
    stamp_parser = migrate_subparsers.add_parser(
        "stamp",
        help="Set DB revision without running migrations (fix 'Can't locate revision' e.g. on Railway)"
    )
    stamp_parser.add_argument(
        "revision",
        nargs="?",
        default="head",
        help="Revision to stamp (default: head)"
    )
    stamp_parser.set_defaults(func=migrate_stamp)
    
    # Migrate clear-version
    clear_version_parser = migrate_subparsers.add_parser(
        "clear-version",
        help="Delete alembic_version row (run this when stamp fails with 'Can't locate revision')"
    )
    clear_version_parser.set_defaults(func=migrate_clear_version)
    
    # Direct commands (without "migrate" prefix for convenience)
    upgrade_direct = subparsers.add_parser(
        "upgrade",
        help="Upgrade database to latest migration (shortcut)"
    )
    upgrade_direct.add_argument(
        "revision",
        nargs="?",
        default="head",
        help="Target revision (default: head)"
    )
    upgrade_direct.set_defaults(func=migrate_upgrade)
    
    upgrade_or_stamp_direct = subparsers.add_parser(
        "upgrade-or-stamp",
        help="Upgrade to head; if DB has unknown revision, stamp then upgrade (Railway release command)"
    )
    upgrade_or_stamp_direct.set_defaults(func=migrate_upgrade_or_stamp)
    
    downgrade_direct = subparsers.add_parser(
        "downgrade",
        help="Downgrade database by one or to a specific revision (shortcut)"
    )
    downgrade_direct.add_argument(
        "revision",
        nargs="?",
        default="-1",
        help="Target revision (default: -1, one step back)"
    )
    downgrade_direct.set_defaults(func=migrate_downgrade)
    
    status_direct = subparsers.add_parser(
        "status",
        help="Check migration status (shortcut)"
    )
    status_direct.set_defaults(func=migrate_status)
    
    current_direct = subparsers.add_parser(
        "current",
        help="Show current database revision (shortcut)"
    )
    current_direct.set_defaults(func=migrate_current)
    
    history_direct = subparsers.add_parser(
        "history",
        help="Show migration history (shortcut)"
    )
    history_direct.set_defaults(func=migrate_history)
    
    create_direct = subparsers.add_parser(
        "create",
        help="Create a new migration (shortcut)"
    )
    create_direct.add_argument(
        "message",
        help="Migration description message"
    )
    create_direct.set_defaults(func=migrate_create)
    
    create_initial_direct = subparsers.add_parser(
        "create-initial",
        help="Create the initial migration (shortcut, bypasses up-to-date check)"
    )
    create_initial_direct.add_argument(
        "message",
        nargs="?",
        default="Initial migration - create all tables",
        help="Migration description message (default: 'Initial migration - create all tables')"
    )
    create_initial_direct.set_defaults(func=migrate_create_initial)
    
    stamp_direct = subparsers.add_parser(
        "stamp",
        help="Set DB revision without running migrations (fix 'Can't locate revision' e.g. on Railway)"
    )
    stamp_direct.add_argument(
        "revision",
        nargs="?",
        default="head",
        help="Revision to stamp (default: head)"
    )
    stamp_direct.set_defaults(func=migrate_stamp)
    
    clear_version_direct = subparsers.add_parser(
        "clear-version",
        help="Delete alembic_version row (when stamp fails with 'Can't locate revision')"
    )
    clear_version_direct.set_defaults(func=migrate_clear_version)
    
    args = parser.parse_args()
    _load_env()

    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        args.func(args)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

