import { ColumnDef } from "@tanstack/react-table";

export interface DataRow {
    id: string;
    name: string;
    email: string;
    department: string;
    status: "active" | "inactive" | "pending";
    revenue: number;
    createdAt: string;
    lastLogin: string;
}

export interface DataTableProps<TData = DataRow> {
    data?: TData[];
    columns?: ColumnDef<TData>[];
    title?: string;
    description?: string;
    useDefaultColumns?: boolean;
    onCreate?: () => void;
    onFilterClick?: () => void;
    hasActiveFilters?: boolean;
    onResetFilters?: () => void;
    onSearch?: (query: string) => void;
    onStatusFilterChange?: (status: string | undefined) => void; // For server-side status filtering
    manualFiltering?: boolean; // When true, disables client-side filtering
    loading?: boolean; // Loading state for search operations
    // Server-side pagination support
    serverPagination?: {
        page: number; // 1-based
        pageSize: number;
        total?: number;
        totalPages?: number;
    };
    onPageChange?: (page: number) => void; // 1-based
    manualPagination?: boolean; // When true, table uses server-side pagination
    onPageSizeChange?: (pageSize: number) => void; // When manualPagination, notify parent to refetch
    // Enterprise features
    enableRowSelection?: boolean; // Enable row selection with checkboxes
    enableColumnResizing?: boolean; // Enable column resizing
    compact?: boolean; // Compact, dense layout (default: true)
    onRowSelectionChange?: (selectedRows: TData[]) => void; // Callback when row selection changes
    bulkActions?: React.ReactNode; // Custom bulk actions component
    emptyState?: React.ReactNode; // Custom empty state component
    customActions?: React.ReactNode; // Custom actions to render before the create button in toolbar
    // Persistence
    viewId?: string; // Unique ID for persisting view state (column visibility, density, sorting)
    // Advanced Filtering
    filterDefs?: FilterDef[]; // Definitions for faceted filters
}

export interface FilterOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterDef {
    columnId: string;
    title: string;
    options: FilterOption[];
}
