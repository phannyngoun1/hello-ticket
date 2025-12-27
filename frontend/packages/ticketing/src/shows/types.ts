/**
 * Show Types
 * 
 * This file contains all TypeScript types and interfaces for the Show entity.
 * Types are co-located with the entity for better maintainability.
 * 
 * IMPORTANT: Do NOT duplicate these types in the package-level types.ts file.
 * The package types.ts should only contain shared types used across multiple entities.
 * These entity-specific types are automatically exported via the entity's index.ts.
 */

export interface Show {
    id: string;
    code?: string;
    name: string;
    organizer_id?: string;
    started_date?: string; // ISO date string
    ended_date?: string; // ISO date string
    note?: string;
    created_at: Date;
    updated_at?: Date;
}

export interface ShowImageData {
    file_id: string;
    name: string;
    description?: string;
    is_banner?: boolean;
}

export interface CreateShowInput {
    code?: string;
    name: string;
    organizer_id?: string;
    started_date?: string; // ISO date string
    ended_date?: string; // ISO date string
    note?: string;
    images?: ShowImageData[];
}

export interface UpdateShowInput {
    code?: string;
    name?: string;
    organizer_id?: string;
    started_date?: string; // ISO date string
    ended_date?: string; // ISO date string
    note?: string;
    images?: ShowImageData[];
}

export interface ShowFilter {
    search?: string;
    createdAfter?: string;
    createdBefore?: string;
}

export interface ShowImage {
    id: string;
    show_id: string;
    file_id: string;
    name: string;
    description?: string;
    is_banner: boolean;
    file_url?: string; // Populated from file_uploads
    created_at: Date;
    updated_at: Date;
}

export interface CreateShowImageInput {
    show_id: string;
    file_id: string;
    name: string;
    description?: string;
    is_banner?: boolean;
}

export interface UpdateShowImageInput {
    name?: string;
    description?: string;
    is_banner?: boolean;
}
