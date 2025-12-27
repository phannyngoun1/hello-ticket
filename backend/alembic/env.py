"""
Alembic environment configuration for SQLModel

This file configures Alembic to work with SQLModel and the single unified database.
The database URL is read from the DATABASE_URL environment variable.
"""
from logging.config import fileConfig
import os
import sys
from pathlib import Path

from sqlalchemy import engine_from_config
from sqlalchemy import pool, MetaData
from alembic import context

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import SQLModel and models
from sqlmodel import SQLModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import all models to ensure they're registered with SQLModel metadata
# Operational models
from app.infrastructure.shared.database.models import (
    operational_metadata,
    # Sales master data
    TestEntityModel, TestModel, CustomerTypeModel,
    CustomerGroupModel, TestTreeBackendModel, TestTreeModel, TestBasicModel,
    # Ticketing master data
    VenueModel, LayoutModel, SectionModel, SeatModel,
    OrganizerModel, EventTypeModel, EventModel, ShowModel,
    ShowImageModel, EventSeatModel,
    # Legacy models
    UserCacheModel,
    # UI Builder
    UISchemaModel,
    UISchemaVersionModel,
    UIPageModel,
    UICustomComponentModel,
    # Audit
    AuditLogModel,
)

# Platform models (now in the same database)
from app.infrastructure.shared.database.platform_models import (
    platform_metadata,
    TenantModel,
    TenantSubscriptionModel,
    UserModel,
    SessionModel,
    GroupModel,
    UserGroupModel,
    RoleModel,
    UserRoleModel,
    GroupRoleModel,
    UserPreferenceModel,
)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Get database URL from environment variable
database_url = os.getenv(
    "DATABASE_URL",
    "postgresql://ticket:ticket_pass@localhost:5432/ticket"
)

# Override sqlalchemy.url with environment variable
config.set_main_option("sqlalchemy.url", database_url)

# Combine platform and operational metadata for autogenerate support
# Create a combined metadata that includes tables from both
combined_metadata = MetaData()

# Copy tables from both metadata objects
for table in operational_metadata.sorted_tables:
    table.to_metadata(combined_metadata)

for table in platform_metadata.sorted_tables:
    table.to_metadata(combined_metadata)

# For 'autogenerate' support, use combined metadata
target_metadata = combined_metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

