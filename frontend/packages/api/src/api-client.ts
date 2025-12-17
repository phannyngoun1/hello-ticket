import { API_CONFIG, STORAGE_KEYS } from '@truths/config'
import { storage } from '@truths/utils'

// Global session handler - will be set by SessionProvider
let globalSessionExpiredHandler: (() => void) | null = null

// Global 403 error handler - will be set by SessionProvider or other UI components
let globalForbiddenErrorHandler: ((message: string) => void) | null = null

// Flag to prevent infinite refresh loops
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = []

// Grace period after login to prevent session dialog from appearing immediately
// This gives the authentication state time to settle after login
const LOGIN_GRACE_PERIOD_MS = 3000 // 3 seconds
let loginGracePeriodUntil: number | null = null

// Flag to suppress session dialog during logout
// When user explicitly logs out, we want to redirect to login page, not show dialog
let isLoggingOut: boolean = false

export function setLoginGracePeriod() {
    // Set grace period for 3 seconds after login
    loginGracePeriodUntil = Date.now() + LOGIN_GRACE_PERIOD_MS
}

export function setLoggingOut(isLoggingOutFlag: boolean) {
    // Set flag to suppress session dialog during logout
    isLoggingOut = isLoggingOutFlag
}

function isWithinLoginGracePeriod(): boolean {
    if (!loginGracePeriodUntil) {
        return false
    }
    const now = Date.now()
    if (now > loginGracePeriodUntil) {
        // Grace period expired, clear it
        loginGracePeriodUntil = null
        return false
    }
    return true
}

export function setGlobalSessionExpiredHandler(handler: (() => void) | null) {
    globalSessionExpiredHandler = handler
}

export function setGlobalForbiddenErrorHandler(handler: ((message: string) => void) | null) {
    globalForbiddenErrorHandler = handler
}

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })

    failedQueue = []
}

export class ApiError extends Error {
    public readonly status: number;
    public readonly statusText: string;

    constructor(
        status: number,
        statusText: string,
        message?: string
    ) {
        super(ApiError.parseErrorMessage(message || statusText))
        this.name = 'ApiError'
        this.status = status
        this.statusText = statusText

        // Ensure properties are enumerable for better debugging
        Object.defineProperty(this, 'status', {
            enumerable: true,
            value: status,
            writable: false
        })
        Object.defineProperty(this, 'statusText', {
            enumerable: true,
            value: statusText,
            writable: false
        })
    }

    /**
     * Parse error messages from various API formats to user-friendly strings
     */
    private static parseErrorMessage(rawMessage: string): string {
        try {
            // Try to parse as JSON
            const errorData = JSON.parse(rawMessage);

            // Handle common error formats
            if (errorData.detail) {
                return errorData.detail;
            }
            if (errorData.message) {
                return errorData.message;
            }
            if (errorData.error?.message) {
                return errorData.error.message;
            }
            if (errorData.error?.detail) {
                return errorData.error.detail;
            }

            // If JSON parsing succeeded but no known field, return stringified
            return rawMessage;
        } catch {
            // Not JSON, return as-is
            return rawMessage;
        }
    }

    // Helper method to check if error is authentication related
    isAuthError(): boolean {
        return this.status === 401 || this.status === 403
    }

    // Helper method to check if error is a permission error (not auth)
    isPermissionError(): boolean {
        if (this.status !== 403) return false

        // Check if error message indicates a permission error (not authentication)
        // Message is already parsed, so just check the string
        return this.message.includes("Permission") && this.message.includes("required");
    }

    // Better toString for logging
    toString(): string {
        return `${this.name} [${this.status} ${this.statusText}]: ${this.message}`
    }
}

export interface RequestOptions extends RequestInit {
    requiresAuth?: boolean
}

// Type for auth service refresh function - this allows external registration
type RefreshTokenFunction = () => Promise<{ access_token: string }>
type LogoutSyncFunction = () => void

let authServiceRefresh: RefreshTokenFunction | null = null
let authServiceLogoutSync: LogoutSyncFunction | null = null

export function registerAuthService(refresh: RefreshTokenFunction, logoutSync: LogoutSyncFunction) {
    authServiceRefresh = refresh
    authServiceLogoutSync = logoutSync
}

export async function apiClient<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options

    const url = `${API_CONFIG.BASE_URL}${endpoint}`

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers as Record<string, string>,
    }

    if (requiresAuth) {
        const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
    }

    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    })

    if (!response.ok) {
        const errorText = await response.text()

        // Suppress console errors for specific endpoints that may not exist
        // (browser will still log fetch errors, but we can prevent our own logging)
        const silentEndpoints = ['/api/v1/sessions/config']
        const isSilent = silentEndpoints.some(ep => endpoint.includes(ep))

        const error = new ApiError(
            response.status,
            response.statusText,
            errorText
        )

        // Add a flag to indicate if this error should be silent
        if (isSilent && (response.status === 404 || response.status === 401)) {
            (error as any)._silent = true
        }

        // Try to refresh token on 401 error (if not already refreshing)
        if (error.status === 401 && requiresAuth && !isRefreshing && authServiceRefresh) {
            // Check if we have a refresh token
            const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN)

            if (refreshToken) {
                if (isRefreshing) {
                    // If already refreshing, queue this request
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    }).then(() => {
                        // Retry the original request with new token
                        return apiClient(endpoint, options)
                    })
                }

                isRefreshing = true

                try {
                    // These will be automatically removed in production builds (see vite.config.ts)
                    // For production logging, consider using logger from @truths/utils
                    const newTokens = await authServiceRefresh()

                    // Process any queued requests
                    processQueue(null, newTokens.access_token)

                    isRefreshing = false

                    // Retry the original request with new token
                    return apiClient(endpoint, options)
                } catch (refreshError) {
                    // Note: Consider using logger.error() for production error tracking
                    processQueue(refreshError as Error, null)
                    isRefreshing = false

                    // Refresh failed, clear tokens immediately (sync) and show login dialog
                    // But only if we're not in the login grace period or logging out
                    if (authServiceLogoutSync) {
                        authServiceLogoutSync()
                    }

                    if (globalSessionExpiredHandler && !isWithinLoginGracePeriod() && !isLoggingOut) {
                        globalSessionExpiredHandler()
                    }

                    throw error
                }
            } else {
                // No refresh token, show login dialog
                // But only if we're not in the login grace period or logging out
                if (globalSessionExpiredHandler && !isWithinLoginGracePeriod() && !isLoggingOut) {
                    globalSessionExpiredHandler()
                }
            }
        }

        // For 401 errors (authentication/session issues), show session expired dialog
        // 403 errors are authorization/permission issues, not session expiration
        // Session expiration returns 401, not 403
        // But skip showing dialog during login grace period or logout to prevent dialog reappearing
        if (error.status === 401 && globalSessionExpiredHandler && !isWithinLoginGracePeriod() && !isLoggingOut) {
            globalSessionExpiredHandler()
        }

        // For 403 errors (authorization/permission issues), show error message
        // Skip permission errors as they are handled differently by the calling code
        // Skip during login grace period or logout
        if (error.status === 403 && !error.isPermissionError() && globalForbiddenErrorHandler && !isWithinLoginGracePeriod() && !isLoggingOut) {
            globalForbiddenErrorHandler(error.message)
        }

        throw error
    }

    // Handle 204 No Content responses (empty body)
    if (response.status === 204) {
        return undefined as T
    }

    return response.json()
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        }),

    patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: <T>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
}

