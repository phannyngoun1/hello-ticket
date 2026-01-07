/**
 * Common types shared across sales components
 */


export interface SalesProps {
    className?: string;
    children?: React.ReactNode;
}

export interface SalesLayoutProps extends SalesProps {
    variant?: 'default' | 'compact' | 'expanded';
    fullWidth?: boolean;
}

export interface SalesWithDataProps<T> extends SalesProps {
    data: T;
    loading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
}

export interface SalesWithActionsProps extends SalesProps {
    actions?: React.ReactNode;
    onAction?: (action: string, data?: any) => void;
}



/**
 * Filter Types
 */
export interface SalesFilter {
    search?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

// Pagination and PaginatedResponse are imported from @truths/shared

/**
 * Sales Configuration
 */
export interface SalesConfig {
    theme?: 'light' | 'dark' | 'auto';
    locale?: string;
    apiEndpoint?: string;
    features?: {
        [key: string]: boolean;
    };
}


/**
 * Customer
 */
export interface Customer {
    id: string;
    code: string;
    name: string;
    status: 'active' | 'inactive';
    email?: string;
    phone?: string;
    business_name?: string;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
    id_number?: string;
    id_type?: string;
    account_manager_id?: string;
    sales_representative_id?: string;
    customer_since?: string;
    last_purchase_date?: string;
    total_purchase_amount?: number;
    last_contact_date?: string;
    event_preferences?: string;
    seating_preferences?: string;
    accessibility_needs?: string;
    dietary_restrictions?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    preferred_language?: string;
    marketing_opt_in?: boolean;
    email_marketing?: boolean;
    sms_marketing?: boolean;
    facebook_url?: string;
    twitter_handle?: string;
    linkedin_url?: string;
    instagram_handle?: string;
    website?: string;
    tags?: string[];
    status_reason?: string;
    notes?: string;
    public_notes?: string;
    createdAt: Date;
    updatedAt?: Date;
    deactivatedAt?: Date;
}

export interface CreateCustomerInput {
    name: string;
    email?: string;
    phone?: string;
    business_name?: string;
    street_address?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
    id_number?: string;
    id_type?: string;
    event_preferences?: string;
    seating_preferences?: string;
    accessibility_needs?: string;
    dietary_restrictions?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    preferred_language?: string;
    marketing_opt_in?: boolean;
    email_marketing?: boolean;
    sms_marketing?: boolean;
    facebook_url?: string;
    twitter_handle?: string;
    linkedin_url?: string;
    instagram_handle?: string;
    website?: string;
    tags?: string[];
    notes?: string;
    public_notes?: string;
    status: string;
}

export interface UpdateCustomerInput {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    business_name?: string | null;
    street_address?: string | null;
    city?: string | null;
    state_province?: string | null;
    postal_code?: string | null;
    country?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    nationality?: string | null;
    id_number?: string | null;
    id_type?: string | null;
    event_preferences?: string | null;
    seating_preferences?: string | null;
    accessibility_needs?: string | null;
    dietary_restrictions?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relationship?: string | null;
    preferred_language?: string | null;
    marketing_opt_in?: boolean | null;
    email_marketing?: boolean | null;
    sms_marketing?: boolean | null;
    facebook_url?: string | null;
    twitter_handle?: string | null;
    linkedin_url?: string | null;
    instagram_handle?: string | null;
    website?: string | null;
    tags?: string[] | null;
    status_reason?: string | null;
    notes?: string | null;
    public_notes?: string | null;
    status?: 'active' | 'inactive' | null;
}

export interface CustomerFilter {
    search?: string;
    status?: Customer['status'];
    code?: string;
    name?: string;
    business_name?: string;
}
