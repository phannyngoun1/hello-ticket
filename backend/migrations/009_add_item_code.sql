-- Add optional ERP item code to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS code VARCHAR(100);

-- Create partial unique index for code per tenant when provided
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'ix_items_tenant_code'
          AND n.nspname = 'public'
    ) THEN
        CREATE UNIQUE INDEX ix_items_tenant_code
            ON items(tenant_id, code)
            WHERE code IS NOT NULL;
    END IF;
END$$;

-- Create simple index on code to speed lookups (optional - partial unique covers most cases)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'ix_items_code'
          AND n.nspname = 'public'
    ) THEN
        CREATE INDEX ix_items_code ON items(code);
    END IF;
END$$;


