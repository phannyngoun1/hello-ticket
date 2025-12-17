import * as React from "react";

export interface User {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export type SearchScope = "all" | "navigation" | "actions" | string;

export interface RecentSearch {
    query: string;
    timestamp: number;
    scope?: SearchScope;
}

export interface BaseDataItem {
    id: string | number;
    code?: string;
    name: string;
}

export interface DataFetcher<T> {
    (query: string): Promise<T[]>;
}

export interface DataTypeConfig<T extends BaseDataItem> {
    key: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    fetcher?: DataFetcher<T>;
    renderItem: (item: T, onSelect: () => void) => React.ReactNode;
    getSearchValue: (item: T) => string;
    navigateTo?: string;
    scope: SearchScope;
}

export interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dataTypes: DataTypeConfig<BaseDataItem>[];
    userId?: string;
    navigationItems?: NavigationItem[];
    quickActions?: QuickAction[];
}

export interface NavigationItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    path: string;
    shortcut?: string;
    description?: string;
    children?: NavigationItem[];
    parentLabel?: string;
    keywords?: string[]; // Additional search keywords for better matching (e.g., ["cust", "client"] for customer)
}

export interface QuickAction {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    action: () => void;
    keywords?: string[]; // Additional search keywords for better matching (e.g., ["cust", "client"] for customer)
}

export interface Suggestion {
    text: string;
    description: string;
}
