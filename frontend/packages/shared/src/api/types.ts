/**
 * API-related types and interfaces
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
    data: T;
    message?: string;
    success: boolean;
    timestamp: string;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        stack?: string;
    };
    timestamp: string;
    path: string;
}

/**
 * HTTP request options
 */
export interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination metadata
 */
export interface Pagination {
    page: number;
    pageSize: number;
    total?: number;
    totalPages?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: Pagination;
}

/**
 * Filter parameters for API requests
 */
export interface FilterParams {
    search?: string;
    filters?: Record<string, unknown>;
    dateRange?: {
        start: string;
        end: string;
    };
}

/**
 * Bulk operation request
 */
export interface BulkOperationRequest<T> {
    action: 'create' | 'update' | 'delete';
    items: T[];
    options?: Record<string, unknown>;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse<T> {
    success: T[];
    failed: Array<{
        item: T;
        error: string;
    }>;
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
}

/**
 * File upload response
 */
export interface FileUploadResponse {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
}

/**
 * WebSocket message types
 */
export interface WebSocketMessage<T = unknown> {
    type: string;
    payload: T;
    timestamp: string;
    id?: string;
}

/**
 * Real-time notification
 */
export interface NotificationMessage {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    data?: Record<string, unknown>;
    timestamp: string;
    read: boolean;
}

/**
 * API rate limiting info
 */
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}

/**
 * Generic API client interface for dependency injection
 * Used by service classes to abstract HTTP operations
 */
export interface ApiClient {
    get: <T>(endpoint: string, options?: RequestOptions) => Promise<T>;
    post: <T>(endpoint: string, data?: any, options?: RequestOptions) => Promise<T>;
    put: <T>(endpoint: string, data?: any, options?: RequestOptions) => Promise<T>;
    patch: <T>(endpoint: string, data?: any, options?: RequestOptions) => Promise<T>;
    delete: <T>(endpoint: string, options?: RequestOptions) => Promise<T>;
}


/**
 * Generic service configuration type
 * Allows services to define their specific endpoint structure.
 * Endpoint values may be string or undefined for optional endpoints.
 */
export type ServiceConfig<TEndpoints extends Record<string, string | undefined> = Record<string, string | undefined>> = {
    apiClient: ApiClient;
    endpoints: TEndpoints;
};
