/**
 * Organizer Types
 * 
 * This file contains all TypeScript types and interfaces for the Organizer entity.
 * Types are co-located with the entity for better maintainability.
 * 
 * IMPORTANT: Do NOT duplicate these types in the package-level types.ts file.
 * The package types.ts should only contain shared types used across multiple entities.
 * These entity-specific types are automatically exported via the entity's index.ts.
 */

export interface Organizer {
    id: string;
    code?: string;
    name: string;
    description?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    logo?: string | null;
    tags?: string[];
    created_at: Date;
    updated_at?: Date;
}

export interface CreateOrganizerInput {
    code?: string;
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    logo?: string;
    tags?: string[];
}

export interface UpdateOrganizerInput {
    code?: string;
    name?: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    logo?: string;
    tags?: string[];
}

export interface OrganizerFilter {
    search?: string;
    createdAfter?: string;
    createdBefore?: string;
}
