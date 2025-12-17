/**
 * Common types shared across ticketing components
 */

import type { Pagination, PaginatedResponse } from '@truths/shared';

export interface TicketingProps {
    className?: string;
    children?: React.ReactNode;
}

export interface TicketingLayoutProps extends TicketingProps {
    variant?: 'default' | 'compact' | 'expanded';
    fullWidth?: boolean;
}

export interface TicketingWithDataProps<T> extends TicketingProps {
    data: T;
    loading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
}

export interface TicketingWithActionsProps extends TicketingProps {
    actions?: React.ReactNode;
    onAction?: (action: string, data?: any) => void;
}



/**
 * Filter Types
 */
export interface TicketingFilter {
    search?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

// Pagination and PaginatedResponse are imported from @truths/shared

/**
 * Ticketing Configuration
 */
export interface TicketingConfig {
    theme?: 'light' | 'dark' | 'auto';
    locale?: string;
    apiEndpoint?: string;
    features?: {
        [key: string]: boolean;
    };
}
