/**
 * CustomerGroup Types
 * 
 * Types for customer-group management with hierarchy support
 */

export interface CustomerGroup {
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    description?: string;
    parent_id: string | null;
    level: number;
    sort_order: number;
    is_active: boolean;
    
    attributes?: Record<string, any>;
    created_at: Date;
    updated_at?: Date;
}

export interface CustomerGroupTree extends CustomerGroup {
    children: CustomerGroupTree[];
    children_count: number;
    has_children: boolean;
}

export interface CustomerGroupHierarchy {
    item: CustomerGroup;
    ancestors: CustomerGroup[];
    descendants: CustomerGroup[];
}

export interface CreateCustomerGroupInput {
    code: string;
    name: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
    
    attributes?: Record<string, any>;
}

export interface UpdateCustomerGroupInput {
    code?: string;
    name?: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
    
    attributes?: Record<string, any>;
}

export interface CustomerGroupFilter {
    parent_id?: string;
    is_active?: boolean;
    search?: string;
}

export interface CustomerGroupListParams {
    parent_id?: string;
    is_active?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
}
