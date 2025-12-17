/**
 * TestBasic Types
 * 
 * This file contains all TypeScript types and interfaces for the TestBasic entity.
 * Types are co-located with the entity for better maintainability.
 */

/**
 * TestBasic Types
 */
export interface TestBasic {
    id: string;

    code: string;

    name: string;

    created_at: Date;
    updated_at?: Date;
}

export interface CreateTestBasicInput {

    code: string;

    name: string;

    }

export interface UpdateTestBasicInput {

    code?: string;

    name?: string;

    }
