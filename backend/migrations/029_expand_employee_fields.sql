-- Migration: 029_expand_employee_fields
-- Description: Add comprehensive employee fields for organizational structure, contact info, sales, and HR data

BEGIN;

-- Add System Link fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_email VARCHAR;

-- Add Organizational Structure fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_title VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add Contact & Location fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_phone VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS office_location VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS timezone VARCHAR DEFAULT 'UTC';

-- Add Sales & Operational fields (JSON columns)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS skills JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS assigned_territories JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS quota_config JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS commission_tier VARCHAR;

-- Add Personal (HR) fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ix_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS ix_employees_work_email ON employees(work_email);
CREATE INDEX IF NOT EXISTS ix_employees_tenant_department ON employees(tenant_id, department);
CREATE INDEX IF NOT EXISTS ix_employees_manager ON employees(manager_id);

-- Add foreign key constraint for manager_id (self-referential)
ALTER TABLE employees 
    ADD CONSTRAINT fk_employees_manager 
    FOREIGN KEY (manager_id) 
    REFERENCES employees(id) 
    ON DELETE SET NULL;

COMMIT;
