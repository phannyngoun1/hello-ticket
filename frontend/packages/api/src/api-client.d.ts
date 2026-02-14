export declare function setLoginGracePeriod(): void;
export declare function setLoggingOut(isLoggingOutFlag: boolean): void;
export declare function setGlobalSessionExpiredHandler(handler: (() => void) | null): void;
export declare function setGlobalForbiddenErrorHandler(handler: ((message: string) => void) | null): void;
export declare class ApiError extends Error {
    readonly status: number;
    readonly statusText: string;
    constructor(status: number, statusText: string, message?: string);
    /**
     * Parse error messages from various API formats to user-friendly strings
     */
    private static parseErrorMessage;
    isAuthError(): boolean;
    isPermissionError(): boolean;
    toString(): string;
}
export interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}
type RefreshTokenFunction = () => Promise<{
    access_token: string;
}>;
type LogoutSyncFunction = () => void;
export declare function registerAuthService(refresh: RefreshTokenFunction, logoutSync: LogoutSyncFunction): void;
export declare function apiClient<T>(endpoint: string, options?: RequestOptions): Promise<T>;
export type ApiClient = {
    get: <T>(endpoint: string, options?: RequestOptions) => Promise<T>;
    post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => Promise<T>;
    patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => Promise<T>;
    put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => Promise<T>;
    delete: <T>(endpoint: string, options?: RequestOptions) => Promise<T>;
    postForm: <T>(endpoint: string, formData: FormData, options?: RequestOptions) => Promise<T>;
};
export declare const api: ApiClient;
export {};
//# sourceMappingURL=api-client.d.ts.map