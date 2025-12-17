/**
 * TestTree Service
 * 
 * Encapsulates all test-tree-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import {
    TestTree,
    TestTreeTree,
    TestTreeHierarchy,
    CreateTestTreeInput,
    UpdateTestTreeInput,
    TestTreeListParams,
} from './types';
import { ServiceConfig, PaginatedResponse } from '@truths/shared';

// DTO definition matching API response
interface TestTreeDTO {
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    description?: string;
    parent_test_tree_id: string | null;  // Backend uses parent_test_tree_id
    level: number;
    sort_order: number;
    is_active: boolean;
    
    attributes?: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

// Transform DTO to frontend type
function transformTestTree(dto: TestTreeDTO): TestTree {
    return {
        ...dto,
        parent_id: dto.parent_test_tree_id,  // Map parent_test_tree_id to parent_id for frontend
        created_at: new Date(dto.created_at),
        updated_at: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

export interface TestTreeEndpoints extends Record<string, string> {
    testTrees:string;
}

export type TestTreeServiceConfig = ServiceConfig<TestTreeEndpoints>;

export class TestTreeService {
    private config: TestTreeServiceConfig;

    constructor(config: TestTreeServiceConfig) {
        this.config = config;
    }

    /**
     * Fetch paginated list of testTrees
     */
    async fetchTestTrees(params?: TestTreeListParams): Promise<PaginatedResponse<TestTree>> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.testTrees || '/api/v1/sales/test-trees';

        const queryParams = new URLSearchParams();
        if (params?.parent_id) queryParams.append('parent_id', params.parent_id);
        if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        if (params?.search !== undefined && params.search.trim()) {
            queryParams.append('search', params.search.trim());
        }
        if (params?.is_active !== undefined) {
            queryParams.append('is_active', params.is_active.toString());
        }

        const baseEndpoint = endpoint.replace(/\/$/, '');
        const url = queryParams.toString()
            ? `${baseEndpoint}?${queryParams.toString()}`
            : baseEndpoint;

        const data = await apiClient.get<{
            items: TestTreeDTO[];
            total: number;
            skip: number;
            limit: number;
            has_next: boolean;
        }>(url, { requiresAuth: true });

        const skip = data.skip || params?.skip || 0;
        const limit = data.limit || params?.limit || 50;
        const total = data.total || 0;

        return {
            data: (data.items || []).map(transformTestTree),
            pagination: {
                page: Math.floor(skip / limit) + 1,
                pageSize: limit,
                total: total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Fetch test-tree tree (all root testTrees with full hierarchy)
     */
    async fetchTestTreeTree(search?: string): Promise<TestTreeTree[]> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.testTrees || '/api/v1/sales/test-trees';

        const queryParams = new URLSearchParams();
        if (search?.trim()) {
            queryParams.append('search', search.trim());
        }

        const baseUrl = `${endpoint}/tree/root`;
        const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
        const data = await apiClient.get<any>(url, { requiresAuth: true });

        // Ensure we return an array
        if (!data) {
            return [];
        }
        if (!Array.isArray(data)) {
            return [];
        }

        // Transform the tree structure
        const transformTree = (dto: any): TestTreeTree => {
            const item = transformTestTree(dto);
            const children = (dto.children || []).map(transformTree);
            return {
                ...item,
                children,
                children_count: dto.children_count || children.length,
                has_children: children.length > 0 || dto.has_children || false,
            };
        };

        return data.map(transformTree);
    }

    /**
     * Fetch a single test-tree by ID
     */
    async fetchTestTree(id: string): Promise<TestTree> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.testTrees || '/api/v1/sales/test-trees';
        const data = await apiClient.get<TestTreeDTO>(`${endpoint}/${id}`, { requiresAuth: true });
        return transformTestTree(data);
    }

    /**
     * Fetch test-tree hierarchy (with ancestors and descendants)
     */
    async fetchTestTreeHierarchy(id: string): Promise<TestTreeHierarchy> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.testTrees || '/api/v1/sales/test-trees';
        const data = await apiClient.get<any>(`${endpoint}/${id}/hierarchy`, { requiresAuth: true });

        return {
            item: transformTestTree(data.item || data.category || data.group), // Fallback for different naming conventions
            ancestors: (data.ancestors || []).map(transformTestTree),
            descendants: (data.descendants || []).map(transformTestTree),
        };
    }

    /**
     * Fetch direct children of a test-tree
     */
    async fetchTestTreeChildren(id: string): Promise<TestTree[]> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.testTrees || '/api/v1/sales/test-trees';
        const data = await apiClient.get<TestTreeDTO[]>(`${endpoint}/${id}/children`, { requiresAuth: true });
        return (data || []).map(transformTestTree);
    }

    /**
     * Create a new test-tree
     */
    async createTestTree(input: CreateTestTreeInput): Promise<TestTree> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.testTrees || '/api/v1/sales/test-trees';
        // Transform parent_id to parent_test_tree_id for backend API
        const { parent_id, ...rest } = input;
        const requestBody: any = {
            ...rest,
        };
        // Only include parent_test_tree_id if parent_id is provided
        if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
            requestBody.parent_test_tree_id = parent_id;
        }
        const data = await apiClient.post<TestTreeDTO>(endpoint, requestBody, { requiresAuth: true });
        return transformTestTree(data);
    }

    /**
     * Update an existing test-tree
     */
    async updateTestTree(id: string, input: UpdateTestTreeInput): Promise<TestTree> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.testTrees || '/api/v1/sales/test-trees';
        // Transform parent_id to parent_test_tree_id for backend API
        const { parent_id, ...rest } = input;
        const requestBody: any = {
            ...rest,
        };
        // Only include parent_test_tree_id if parent_id is provided
        if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
            requestBody.parent_test_tree_id = parent_id;
        } else if (parent_id === null || parent_id === '') {
            // Explicitly set to null if empty string or null is provided (to clear parent)
            requestBody.parent_test_tree_id = null;
        }
        const data = await apiClient.put<TestTreeDTO>(`${endpoint}/${id}`, requestBody, { requiresAuth: true });
        return transformTestTree(data);
    }

    /**
     * Delete a test-tree
     */
    async deleteTestTree(id: string): Promise<void> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.testTrees || '/api/v1/sales/test-trees';
        await apiClient.delete(`${endpoint}/${id}`, { requiresAuth: true });
    }
}
