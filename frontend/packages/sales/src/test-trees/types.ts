/**
 * TestTree Types
 * 
 * Types for test-tree management with hierarchy support
 */

export interface TestTree {
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

export interface TestTreeTree extends TestTree {
    children: TestTreeTree[];
    children_count: number;
    has_children: boolean;
}

export interface TestTreeHierarchy {
    item: TestTree;
    ancestors: TestTree[];
    descendants: TestTree[];
}

export interface CreateTestTreeInput {
    code: string;
    name: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
    
    attributes?: Record<string, any>;
}

export interface UpdateTestTreeInput {
    code?: string;
    name?: string;
    description?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
    
    attributes?: Record<string, any>;
}

export interface TestTreeFilter {
    parent_id?: string;
    is_active?: boolean;
    search?: string;
}

export interface TestTreeListParams {
    parent_id?: string;
    is_active?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
}
