/**
 * Common types shared across sales components
 */


export interface SalesProps {
    className?: string;
    children?: React.ReactNode;
}

export interface SalesLayoutProps extends SalesProps {
    variant?: 'default' | 'compact' | 'expanded';
    fullWidth?: boolean;
}

export interface SalesWithDataProps<T> extends SalesProps {
    data: T;
    loading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
}

export interface SalesWithActionsProps extends SalesProps {
    actions?: React.ReactNode;
    onAction?: (action: string, data?: any) => void;
}



/**
 * Filter Types
 */
export interface SalesFilter {
    search?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

// Pagination and PaginatedResponse are imported from @truths/shared

/**
 * Sales Configuration
 */
export interface SalesConfig {
    theme?: 'light' | 'dark' | 'auto';
    locale?: string;
    apiEndpoint?: string;
    features?: {
        [key: string]: boolean;
    };
}


/**
 * Customer
 */
export interface Customer {
    id: string;
    code: string;
    name: string;
    status: 'active' | 'inactive';
    business_name: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface CreateCustomerInput {
    code: string;
    name: string;
    status: string;
    business_name: string;
}

export interface UpdateCustomerInput {
    code?: string | null;
    name?: string | null;
    status?: string | null;
    business_name?: string | null;
}

export interface CustomerFilter {
    search?: string;
    status?: Customer['status'];
    code?: string;
    name?: string;
    business_name?: string;
}
