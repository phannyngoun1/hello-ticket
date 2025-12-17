/**
 * Domain-specific business entity types
 */

/**
 * Audit log entry
 */
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    tenantId?: string;
}

/**
 * System notification
 */
export interface Notification {
    id: string;
    userId: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'system';
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read: boolean;
    createdAt: Date;
    expiresAt?: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    actions?: NotificationAction[];
}

/**
 * Notification action
 */
export interface NotificationAction {
    id: string;
    label: string;
    type: 'button' | 'link';
    url?: string;
    onClick?: () => void;
    style?: 'primary' | 'secondary' | 'danger';
}

/**
 * Application settings
 */
export interface Settings {
    id: string;
    key: string;
    value: unknown;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    category: string;
    isPublic: boolean;
    tenantId?: string;
    updatedAt: Date;
    updatedBy: string;
}

/**
 * Feature flag
 */
export interface FeatureFlag {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    rolloutPercentage?: number;
    conditions?: FeatureFlagCondition[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tenantId?: string;
}

/**
 * Feature flag condition
 */
export interface FeatureFlagCondition {
    type: 'user' | 'tenant' | 'environment' | 'date' | 'custom';
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: unknown;
}

/**
 * System health check
 */
export interface HealthCheck {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime?: number;
    lastChecked: Date;
    details?: Record<string, unknown>;
    dependencies?: HealthCheck[];
}

/**
 * System metrics
 */
export interface SystemMetrics {
    timestamp: Date;
    cpu: {
        usage: number;
        cores: number;
    };
    memory: {
        used: number;
        total: number;
        usage: number;
    };
    disk: {
        used: number;
        total: number;
        usage: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
    };
    requests: {
        total: number;
        successful: number;
        failed: number;
        averageResponseTime: number;
    };
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
    id: string;
    name: string;
    description?: string;
    version: string;
    status: 'draft' | 'active' | 'archived';
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
    variables: WorkflowVariable[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tenantId?: string;
}

/**
 * Workflow step
 */
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'action' | 'condition' | 'parallel' | 'wait';
    config: Record<string, unknown>;
    nextSteps: string[];
    errorHandling?: {
        retryCount: number;
        retryDelay: number;
        fallbackStep?: string;
    };
}

/**
 * Workflow trigger
 */
export interface WorkflowTrigger {
    id: string;
    type: 'manual' | 'scheduled' | 'webhook' | 'event';
    config: Record<string, unknown>;
    enabled: boolean;
}

/**
 * Workflow variable
 */
export interface WorkflowVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    defaultValue?: unknown;
    description?: string;
}

/**
 * Workflow execution
 */
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    startedAt: Date;
    completedAt?: Date;
    executedBy: string;
    tenantId?: string;
    steps: WorkflowExecutionStep[];
}

/**
 * Workflow execution step
 */
export interface WorkflowExecutionStep {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    retryCount: number;
}

/**
 * Integration configuration
 */
export interface Integration {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive' | 'error';
    config: Record<string, unknown>;
    credentials?: Record<string, unknown>;
    lastSync?: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tenantId?: string;
}

/**
 * Data source
 */
export interface DataSource {
    id: string;
    name: string;
    type: 'database' | 'api' | 'file' | 'stream';
    connection: Record<string, unknown>;
    schema?: Record<string, unknown>;
    isActive: boolean;
    lastSync?: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tenantId?: string;
}

/**
 * Data transformation
 */
export interface DataTransformation {
    id: string;
    name: string;
    sourceId: string;
    targetId?: string;
    mapping: Record<string, string>;
    filters?: Record<string, unknown>;
    isActive: boolean;
    lastRun?: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tenantId?: string;
}

/**
 * Report definition
 */
export interface ReportDefinition {
    id: string;
    name: string;
    description?: string;
    type: 'table' | 'chart' | 'dashboard';
    config: Record<string, unknown>;
    dataSource: string;
    filters?: Record<string, unknown>;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tenantId?: string;
}

/**
 * Report execution
 */
export interface ReportExecution {
    id: string;
    reportId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    parameters?: Record<string, unknown>;
    result?: Record<string, unknown>;
    startedAt: Date;
    completedAt?: Date;
    executedBy: string;
    tenantId?: string;
}

/**
 * Company Address Types
 */
export interface CompanyAddress {
    id: string;
    tenant_id?: string;
    name: string;
    address_type: "default" | "billing" | "shipping";
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    is_default: boolean;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateCompanyAddressInput {
    name: string;
    address_type: "default" | "billing" | "shipping";
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    is_default?: boolean;
    notes?: string | null;
}

export interface UpdateCompanyAddressInput {
    name?: string;
    address_type?: "default" | "billing" | "shipping";
    street?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    is_default?: boolean;
    notes?: string | null;
}

export interface CompanyAddressFilter {
    address_type?: "default" | "billing" | "shipping";
}
