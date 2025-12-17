export {
    api,
    apiClient,
    ApiError,
    setGlobalSessionExpiredHandler,
    setGlobalForbiddenErrorHandler,
    registerAuthService,
    setLoginGracePeriod,
    setLoggingOut,
    type RequestOptions,
} from './api-client'

// User Preferences API
export * from './user-preferences'

