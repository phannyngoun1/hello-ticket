/**
 * EventType Types
 * 
 * This file contains all TypeScript types and interfaces for the EventType entity.
 * Types are co-located with the entity for better maintainability.
 */

/**
 * EventType Types
 */
export interface EventType {
    id: string;

    code: string;

    name: string;

    created_at: Date;
    updated_at?: Date;
}

export interface CreateEventTypeInput {

    code: string;

    name: string;

    }

export interface UpdateEventTypeInput {

    code?: string;

    name?: string;

    }
