/**
 * @truths/shared - Shared interfaces, types, and utilities
 * 
 * This package provides common TypeScript interfaces and types that are used
 * across the entire Truths platform, ensuring consistency and type safety.
 */

// API Types
export * from './api/types';

// Authentication Types
export * from './auth/types';

// Common Pattern Types
export * from './common/types';

// Domain Types
export * from './domain/types';

// Utility Types
export * from './utils/types';

// Services
export * from './services';
export * from './tags/tag-service';

// Filter Strategy Utilities
export * from './filter-strategy';

// Re-export commonly used types for convenience
export type {
    // API
    ApiResponse,
    ApiErrorResponse,
    RequestOptions,
    PaginationParams,
    Pagination,
    PaginatedResponse,
    FilterParams,
    BulkOperationRequest,
    BulkOperationResponse,
    FileUploadResponse,
    WebSocketMessage,
    NotificationMessage,
    RateLimitInfo,
    ServiceConfig,
} from './api/types';

export type {
    // Auth
    User,
    Session,
    SessionConfig,
    Permission,
    Role,
    AuthState,
    LoginCredentials,
    RegisterData,
    PasswordChangeRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    TokenRefreshRequest,
    TokenRefreshResponse,
    MfaSetup,
    MfaVerification,
    SocialProvider,
    SocialLoginRequest,
    UserProfile,
    ProfileUpdateRequest,
    UserActivity,
    Tenant,
    PermissionCheck,
} from './auth/types';

export type {
    // Common
    FormField,
    FieldValidation,
    ValidationError,
    FormState,
    SelectOption,
    TableColumn,
    TableConfig,
    PaginationConfig,
    SortingConfig,
    FilteringConfig,
    FilterOption,
    SelectionConfig,
    ModalConfig,
    ToastNotification,
    LoadingState,
    AsyncState,
    SearchConfig,
    ExportConfig,
    ImportConfig,
    ThemeConfig,
    LayoutConfig,
    NavigationItem,
    BreadcrumbItem,
    TabConfig,
    StepConfig,
} from './common/types';

export type {
    // Domain
    AuditLog,
    Notification,
    NotificationAction,
    Settings,
    FeatureFlag,
    FeatureFlagCondition,
    HealthCheck,
    SystemMetrics,
    WorkflowDefinition,
    WorkflowStep,
    WorkflowTrigger,
    WorkflowVariable,
    WorkflowExecution,
    WorkflowExecutionStep,
    Integration,
    DataSource,
    DataTransformation,
    ReportDefinition,
    ReportExecution,
    CompanyAddress,
    CreateCompanyAddressInput,
    UpdateCompanyAddressInput,
    CompanyAddressFilter,
} from './domain/types';

export type {
    // Utils
    Optional,
    WithRequired,
    DeepPartial,
    DeepRequired,
    NonNullable,
    ValueOf,
    ArrayElement,
    Awaited,
    ReturnType,
    Parameters,
    ConstructorParameters,
    InstanceType,
    Readonly,
    Mutable,
    PickByValue,
    OmitByValue,
    KeysOfType,
    KeysNotOfType,
    UnionToIntersection,
    Last,
    Head,
    Tail,
    Prepend,
    Append,
    Reverse,
    StringLiteral,
    NumericLiteral,
    BooleanLiteral,
    Brand,
    Nominal,
    Flatten,
    DeepFlatten,
    NestedProperty,
    Paths,
    Leaves,
    If,
    Equals,
    IsNever,
    IsAny,
    IsUnknown,
    IsVoid,
    IsNull,
    IsUndefined,
    IsNullOrUndefined,
    NonNull,
    NonUndefined,
    AnyFunction,
    AsyncFunction,
    SyncFunction,
    EventHandler,
    AsyncEventHandler,
    Callback,
    AsyncCallback,
    Predicate,
    AsyncPredicate,
    Mapper,
    AsyncMapper,
    Reducer,
    AsyncReducer,
} from './utils/types';
