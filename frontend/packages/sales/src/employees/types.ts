/**
 * Employee Types
 * 
 * This file contains all TypeScript types and interfaces for the Employee entity.
 * Types are co-located with the entity for better maintainability.
 * 
 * IMPORTANT: Do NOT duplicate these types in the package-level types.ts file.
 * The package types.ts should only contain shared types used across multiple entities.
 * These entity-specific types are automatically exported via the entity's index.ts.
 */

export interface Employee {
    id: string;
    code?: string;
    name: string;

    // System Link
    user_id?: string;
    work_email?: string;

    // Organizational Structure
    job_title?: string;
    department?: string;
    manager_id?: string;
    employment_type?: string;
    hire_date?: string;

    // Contact & Location
    work_phone?: string;
    mobile_phone?: string;
    office_location?: string;
    timezone: string;

    // Sales & Operational
    skills?: string[];
    assigned_territories?: string[];
    quota_config?: Record<string, any>;
    commission_tier?: string;

    // Personal (HR)
    birthday?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;

    created_at: Date;
    updated_at?: Date;
    deactivated_at?: Date;
}

export interface CreateEmployeeInput {
    code?: string;
    name: string;

    // System Link
    user_id?: string;
    work_email?: string;

    // Organizational Structure
    job_title?: string;
    department?: string;
    manager_id?: string;
    employment_type?: string;
    hire_date?: string;

    // Contact & Location
    work_phone?: string;
    mobile_phone?: string;
    office_location?: string;
    timezone?: string;

    // Sales & Operational
    skills?: string[];
    assigned_territories?: string[];
    quota_config?: Record<string, any>;
    commission_tier?: string;

    // Personal (HR)
    birthday?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
}

export interface UpdateEmployeeInput {
    code?: string;
    name?: string;

    // System Link
    user_id?: string;
    work_email?: string;

    // Organizational Structure
    job_title?: string;
    department?: string;
    manager_id?: string;
    employment_type?: string;
    hire_date?: string;

    // Contact & Location
    work_phone?: string;
    mobile_phone?: string;
    office_location?: string;
    timezone?: string;

    // Sales & Operational
    skills?: string[];
    assigned_territories?: string[];
    quota_config?: Record<string, any>;
    commission_tier?: string;

    // Personal (HR)
    birthday?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
}

export interface EmployeeFilter {
    search?: string;
    department?: string;
    employment_type?: string;
    createdAfter?: string;
    createdBefore?: string;
}

