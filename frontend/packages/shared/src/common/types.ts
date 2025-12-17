/**
 * Common pattern types and interfaces
 */

/**
 * Generic form field interface
 */
export interface FormField<T = unknown> {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
    value: T;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    helpText?: string;
    validation?: FieldValidation;
    options?: SelectOption<T>[];
}

/**
 * Field validation rules
 */
export interface FieldValidation {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
}

/**
 * Validation error
 */
export interface ValidationError {
    field: string;
    message: string;
    code?: string;
}

/**
 * Form state
 */
export interface FormState<T = Record<string, unknown>> {
    values: T;
    errors: ValidationError[];
    touched: Record<string, boolean>;
    isSubmitting: boolean;
    isValid: boolean;
    isDirty: boolean;
}

/**
 * Select option interface
 */
export interface SelectOption<T = unknown> {
    value: T;
    label: string;
    disabled?: boolean;
    group?: string;
}

/**
 * Table column configuration
 */
export interface TableColumn<T = unknown> {
    key: keyof T | string;
    title: string;
    sortable?: boolean;
    filterable?: boolean;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
    render?: (value: unknown, row: T) => React.ReactNode;
}

/**
 * Table configuration
 */
export interface TableConfig<T = unknown> {
    columns: TableColumn<T>[];
    pagination?: PaginationConfig;
    sorting?: SortingConfig;
    filtering?: FilteringConfig;
    selection?: SelectionConfig;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
    pageSize: number;
    pageSizeOptions: number[];
    showSizeChanger: boolean;
    showQuickJumper: boolean;
    showTotal: boolean;
}

/**
 * Sorting configuration
 */
export interface SortingConfig {
    defaultSortBy?: string;
    defaultSortOrder?: 'asc' | 'desc';
    multiSort?: boolean;
}

/**
 * Filtering configuration
 */
export interface FilteringConfig {
    searchable?: boolean;
    filters?: FilterOption[];
    defaultFilters?: Record<string, unknown>;
}

/**
 * Filter option
 */
export interface FilterOption {
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'number' | 'boolean';
    options?: SelectOption[];
}

/**
 * Selection configuration
 */
export interface SelectionConfig<T = unknown> {
    type: 'single' | 'multiple';
    selectedRowKeys?: string[];
    onSelectionChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
}

/**
 * Modal configuration
 */
export interface ModalConfig {
    title: string;
    content?: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'small' | 'medium' | 'large' | 'full';
    closable?: boolean;
    maskClosable?: boolean;
    centered?: boolean;
}

/**
 * Toast notification
 */
export interface ToastNotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * Loading state
 */
export interface LoadingState {
    isLoading: boolean;
    error?: string;
    progress?: number;
}

/**
 * Async operation state
 */
export interface AsyncState<T = unknown> {
    data?: T;
    loading: boolean;
    error?: string;
    lastUpdated?: Date;
}

/**
 * Search configuration
 */
export interface SearchConfig {
    placeholder?: string;
    debounceMs?: number;
    minLength?: number;
    maxLength?: number;
    suggestions?: string[];
    onSearch?: (query: string) => void;
}

/**
 * Export configuration
 */
export interface ExportConfig {
    format: 'csv' | 'xlsx' | 'pdf' | 'json';
    filename?: string;
    includeHeaders?: boolean;
    dateFormat?: string;
    columns?: string[];
}

/**
 * Import configuration
 */
export interface ImportConfig {
    format: 'csv' | 'xlsx' | 'json';
    requiredColumns: string[];
    optionalColumns?: string[];
    maxFileSize?: number;
    validationRules?: Record<string, FieldValidation>;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
    mode: 'light' | 'dark' | 'auto';
    primaryColor: string;
    secondaryColor: string;
    borderRadius: number;
    fontFamily: string;
    fontSize: number;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
    sidebar: {
        collapsed: boolean;
        width: number;
        minWidth: number;
    };
    header: {
        height: number;
        sticky: boolean;
    };
    footer: {
        height: number;
        sticky: boolean;
    };
    content: {
        padding: number;
        maxWidth?: number;
    };
}

/**
 * Navigation item
 */
export interface NavigationItem {
    key: string;
    label: string;
    icon?: React.ReactNode;
    path?: string;
    children?: NavigationItem[];
    description?: string;
    shortcut?: string;
    permissions?: string[];
    badge?: {
        count: number;
        color?: string;
    };
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
    label: string;
    path?: string;
    icon?: React.ReactNode;
}

/**
 * Tab configuration
 */
export interface TabConfig {
    key: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
    closable?: boolean;
    icon?: React.ReactNode;
}

/**
 * Step configuration for wizards
 */
export interface StepConfig {
    key: string;
    title: string;
    description?: string;
    content: React.ReactNode;
    disabled?: boolean;
    completed?: boolean;
    optional?: boolean;
}
