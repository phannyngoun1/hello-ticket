/**
 * Common types shared across purchasing components
 */

import type { Pagination, PaginatedResponse } from '@truths/shared';

export interface PurchasingProps {
    className?: string;
    children?: React.ReactNode;
}

export interface PurchasingLayoutProps extends PurchasingProps {
    variant?: 'default' | 'compact' | 'expanded';
    fullWidth?: boolean;
}

export interface PurchasingWithDataProps<T> extends PurchasingProps {
    data: T;
    loading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
}

export interface PurchasingWithActionsProps extends PurchasingProps {
    actions?: React.ReactNode;
    onAction?: (action: string, data?: any) => void;
}



/**
 * Filter Types
 */
export interface PurchasingFilter {
    search?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

// Pagination and PaginatedResponse are imported from @truths/shared

/**
 * Purchasing Configuration
 */
export interface PurchasingConfig {
    theme?: 'light' | 'dark' | 'auto';
    locale?: string;
    apiEndpoint?: string;
    features?: {
        [key: string]: boolean;
    };
}
