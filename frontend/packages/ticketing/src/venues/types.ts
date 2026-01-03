/**
 * Venue Types
 * 
 * This file contains all TypeScript types and interfaces for the Venue entity.
 * Types are co-located with the entity for better maintainability.
 * 
 * IMPORTANT: Do NOT duplicate these types in the package-level types.ts file.
 * The package types.ts should only contain shared types used across multiple entities.
 * These entity-specific types are automatically exported via the entity's index.ts.
 */

export interface Venue {
    id: string;
    code?: string;
    name: string;
    description?: string;
    image_url?: string;
    venue_type?: string;
    capacity?: number;
    parking_info?: string;
    accessibility?: string;
    amenities?: string[];
    opening_hours?: string;
    phone?: string;
    email?: string;
    website?: string;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    created_at: Date;
    updated_at?: Date;
}

export interface CreateVenueInput {
    code?: string;
    name: string;
    description?: string;
    image_url?: string;
    venue_type?: string;
    capacity?: number;
    parking_info?: string;
    accessibility?: string;
    amenities?: string[];
    opening_hours?: string;
    phone?: string;
    email?: string;
    website?: string;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
}

export interface UpdateVenueInput {
    code?: string;
    name?: string;
    description?: string;
    image_url?: string;
    venue_type?: string;
    capacity?: number;
    parking_info?: string;
    accessibility?: string;
    amenities?: string[];
    opening_hours?: string;
    phone?: string;
    email?: string;
    website?: string;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
}

export interface VenueFilter {
    search?: string;
    createdAfter?: string;
    createdBefore?: string;
}
