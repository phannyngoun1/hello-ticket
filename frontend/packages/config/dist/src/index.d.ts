export declare const API_CONFIG: {
    readonly BASE_URL: string;
    readonly TIMEOUT: 30000;
    readonly ENDPOINTS: {
        readonly HEALTH: "/health/";
        readonly AUTH: {
            readonly LOGIN: "/api/v1/auth/token";
            readonly REGISTER: "/api/v1/auth/register";
            readonly LOGOUT: "/api/v1/auth/logout";
            readonly REFRESH: "/api/v1/auth/refresh";
            readonly ME: "/api/v1/auth/me";
        };
        readonly USERS: {
            readonly SEARCH: "/api/v1/users/search";
            readonly FETCH: "/api/v1/users";
            readonly CREATE: "/api/v1/users";
            readonly UPDATE: "/api/v1/users";
            readonly DELETE: "/api/v1/users";
            readonly GET: "/api/v1/users";
            readonly LIST: "/api/v1/users";
            readonly DETAIL: "/api/v1/users";
            readonly ACTIVATE: "/api/v1/users";
            readonly DEACTIVATE: "/api/v1/users";
            readonly RESET_PASSWORD: "/api/v1/users";
            readonly FORGOT_PASSWORD: "/api/v1/users";
        };
        readonly PRODUCTS: "/api/v1/products";
        readonly ORDERS: "/api/v1/orders";
        readonly ROLES: "/api/v1/roles";
        readonly GROUPS: "/api/v1/groups";
        readonly SALES: {
            readonly CUSTOMERS: "/api/v1/sales/customers";
            readonly BOOKINGS: "/api/v1/sales/bookings";
        };
        readonly TICKETING: {
            readonly VENUES: "/api/v1/ticketing/venues";
            readonly EVENTS: "/api/v1/ticketing/events";
            readonly ORGANIZERS: "/api/v1/ticketing/organizers";
            readonly SHOWS: "/api/v1/ticketing/shows";
        };
    };
};
export declare const APP_CONFIG: {
    readonly NAME: "Hello Ticket";
    readonly DESCRIPTION: "Modern React Application";
    readonly VERSION: "1.0.0";
    readonly DEFAULT_LOCALE: "en";
    readonly SUPPORTED_LOCALES: readonly ["en", "fr", "es"];
    readonly DEFAULT_THEME: "light";
};
export declare const QUERY_CONFIG: {
    readonly defaultOptions: {
        readonly queries: {
            readonly retry: 3;
            readonly staleTime: number;
            readonly gcTime: number;
            readonly refetchOnWindowFocus: false;
            readonly refetchOnReconnect: true;
        };
    };
};
export declare const STORAGE_KEYS: {
    readonly AUTH_TOKEN: "auth_token";
    readonly REFRESH_TOKEN: "refresh_token";
    readonly USER_PREFERENCES: "user_preferences";
    readonly THEME: "theme";
    readonly LOCALE: "locale";
    readonly SESSION_CONFIG: "session_config";
};
export declare const ROUTES: {
    readonly HOME: "/";
    readonly LOGIN: "/login";
    readonly REGISTER: "/register";
    readonly DASHBOARD: "/dashboard";
    readonly PROFILE: "/profile";
    readonly SETTINGS: "/settings";
    readonly USERS: "/users";
    readonly PRODUCTS: "/products";
    readonly ORDERS: "/orders";
};
export declare const FEATURES: {
    readonly ENABLE_ANALYTICS: boolean;
    readonly ENABLE_DEBUG: any;
};
//# sourceMappingURL=index.d.ts.map