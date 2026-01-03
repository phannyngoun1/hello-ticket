/**
 * VenueType Types
 * 
 * This file contains all TypeScript types and interfaces for the VenueType entity.
 * Types are co-located with the entity for better maintainability.
 */

/**
 * VenueType Types
 */
export interface VenueType {
    id: string;

    code: string;

    name: string;

    created_at: Date;
    updated_at?: Date;
}

export interface CreateVenueTypeInput {

    code: string;

    name: string;

    }

export interface UpdateVenueTypeInput {

    code?: string;

    name?: string;

    }
