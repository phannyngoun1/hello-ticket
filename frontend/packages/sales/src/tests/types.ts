/**
 * Test Types
 * 
 * This file contains all TypeScript types and interfaces for the Test entity.
 * Types are co-located with the entity for better maintainability.
 * 
 * IMPORTANT: Do NOT duplicate these types in the package-level types.ts file.
 * The package types.ts should only contain shared types used across multiple entities.
 * These entity-specific types are automatically exported via the entity's index.ts.
 */

export interface Test {
    id: string;
    code?: string;
    name: string;
    created_at: Date;
    updated_at?: Date;
}

export interface CreateTestInput {
    code?: string;
    name: string;
}

export interface UpdateTestInput {
    code?: string;
    name?: string;
}

export interface TestFilter {
    search?: string;
    createdAfter?: string;
    createdBefore?: string;
}
