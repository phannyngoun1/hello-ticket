// API Configuration
export const API_CONFIG = {
    // Use ?? so empty string (same-origin for combined deploy) is respected; || would fall back to localhost
    BASE_URL: (import.meta as ImportMeta & { env: { [key: string]: string } }).env.VITE_API_BASE_URL ?? 'http://localhost:8000',
    TIMEOUT: 30000,
    ENDPOINTS: {
        HEALTH: '/health/',
        AUTH: {
            LOGIN: '/api/v1/auth/token',
            REGISTER: '/api/v1/auth/register',
            LOGOUT: '/api/v1/auth/logout',
            REFRESH: '/api/v1/auth/refresh',
            ME: '/api/v1/auth/me',
        },
        USERS: {
            SEARCH: '/api/v1/users/search',
            FETCH: '/api/v1/users',
            CREATE: '/api/v1/users',
            UPDATE: '/api/v1/users',
            DELETE: '/api/v1/users',
            GET: '/api/v1/users',
            LIST: '/api/v1/users',
            DETAIL: '/api/v1/users',
            ACTIVATE: '/api/v1/users',
            DEACTIVATE: '/api/v1/users',
            RESET_PASSWORD: '/api/v1/users',
            FORGOT_PASSWORD: '/api/v1/users',
        },
        PRODUCTS: '/api/v1/products',
        ORDERS: '/api/v1/orders',
        ROLES: '/api/v1/roles',
        GROUPS: '/api/v1/groups',
        SALES: {
            CUSTOMERS: '/api/v1/sales/customers',
            BOOKINGS: '/api/v1/sales/bookings',
        },
        TICKETING: {
            VENUES: '/api/v1/ticketing/venues',
            EVENTS: '/api/v1/ticketing/events',
            ORGANIZERS: '/api/v1/ticketing/organizers',
            SHOWS: '/api/v1/ticketing/shows',
        },
    },
} as const

// App Configuration
export const APP_CONFIG = {
    NAME: 'Hello Ticket',
    DESCRIPTION: 'Modern React Application',
    VERSION: '1.0.0',
    DEFAULT_LOCALE: 'en',
    SUPPORTED_LOCALES: ['en', 'fr', 'es'],
    DEFAULT_THEME: 'light',
} as const

// Query Configuration (for React Query)
export const QUERY_CONFIG = {
    defaultOptions: {
        queries: {
            retry: 3,
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
} as const

// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_PREFERENCES: 'user_preferences',
    THEME: 'theme',
    LOCALE: 'locale',
    SESSION_CONFIG: 'session_config', // Cached session configuration
} as const

// Route Paths
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    USERS: '/users',
    PRODUCTS: '/products',
    ORDERS: '/orders',
} as const

// Feature Flags
export const FEATURES = {
    ENABLE_ANALYTICS: (import.meta as any).env.VITE_ENABLE_ANALYTICS === 'true',
    ENABLE_DEBUG: (import.meta as any).env.DEV,
} as const
