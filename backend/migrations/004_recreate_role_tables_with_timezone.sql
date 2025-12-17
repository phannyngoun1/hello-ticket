-- Migration: Recreate roles, group_roles, and user_roles tables with timezone-aware timestamps
-- Date: 2025-10-25
-- Description: Drop and recreate roles-related tables with TIMESTAMP WITH TIME ZONE
--              This ensures SQLAlchemy generates correct SQL for asyncpg

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
DROP TABLE IF EXISTS roles
CASCADE;

CREATE TABLE roles
(
    id VARCHAR PRIMARY KEY,
    tenant_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description VARCHAR,
    permissions VARCHAR NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    created_by VARCHAR,
    created_at TIMESTAMP
    WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP
    WITH TIME ZONE NOT NULL
);

    -- Create indexes for roles
    CREATE INDEX ix_roles_id ON roles(id);
    CREATE INDEX ix_roles_tenant_id ON roles(tenant_id);
    CREATE INDEX ix_roles_name ON roles(name);
    CREATE INDEX ix_roles_is_active ON roles(is_active);
    CREATE UNIQUE INDEX ix_roles_tenant_name ON roles(tenant_id, name);
    CREATE INDEX ix_roles_tenant_active ON roles(tenant_id, is_active);

    -- ============================================================================
    -- GROUP_ROLES TABLE
    -- ============================================================================
    DROP TABLE IF EXISTS group_roles
    CASCADE;

    CREATE TABLE group_roles
    (
        id VARCHAR PRIMARY KEY,
        group_id VARCHAR NOT NULL,
        role_id VARCHAR NOT NULL,
        tenant_id VARCHAR NOT NULL,
        added_by VARCHAR,
        added_at TIMESTAMP
        WITH TIME ZONE NOT NULL
);

        -- Create indexes for group_roles
        CREATE INDEX ix_group_roles_id ON group_roles(id);
        CREATE INDEX ix_group_roles_group_id ON group_roles(group_id);
        CREATE INDEX ix_group_roles_role_id ON group_roles(role_id);
        CREATE INDEX ix_group_roles_tenant_id ON group_roles(tenant_id);
        CREATE UNIQUE INDEX ix_group_roles_group_role ON group_roles(group_id, role_id);
        CREATE INDEX ix_group_roles_group_tenant ON group_roles(group_id, tenant_id);
        CREATE INDEX ix_group_roles_role_tenant ON group_roles(role_id, tenant_id);

        -- ============================================================================
        -- USER_ROLES TABLE
        -- ============================================================================
        DROP TABLE IF EXISTS user_roles
        CASCADE;

        CREATE TABLE user_roles
        (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            role_id VARCHAR NOT NULL,
            tenant_id VARCHAR NOT NULL,
            assigned_by VARCHAR,
            assigned_at TIMESTAMP
            WITH TIME ZONE NOT NULL
);

            -- Create indexes for user_roles
            CREATE INDEX ix_user_roles_id ON user_roles(id);
            CREATE INDEX ix_user_roles_user_id ON user_roles(user_id);
            CREATE INDEX ix_user_roles_role_id ON user_roles(role_id);
            CREATE INDEX ix_user_roles_tenant_id ON user_roles(tenant_id);
            CREATE UNIQUE INDEX ix_user_roles_user_role ON user_roles(user_id, role_id);
            CREATE INDEX ix_user_roles_role_tenant ON user_roles(role_id, tenant_id);
            CREATE INDEX ix_user_roles_user_tenant ON user_roles(user_id, tenant_id);

