/**
 * CustomerType Types
 * 
 * This file contains all TypeScript types and interfaces for the CustomerType entity.
 * Types are co-located with the entity for better maintainability.
 */

/**
 * CustomerType Types
 */
export interface CustomerType {
    id: string;

    code: string;

    name: string;

    created_at: Date;
    updated_at?: Date;
}

export interface CreateCustomerTypeInput {

    code: string;

    name: string;

    }

export interface UpdateCustomerTypeInput {

    code?: string;

    name?: string;

    }
