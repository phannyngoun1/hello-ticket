/**
 * Category Service
 * 
 * Encapsulates all category-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import { ItemCategory, ItemCategoryTree, ItemCategoryHierarchy, CreateItemCategoryInput, UpdateItemCategoryInput } from '../types';
import { ServiceConfig } from '@truths/shared';

// Category DTO - Data Transfer Object matching API response format
interface CategoryDTO {
    id: string;
    tenant_id: string;
    code: string;
    name: string;
    description?: string;
    parent_category_id?: string;
    level: number;
    sort_order: number;
    is_active: boolean;
    attributes?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// Transform category DTO to frontend ItemCategory type
function transformCategory(categoryDTO: CategoryDTO): ItemCategory {
    return {
        id: categoryDTO.id,
        tenant_id: categoryDTO.tenant_id,
        code: categoryDTO.code,
        name: categoryDTO.name,
        description: categoryDTO.description,
        parent_category_id: categoryDTO.parent_category_id,
        level: categoryDTO.level,
        sort_order: categoryDTO.sort_order,
        is_active: categoryDTO.is_active,
        attributes: categoryDTO.attributes || {},
        created_at: categoryDTO.created_at,
        updated_at: categoryDTO.updated_at,
    };
}

// Category service specific endpoints
interface CategoryEndpoints extends Record<string, string> {
    categories: string;
}

export type CategoryServiceConfig = ServiceConfig<CategoryEndpoints>;

export class CategoryService {
    private apiClient: CategoryServiceConfig['apiClient'];
    private endpoints: CategoryServiceConfig['endpoints'];

    constructor(config: CategoryServiceConfig) {
        this.apiClient = config.apiClient;
        this.endpoints = config.endpoints;
    }

    /**
     * Fetch all categories for the current tenant
     */
    async fetchCategories(params?: {
        parent_category_id?: string;
        is_active?: boolean;
        skip?: number;
        limit?: number;
    }): Promise<ItemCategory[]> {
        try {
            const queryParams = new URLSearchParams();
            if (params?.parent_category_id !== undefined) {
                queryParams.append('parent_category_id', params.parent_category_id);
            }
            if (params?.is_active !== undefined) {
                queryParams.append('is_active', params.is_active.toString());
            }
            if (params?.skip !== undefined) {
                queryParams.append('skip', params.skip.toString());
            }
            if (params?.limit !== undefined) {
                queryParams.append('limit', params.limit.toString());
            }
            
            const response = await this.apiClient.get<{
                categories: CategoryDTO[];
                total: number;
            }>(
                `${this.endpoints.categories}?${queryParams.toString()}`,
                { requiresAuth: true }
            );
            
            return (response.categories || []).map(transformCategory);
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    /**
     * Fetch a single category by ID
     */
    async fetchCategory(categoryId: string): Promise<ItemCategory> {
        try {
            const baseEndpoint = this.endpoints.categories.replace(/\/$/, '');
            const response = await this.apiClient.get<CategoryDTO>(
                `${baseEndpoint}/${categoryId}`,
                { requiresAuth: true }
            );
            return transformCategory(response);
        } catch (error) {
            console.error(`Error fetching category ${categoryId}:`, error);
            throw error;
        }
    }

    /**
     * Create a new category
     */
    async createCategory(data: CreateItemCategoryInput): Promise<ItemCategory> {
        try {
            const response = await this.apiClient.post<CategoryDTO>(
                this.endpoints.categories,
                data,
                { requiresAuth: true }
            );
            return transformCategory(response);
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }

    /**
     * Update a category
     */
    async updateCategory(categoryId: string, data: UpdateItemCategoryInput): Promise<ItemCategory> {
        try {
            const baseEndpoint = this.endpoints.categories.replace(/\/$/, '');
            const response = await this.apiClient.patch<CategoryDTO>(
                `${baseEndpoint}/${categoryId}`,
                data,
                { requiresAuth: true }
            );
            return transformCategory(response);
        } catch (error) {
            console.error(`Error updating category ${categoryId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a category
     */
    async deleteCategory(categoryId: string): Promise<void> {
        try {
            const baseEndpoint = this.endpoints.categories.replace(/\/$/, '');
            await this.apiClient.delete(
                `${baseEndpoint}/${categoryId}`,
                { requiresAuth: true }
            );
        } catch (error) {
            console.error(`Error deleting category ${categoryId}:`, error);
            throw error;
        }
    }

    /**
     * Get category tree (all root categories with full hierarchy)
     */
    async getCategoryTree(): Promise<ItemCategoryTree[]> {
        try {
            const response = await this.apiClient.get<any>(
                `${this.endpoints.categories}/tree/root`,
                { requiresAuth: true }
            );
            
            // Ensure we return an array
            if (!response) {
                return [];
            }
            if (!Array.isArray(response)) {
                return [];
            }

            // Transform the tree structure
            const transformTree = (categoryDTO: any): ItemCategoryTree => {
                const category = transformCategory(categoryDTO);
                const children = (categoryDTO.children || []).map(transformTree);
                return {
                    ...category,
                    children,
                    children_count: categoryDTO.children_count || children.length,
                    has_children: children.length > 0 || categoryDTO.has_children || false,
                };
            };

            return response.map(transformTree);
        } catch (error) {
            console.error('Error fetching category tree:', error);
            throw error;
        }
    }

    /**
     * Fetch category hierarchy (with ancestors and descendants)
     */
    async getCategoryHierarchy(categoryId: string): Promise<ItemCategoryHierarchy> {
        try {
            const baseEndpoint = this.endpoints.categories.replace(/\/$/, '');
            const response = await this.apiClient.get<any>(
                `${baseEndpoint}/${categoryId}/hierarchy`,
                { requiresAuth: true }
            );
            return {
                category: transformCategory(response.category),
                ancestors: (response.ancestors || []).map(transformCategory),
                descendants: (response.descendants || []).map(transformCategory),
            };
        } catch (error) {
            console.error(`Error fetching category hierarchy ${categoryId}:`, error);
            throw error;
        }
    }

    /**
     * Fetch direct children of a category
     */
    async getCategoryChildren(categoryId: string): Promise<ItemCategory[]> {
        try {
            const baseEndpoint = this.endpoints.categories.replace(/\/$/, '');
            const response = await this.apiClient.get<CategoryDTO[]>(
                `${baseEndpoint}/${categoryId}/children`,
                { requiresAuth: true }
            );
            return (response || []).map(transformCategory);
        } catch (error) {
            console.error(`Error fetching category children ${categoryId}:`, error);
            throw error;
        }
    }
}

// Default export
export default CategoryService;

