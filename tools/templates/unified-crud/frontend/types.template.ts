/**
 * {{EntityName}} Types
 * 
 * This file contains all TypeScript types and interfaces for the {{EntityName}} entity.
 * Types are co-located with the entity for better maintainability.
 * 
 * IMPORTANT: Do NOT duplicate these types in the package-level types.ts file.
 * The package types.ts should only contain shared types used across multiple entities.
 * These entity-specific types are automatically exported via the entity's index.ts.
 */
export interface { { EntityName } } {
    id: string;
    { { #fields } }
    { { #unless isSystemField } }
    { { name } }: { { type } };
    { {/unless } }
    { {/fields } }
    created_at: Date;
    updated_at?: Date;
}

export interface Create {{ EntityName }}Input {
    { { #fields } }
    { { #unless isSystemField } }
    { { name } } { { #unless required } }?{ {/unless } }: { { type } };
    { {/unless } }
    { {/fields } }
}

export interface Update {{ EntityName }}Input {
    { { #fields } }
    { { #unless isSystemField } }
    { { name } }?: { { type } };
    { {/unless } }
    { {/fields } }
}

export interface { { EntityName } }Filter {
    search ?: string;
    { { StatusFilterField } } { { FilterFields } }
}
