#!/usr/bin/env python3
"""
Migration script to expand employee fields.

This migration adds comprehensive fields to the employees table:
- System link (user_id, work_email)
- Organizational structure (job_title, department, manager_id, employment_type, hire_date)
- Contact & location (work_phone, mobile_phone, office_location, timezone)
- Sales & operational (skills, assigned_territories, quota_config, commission_tier)
- Personal/HR (birthday, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text

# Database connection settings - use DATABASE_URL if available, otherwise use individual env vars
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    conn_string = DATABASE_URL
else:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "ticket")
    DB_USER = os.getenv("DB_USER", "ticket")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "ticket_pass")
    conn_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def run_migration():
    """Run the migration to expand employee fields"""
    
    # Read the SQL migration file
    migration_file = Path(__file__).parent / "029_expand_employee_fields.sql"
    
    if not migration_file.exists():
        print(f"Error: Migration file not found: {migration_file}")
        sys.exit(1)
    
    with open(migration_file, "r") as f:
        sql_content = f.read()
    
    print(f"Connecting to database using {'DATABASE_URL' if DATABASE_URL else 'individual settings'}")
    
    try:
        # Create engine and connection
        engine = create_engine(conn_string)
        
        with engine.connect() as conn:
            # Execute the migration SQL
            print("Executing migration: 029_expand_employee_fields.sql")
            conn.execute(text(sql_content))
            conn.commit()
            print("Migration completed successfully!")
            print("\nAdded columns:")
            print("  - System Link: user_id, work_email")
            print("  - Organizational: job_title, department, manager_id, employment_type, hire_date")
            print("  - Contact: work_phone, mobile_phone, office_location, timezone")
            print("  - Sales: skills, assigned_territories, quota_config, commission_tier")
            print("  - HR: birthday, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship")
            
    except Exception as e:
        print(f"Error running migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
