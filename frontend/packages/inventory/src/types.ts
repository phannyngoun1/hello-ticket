/**
 * Common types shared across inventory components
 */
export interface InventoryProps {
    className?: string;
    children?: React.ReactNode;
}

export interface InventoryLayoutProps extends InventoryProps {
    variant?: 'default' | 'compact' | 'expanded';
    fullWidth?: boolean;
}

export interface InventoryWithDataProps<T> extends InventoryProps {
    data: T;
    loading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
}

export interface InventoryWithActionsProps extends InventoryProps {
    actions?: React.ReactNode;
    onAction?: (action: string, data?: any) => void;
}

/**
 * Filter Types
 */
export interface InventoryFilter {
    search?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

// Pagination and PaginatedResponse are imported from @truths/shared

/**
 * Item Types - Updated to match backend model
 */
export interface Item {
    id: string;
    tenant_id?: string;
    code: string;  // ERP primary item code
    sku?: string | null;  // Optional SKU (replaces code)
    name: string;
    description?: string | null;

    // Classification
    item_type: string;  // service, product, raw_material, wip, etc.
    item_usage: string;  // for_sale, internal_use, both
    category_id?: string;  // Hierarchical category reference
    item_group?: string;  // Legacy field (deprecated)

    // Tracking
    tracking_scope: string;  // none, inventory_only
    tracking_requirements: string[];  // serial, expiration, etc.

    // UoM
    default_uom: string;
    uom_mappings?: ItemUoMMapping[];  // Context-specific UoM mappings

    // Attributes
    perishable: boolean;
    active: boolean;
    attributes?: Record<string, any>;

    // Timestamps
    created_at?: string;
    updated_at?: string;
    createdAt?: Date;  // Transformed from created_at
    updatedAt?: Date;  // Transformed from updated_at
}

export interface CreateItemInput {
    code?: string;
    sku?: string | null;
    name: string;
    description?: string | null;
    item_type?: string;
    item_usage?: string;
    category_id?: string;
    item_group?: string;  // Legacy (deprecated)
    tracking_scope?: string;
    tracking_requirements?: string[];
    default_uom: string;
    uom_mappings?: CreateItemUoMMappingInput[];  // Context-specific UoM mappings
    perishable?: boolean;
    attributes?: Record<string, any>;
}

export interface UpdateItemInput {
    code?: string;
    sku?: string | null;
    name?: string;
    description?: string | null;
    item_type?: string;
    item_usage?: string;
    category_id?: string;
    item_group?: string;  // Legacy (deprecated)
    tracking_scope?: string;
    tracking_requirements?: string[];
    default_uom?: string;
    uom_mappings?: CreateItemUoMMappingInput[];  // Context-specific UoM mappings
    perishable?: boolean;
    active?: boolean;
    attributes?: Record<string, any>;
}

export interface ItemFilter {
    search?: string;
    item_type?: string;
    item_usage?: string;
    category_id?: string;
    tracking_scope?: string;
    active?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
}

/**
 * Item Category Types
 */
export interface ItemCategory {
    id: string;
    tenant_id?: string;
    code: string;
    name: string;
    description?: string;
    parent_category_id?: string;
    level: number;
    sort_order: number;
    is_active: boolean;
    attributes?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export interface CreateItemCategoryInput {
    code: string;
    name: string;
    description?: string;
    parent_category_id?: string;
    sort_order?: number;
    is_active?: boolean;
    attributes?: Record<string, any>;
}

export interface UpdateItemCategoryInput {
    code?: string;
    name?: string;
    description?: string;
    parent_category_id?: string;
    sort_order?: number;
    is_active?: boolean;
    attributes?: Record<string, any>;
}

/**
 * Item Category Tree - for hierarchical display
 */
export interface ItemCategoryTree extends ItemCategory {
    children: ItemCategoryTree[];
    children_count: number;
    has_children: boolean;
}

export interface ItemCategoryHierarchy {
    category: ItemCategory;
    ancestors: ItemCategory[];
    descendants: ItemCategory[];
}

export interface ItemCategoryFilter {
    parent_category_id?: string;
    is_active?: boolean;
    search?: string;
}

/**
 * Enums matching backend
 */
export const ItemType = {
    SERVICE: 'service',
    PRODUCT: 'product',
    RAW_MATERIAL: 'raw_material',
    WIP: 'wip',
    MANUFACTURING_STAGING: 'manufacturing_staging',
    COMPONENT: 'component',
    PACKAGING: 'packaging',
    TOOL: 'tool',
} as const;

export const ItemUsage = {
    FOR_SALE: 'for_sale',
    INTERNAL_USE: 'internal_use',
    MANUFACTURED: 'manufactured',
    SAMPLE: 'sample',
} as const;

export const TrackingScope = {
    NONE: 'none',
    INVENTORY_ONLY: 'inventory_only',
} as const;

export type TrackingScope = (typeof TrackingScope)[keyof typeof TrackingScope];

export const TrackingType = {
    SERIAL: 'serial',
    EXPIRATION: 'expiration',
    MANUFACTURING_DATE: 'manufacturing_date',
    SUPPLIER_BATCH: 'supplier_batch',
    COMBINED: 'combined',
} as const;

/**
 * Unit of Measure Types
 */
export interface UnitOfMeasure {
    id: string;
    code: string;
    name: string;
    base_uom: string;
    conversion_factor: number;
    created_at: string;
    updated_at: string;
}

export interface CreateUnitOfMeasureInput {
    code: string;
    name: string;
    base_uom: string;
    conversion_factor: number;
}

export interface UpdateUnitOfMeasureInput {
    code?: string;
    name?: string;
    base_uom?: string;
    conversion_factor?: number;
}

/**
 * UoM Context Types
 */
export const UoMContext = {
    DEFAULT: 'default',
    PURCHASE: 'purchase',
    SALE: 'sale',
    PRODUCTION: 'production',
    TRANSFER: 'transfer',
    TRANSPORT: 'transport',
    STORAGE: 'storage',
} as const;

export type UoMContext = (typeof UoMContext)[keyof typeof UoMContext];

/**
 * Item UoM Mapping Types
 */
export interface ItemUoMMapping {
    id?: string;
    context: UoMContext;
    uom_code: string;
    conversion_factor: number;
    is_primary?: boolean;
}

export interface CreateItemUoMMappingInput {
    context: UoMContext;
    uom_code: string;
    conversion_factor: number;
    is_primary?: boolean;
}

export interface UpdateItemUoMMappingInput {
    context?: UoMContext;
    uom_code?: string;
    conversion_factor?: number;
    is_primary?: boolean;
}

/**
 * Inventory Configuration
 */
export interface InventoryConfig {
    theme?: 'light' | 'dark' | 'auto';
    locale?: string;
    apiEndpoint?: string;
    features?: {
        [key: string]: boolean;
    };
}
