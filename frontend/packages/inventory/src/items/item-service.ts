/**
 * Item Service
 * 
 * Encapsulates all item-related API operations
 * Handles data transformation between backend and frontend types
 *
 * @author Phanny
 */

import { Item, CreateItemInput, UpdateItemInput, ItemUoMMapping } from '../types';
import { ServiceConfig, PaginatedResponse } from '@truths/shared';

// Item DTO - Data Transfer Object matching API response format
interface ItemDTO {
    id: string;
    tenant_id?: string;
    code?: string;
    sku?: string | null;
    name: string;
    description?: string | null;

    // Classification
    item_type?: string;
    item_usage?: string;
    category_id?: string;
    item_group?: string;

    // Tracking
    tracking_scope?: string;
    tracking_requirements?: string[];

    // UoM
    default_uom?: string;
    uom_mappings?: Array<{
        id?: string;
        context: string;
        uom_code: string;
        conversion_factor: number;
        is_primary?: boolean;
    }>;

    // Attributes
    perishable?: boolean;
    active?: boolean;
    attributes?: Record<string, any>;

    // Timestamps
    created_at?: string;
    updated_at?: string;
}

// Transform item DTO to frontend Item type
function transformItem(dto: ItemDTO): Item {
    return {
        id: dto.id,
        code: dto.code || '',
        tenant_id: dto.tenant_id,
        sku: dto.sku,
        name: dto.name || '',
        description: dto.description,

        // Classification
        item_type: dto.item_type || 'product',
        item_usage: dto.item_usage || 'for_sale',
        category_id: dto.category_id,
        item_group: dto.item_group,

        // Tracking
        tracking_scope: dto.tracking_scope || 'both',
        tracking_requirements: dto.tracking_requirements || [],

        // UoM
        default_uom: dto.default_uom || 'EA',
        uom_mappings: dto.uom_mappings?.map((m) => ({
            id: m.id,
            context: m.context,
            uom_code: m.uom_code,
            conversion_factor: m.conversion_factor,
            is_primary: m.is_primary,
        })) || [],

        // Attributes
        perishable: dto.perishable || false,
        active: dto.active !== undefined ? dto.active : true,
        attributes: dto.attributes || {},

        // Timestamps (both formats for backward compatibility)
        created_at: dto.created_at,
        updated_at: dto.updated_at,
        createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
        updatedAt: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

// Transform frontend item to backend request
function transformToBackend(entity: CreateItemInput | UpdateItemInput): any {
    const result: any = {};

    // Basic fields
    if ('code' in entity && entity.code !== undefined) result.code = entity.code;
    // Allow null for sku and description (explicitly set null, not undefined)
    if ('sku' in entity && (entity.sku !== undefined || entity.sku === null)) result.sku = entity.sku;
    if ('name' in entity && entity.name !== undefined) result.name = entity.name;
    if ('description' in entity && (entity.description !== undefined || entity.description === null)) result.description = entity.description;

    // Classification
    if ('item_type' in entity && entity.item_type !== undefined) result.item_type = entity.item_type;
    if ('item_usage' in entity && entity.item_usage !== undefined) result.item_usage = entity.item_usage;
    if ('category_id' in entity && entity.category_id !== undefined) result.category_id = entity.category_id;
    if ('item_group' in entity && entity.item_group !== undefined) result.item_group = entity.item_group;

    // Tracking
    if ('tracking_scope' in entity && entity.tracking_scope !== undefined) result.tracking_scope = entity.tracking_scope;
    if ('tracking_requirements' in entity && entity.tracking_requirements !== undefined) {
        result.tracking_requirements = entity.tracking_requirements;
    }

    // UoM
    if ('default_uom' in entity && entity.default_uom !== undefined) result.default_uom = entity.default_uom;
    if ('uom_mappings' in entity && entity.uom_mappings !== undefined) {
        result.uom_mappings = entity.uom_mappings;
    }

    // Attributes
    if ('perishable' in entity && entity.perishable !== undefined) result.perishable = entity.perishable;
    if ('active' in entity && entity.active !== undefined) result.active = entity.active;
    if ('attributes' in entity && entity.attributes !== undefined) result.attributes = entity.attributes;

    return result;
}

// Item service specific endpoints
interface ItemEndpoints extends Record<string, string> {
    items: string;
}

export type ItemServiceConfig = ServiceConfig<ItemEndpoints>;

export class ItemService {
    private config: ItemServiceConfig;

    constructor(config: ItemServiceConfig) {
        this.config = config;
    }

    /**
     * Fetch paginated list of items
     */
    async fetchItems(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        item_type?: string;
        item_usage?: string;
        category_id?: string;
        tracking_scope?: string;
        active?: boolean;
        [key: string]: any;
    }): Promise<PaginatedResponse<Item>> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.items || '/api/v1/inventory/items';

        const queryParams = new URLSearchParams();
        if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.item_type) queryParams.append('item_type', params.item_type);
        if (params?.item_usage) queryParams.append('item_usage', params.item_usage);
        if (params?.category_id) queryParams.append('category_id', params.category_id);
        if (params?.tracking_scope) queryParams.append('tracking_scope', params.tracking_scope);
        if (params?.active !== undefined) queryParams.append('active', params.active.toString());

        const url = `${endpoint}?${queryParams.toString()}`;

        const data = await apiClient.get<any>(url, { requiresAuth: true });
        return {
            data: (data.items || data.data || []).map(transformItem),
            pagination: {
                page: data.page || Math.floor((params?.skip || 0) / (params?.limit || 50)) + 1,
                pageSize: data.page_size || data.pageSize || params?.limit || 50,
                total: data.total || 0,
                totalPages: data.total_pages || data.totalPages || 0,
            },
        };
    }

    /**
     * Fetch a single item by ID
     */
    async fetchItem(id: string): Promise<Item> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.items || '/api/v1/inventory/items';
        const data = await apiClient.get<any>(`${endpoint}/${id}`, { requiresAuth: true });
        return transformItem(data);
    }

    /**
     * Create a new item
     */
    async createItem(input: CreateItemInput): Promise<Item> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.items || '/api/v1/inventory/items';
        const payload = transformToBackend(input);
        const data = await apiClient.post<any>(endpoint, payload, { requiresAuth: true });
        return transformItem(data);
    }

    /**
     * Update an existing item
     */
    async updateItem(id: string, input: UpdateItemInput): Promise<Item> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.items || '/api/v1/inventory/items';
        const payload = transformToBackend(input);
        const data = await apiClient.put<any>(`${endpoint}/${id}`, payload, { requiresAuth: true });
        return transformItem(data);
    }

    /**
     * Delete an item
     */
    async deleteItem(id: string): Promise<void> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.items || '/api/v1/inventory/items';
        await apiClient.delete(`${endpoint}/${id}`, { requiresAuth: true });
    }

    /**
     * Fetch inventory balances for an item
     */
    async fetchItemBalances(itemId: string, locationId?: string, status?: string): Promise<Array<{
        id: string;
        tenant_id: string;
        item_id: string;
        location_id: string;
        tracking_id?: string | null;
        status: string;
        quantity: number;
        created_at: string;
        updated_at: string;
    }>> {
        const { apiClient } = this.config;
        const endpoint = `/api/v1/inventory/queries/balances/${itemId}`;

        const queryParams = new URLSearchParams();
        if (locationId) queryParams.append('location_id', locationId);
        if (status) queryParams.append('status', status);

        const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;
        const data = await apiClient.get<any[]>(url, { requiresAuth: true });
        return data || [];
    }
}
