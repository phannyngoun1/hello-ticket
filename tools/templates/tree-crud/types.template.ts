/**
 * {{EntityName}} Types
 * 
 * Types for {{entity-name}} management with hierarchy support
 */

export interface {{EntityName}} {
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    description?: string;
    parent_id: string | null;
    level: number;
    sort_order: number;
    is_active: boolean;
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}: {{type}}{{#if required}}{{else}} | null{{/if}};
    {{/unless}}
    {{/fields}}
    attributes?: Record<string, any>;
    created_at: Date;
    updated_at?: Date;
}

export interface {{EntityName}}Tree extends {{EntityName}} {
    children: {{EntityName}}Tree[];
    children_count: number;
    has_children: boolean;
}

export interface {{EntityName}}Hierarchy {
    item: {{EntityName}};
    ancestors: {{EntityName}}[];
    descendants: {{EntityName}}[];
}

export interface Create{{EntityName}}Input {
    code: string;
    name: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}?: {{type}};
    {{/unless}}
    {{/fields}}
    attributes?: Record<string, any>;
}

export interface Update{{EntityName}}Input {
    code?: string;
    name?: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}?: {{type}};
    {{/unless}}
    {{/fields}}
    attributes?: Record<string, any>;
}

export interface {{EntityName}}Filter {
    parent_id?: string;
    is_active?: boolean;
    search?: string;
}

export interface {{EntityName}}ListParams {
    parent_id?: string;
    is_active?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
}
