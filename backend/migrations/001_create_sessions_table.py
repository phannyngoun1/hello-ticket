"""
Migration: Create sessions table
Date: 2025-10-13
Description: Add session tracking for multi-device login, session limits, and device restrictions
"""
from sqlalchemy import text
from app.infrastructure.database.connection import engine


def upgrade():
    """Apply migration"""
    with engine.connect() as conn:
        # Create sessions table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR PRIMARY KEY,
                user_id VARCHAR NOT NULL,
                tenant_id VARCHAR NOT NULL,
                status VARCHAR NOT NULL DEFAULT 'active',
                
                -- Device information
                device_type VARCHAR NOT NULL,
                user_agent TEXT NOT NULL,
                ip_address VARCHAR NOT NULL,
                device_name VARCHAR,
                os VARCHAR,
                browser VARCHAR,
                
                -- Session lifecycle
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                -- Revocation tracking
                revoked_at TIMESTAMP,
                revoked_by VARCHAR,
                revocation_reason TEXT
            )
        """))
        
        # Create indexes
        indexes = [
            "CREATE INDEX IF NOT EXISTS ix_sessions_id ON sessions(id)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_user_id ON sessions(user_id)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_tenant_id ON sessions(tenant_id)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_status ON sessions(status)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_device_type ON sessions(device_type)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_ip_address ON sessions(ip_address)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_created_at ON sessions(created_at)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_expires_at ON sessions(expires_at)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_last_activity_at ON sessions(last_activity_at)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_user_tenant ON sessions(user_id, tenant_id)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_user_status ON sessions(user_id, status)",
            "CREATE INDEX IF NOT EXISTS ix_sessions_tenant_status ON sessions(tenant_id, status)",
        ]
        
        for index_sql in indexes:
            conn.execute(text(index_sql))
        
        conn.commit()
        print("✓ Sessions table created successfully")


def downgrade():
    """Rollback migration"""
    with engine.connect() as conn:
        # Drop indexes first
        indexes = [
            "DROP INDEX IF EXISTS ix_sessions_tenant_status",
            "DROP INDEX IF EXISTS ix_sessions_user_status",
            "DROP INDEX IF EXISTS ix_sessions_user_tenant",
            "DROP INDEX IF EXISTS ix_sessions_last_activity_at",
            "DROP INDEX IF EXISTS ix_sessions_expires_at",
            "DROP INDEX IF EXISTS ix_sessions_created_at",
            "DROP INDEX IF EXISTS ix_sessions_ip_address",
            "DROP INDEX IF EXISTS ix_sessions_device_type",
            "DROP INDEX IF EXISTS ix_sessions_status",
            "DROP INDEX IF EXISTS ix_sessions_tenant_id",
            "DROP INDEX IF EXISTS ix_sessions_user_id",
            "DROP INDEX IF EXISTS ix_sessions_id",
        ]
        
        for index_sql in indexes:
            conn.execute(text(index_sql))
        
        # Drop table
        conn.execute(text("DROP TABLE IF EXISTS sessions"))
        conn.commit()
        print("✓ Sessions table dropped successfully")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "downgrade":
        print("Running downgrade...")
        downgrade()
    else:
        print("Running upgrade...")
        upgrade()

