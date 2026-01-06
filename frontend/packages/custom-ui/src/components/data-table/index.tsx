import { useState, useEffect, useRef, useMemo } from "react";
import {
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  ColumnDef,
  VisibilityState,
  SortingState,
} from "@tanstack/react-table";
import { Card, CardContent } from "@truths/ui";
import { TableHeader } from "./table-header";
import { TableContent } from "./table";
import { TablePagination } from "./table-pagination";
import { BulkActionsBar } from "./bulk-actions-bar";
import { defaultColumns } from "./default-columns";
import { useIsCompact } from "@truths/utils";
import type { DataRow, DataTableProps } from "./types";
import type { TableToolbarRef } from "./table-toolbar";

/**
 * Enterprise-grade data table component
 *
 * Features:
 * - Compact, data-dense layout
 * - Column visibility toggle
 * - Advanced filtering
 * - Sorting on all columns
 * - Pagination for large datasets
 * - Export functionality ready
 * - Responsive design
 * - Keyboard accessible
 * - View Persistence (Sorting, Density, Column Visibility)
 */

export function DataTable<TData = DataRow>({
  data = [],
  columns: customColumns,
  title = "Data Table",
  description = "High-density data display with advanced features",
  useDefaultColumns = true,
  onCreate,
  onFilterClick,
  hasActiveFilters = false,
  onResetFilters,
  onSearch,
  onStatusFilterChange, // Deprecated, will map to generic filters locally
  manualFiltering = false,
  loading = false,
  serverPagination,
  onPageChange,
  manualPagination = false,
  onPageSizeChange,
  enableRowSelection = false,
  enableColumnResizing = true,
  compact: compactProp,
  onRowSelectionChange,
  bulkActions,
  emptyState,
  customActions,
  viewId,
  filterDefs,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<TableToolbarRef>(null);
  
  // Use persisted state hook
  const usePersistedState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        if (!viewId) return defaultValue;
        try {
            const saved = localStorage.getItem(`datatable-view-${viewId}-${key}`);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (e) {
            console.error("Failed to load view state", e);
            return defaultValue;
        }
    });

    useEffect(() => {
        if (!viewId) return;
        try {
            localStorage.setItem(`datatable-view-${viewId}-${key}`, JSON.stringify(state));
        } catch (e) {
            console.error("Failed to save view state", e);
        }
    }, [viewId, key, state]);

    return [state, setState];
  };

  const [columnVisibility, setColumnVisibility] = usePersistedState<VisibilityState>("visibility", {});
  const [sorting, setSorting] = usePersistedState<SortingState>("sorting", []);
  
  // Density state
  const isCompactDefault = useIsCompact();
  // If compact prop is forced, use it, otherwise use density state (defaulting to compact if no persistence)
  const [density, setDensity] = usePersistedState<string>("density", isCompactDefault ? "compact" : "comfortable");
  
  // Determine actual compact value for compatibility
  const compact = compactProp !== undefined ? compactProp : density === "compact";
  
  const [rowSelection, setRowSelection] = useState({});
  const [columnSizing, setColumnSizing] = useState({});

  // Keep the ref up to date with the latest onSearch callback
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Debounce search input to avoid excessive API calls
  // Only debounce if onSearch is provided (server-side mode)
  useEffect(() => {
    if (onSearchRef.current && manualFiltering) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // If search is cleared, trigger immediately
      if (globalFilter === "") {
        onSearchRef.current(globalFilter);
        return;
      }

      // Set new timeout to call onSearch after user stops typing
      searchTimeoutRef.current = setTimeout(() => {
        onSearchRef.current?.(globalFilter);
      }, 500); // 500ms delay

      // Cleanup timeout on unmount or when value changes
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }
  }, [globalFilter, manualFiltering]);

  // Handle search changes - update local state immediately for UI responsiveness
  const handleGlobalFilterChange = (value: string) => {
    setGlobalFilter(value);
    // Don't call onSearch here - let the useEffect handle it with debouncing
    // Only call immediately if not in server-side mode
    if (onSearch && !manualFiltering) {
      onSearch(value);
    }
  };

  // Use custom columns if provided, otherwise use default columns
  const effectiveColumns =
    customColumns ||
    (useDefaultColumns ? (defaultColumns as ColumnDef<TData>[]) : []);

  const table = useReactTable<TData>({
    data,
    columns: effectiveColumns,
    state: {
      globalFilter,
      columnVisibility,
      rowSelection,
      columnSizing,
      sorting,
      // Reflect external server pagination into table state (1-based -> 0-based)
      ...(manualPagination && serverPagination
        ? {
            pagination: {
              pageIndex: Math.max(0, (serverPagination.page || 1) - 1),
              pageSize: serverPagination.pageSize ?? 50,
            },
          }
        : {}),
    },
    onGlobalFilterChange: handleGlobalFilterChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    onSortingChange: setSorting,
    enableRowSelection: enableRowSelection,
    enableColumnResizing: enableColumnResizing,
    columnResizeMode: "onChange",
    // Intercept page/pageSize changes to notify parent for server-side pagination
    ...(manualPagination && (onPageChange || onPageSizeChange)
      ? {
          onPaginationChange: (updater) => {
            // updater can be an index or a function; compute next index
            const current =
              manualPagination && serverPagination
                ? {
                    pageIndex: Math.max(0, serverPagination.page - 1),
                    pageSize: serverPagination.pageSize,
                  }
                : { pageIndex: 0, pageSize: 50 };
            const next =
              typeof updater === "function" ? updater(current as any) : updater;
            const nextIndex = (next as any).pageIndex ?? 0;
            const nextSize = (next as any).pageSize ?? current.pageSize;
            if (onPageChange && nextIndex !== current.pageIndex) {
              onPageChange(Math.max(1, nextIndex + 1));
            }
            if (onPageSizeChange && nextSize !== current.pageSize) {
              onPageSizeChange(nextSize);
            }
          },
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
    // Client-side pagination model is only needed when not using server-side
    ...(manualPagination
      ? {}
      : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    // Only enable client-side filtering if not in manual/server-side mode
    ...(manualFiltering
      ? {}
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedUniqueValues: getFacetedUniqueValues(),
        }),
    manualFiltering,
    manualPagination,
    // When manual pagination, inform table of total page count
    ...(manualPagination && serverPagination?.totalPages
      ? { pageCount: Math.max(1, serverPagination.totalPages) }
      : {}),
    initialState: {
      pagination: {
        pageSize: serverPagination?.pageSize ?? 50, // default page size
      },
    },
  });

  // Notify parent when row selection changes
  useEffect(() => {
    if (onRowSelectionChange && enableRowSelection) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, onRowSelectionChange, enableRowSelection]);

  // Keyboard handler to steal focus to search when typing in table area
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if focus is within the table container
      const activeElement = document.activeElement;
      const isFocusInTable =
        tableContainerRef.current &&
        activeElement &&
        tableContainerRef.current.contains(activeElement as Node);

      // Check if user is already typing in an input field
      const isTypingInInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement).isContentEditable ||
          // Check if focus is inside a dialog/modal
          activeElement.closest("[role='dialog']") ||
          // Check if focus is in a combobox/select dropdown
          activeElement.closest("[role='combobox']") ||
          activeElement.closest("[role='listbox']"));

      // If typing printable character keys and focus is in table but not in input
      if (
        isFocusInTable &&
        !isTypingInInput &&
        toolbarRef.current &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key !== "Enter" &&
        e.key !== " " &&
        e.key !== "Tab" &&
        e.key !== "Escape" &&
        // Don't intercept arrow keys or other navigation keys
        ![
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
          "PageUp",
          "PageDown",
        ].includes(e.key)
      ) {
        // Focus the search input
        toolbarRef.current.focusSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectedRowCount = enableRowSelection
    ? table.getSelectedRowModel().rows.length
    : 0;
    
  // Combine custom filters with backward compatible status filter
  const allFilterDefs = useMemo(() => {
    const defs = [...(filterDefs || [])];
    
    // Compatibility for onStatusFilterChange
    if (onStatusFilterChange && !defs.find(d => d.columnId === "status")) {
        defs.push({
            columnId: "status",
            title: "Status",
            options: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Pending", value: "pending" },
            ]
        });
    }
    return defs;
  }, [filterDefs, onStatusFilterChange]);
  
  // Backward compatibility: If manualFiltering is on, we need to wire up the status column
  // This is a bit tricky because filterDefs drive the UI now.
  // The DataTableView will render filters from filterDefs.
  // We need to ensure that when the status filter is changed in the UI, it calls onStatusFilterChange.
  // HOWEVER, the new TableToolbar purely uses column.setFilterValue.
  // So we need to intercept the column filter changes for manual filtering.
  // Effectively, the parent component should be checking table state or we need to intercept `onColumnFiltersChange` in the table options?
  // React-Table state is controlled by us here.
  // `onColumnFiltersChange`: setColumnFilters
  
  // Actually, TanStack table's column.setFilterValue updates the state. 
  // If manualFiltering is true, we usually want to trigger a callback side-effect.
  // In the old code, TableToolbar manually handled this. 
  // Now, the filter UI calls column.setFilterValue. 
  // We can listen to state changes or just let the parent handle it via `onStateChange` if they passed the state down? No, we control state.
  
  // Let's rely on the fact that existing server-side filtering might need refactoring or we assume standard FacetedFilter usage.
  // The generic implementation will set the column filter value.
  // If `manualFiltering` is true, we should probably watch `columnFilters` state and notify.
  // BUT the old code passed `onStatusFilterChange` specifically.
  // Let's stick to the previous specialized logic for status inside TableHeader for now via the mapped props, 
  // BUT I removed that logic from TableToolbar.
  // So I need to restore it OR bridge it.
  
  // Plan:
  // Since `filterDefs` are passed to toolbar, and toolbar renders `DataTableFacetedFilter`.
  // `DataTableFacetedFilter` calls `column.setFilterValue`.
  // If I want to support `onStatusFilterChange`, I should probably pass a wrapper to `onColumnFiltersChange`?
  // TanStack table doesn't have a simple per-column callback.
  
  // Easier approach:
  // In `TableToolbar`, I removed the special status handling.
  // I should actually handle `onStatusFilterChange` by observing the filter state change for 'status' column.
  // OR, I can pass a custom `onFilterChange` to the `DataTableFacetedFilter` for the status column in `TableToolbar`?
  // But `filterDefs` is generic.
  
  // Let's fix this by adding a specific check in `TableToolbar.tsx`'s map loop?
  // No, `TableToolbar` should be dumb.
  
  // BETTER IDEA:
  // In `index.tsx`, use `useEffect` to watch `table.getState().columnFilters`.
  // If `manualFiltering` is on, and `status` filter changes, call `onStatusFilterChange`.
  
  useEffect(() => {
    if(manualFiltering && onStatusFilterChange) {
        const statusFilter = table.getState().columnFilters.find(f => f.id === 'status');
        const scrollValue = statusFilter?.value; // likely array
        // transform to string expectation
        const val = Array.isArray(scrollValue) && scrollValue.length > 0 ? scrollValue[0] : undefined;
        // Since we don't know if it actually CHANGED from the outside easily without ref-tracking,
        // we might trigger specific callbacks. 
        // However, the original code had a callback passed to the UI component.
        // Let's do that for now to minimize risk.
    }
  }, [table.getState().columnFilters, manualFiltering, onStatusFilterChange]);
  
  // Actually, the simplest way is to pass `onStatusFilterChange` down to `TableHeader` -> `TableToolbar`.
  // And in `TableToolbar`, if we auto-generated the status filter def, we can wire it up there?
  // But I removed `onStatusFilterChange` prop from `TableToolbar` in the PREVIOUS step.
  // I should check `TableToolbar` again. Yes, I removed it.
  
  // So I must handle it in `index.tsx` or `TableToolbar` needs to be smarter.
  // I will rely on the `useEffect` approach in `index.tsx` as it separates concerns.
  // I need to track the previous value to avoid infinite loops or unnecessary calls if other things change?
  // Actually, `onStatusFilterChange` is usually a fetch trigger.
  
  // Wait, I can make `TableToolbar` generic but allow passing a "filter override" or just wire it in `index.tsx`.
  // Let's add the useEffect for `onStatusFilterChange` compatibility.
  
  const prevStatusRef = useRef<string | undefined>(undefined);
  const columnFilters = table.getState().columnFilters;
  
  useEffect(() => {
      if (!manualFiltering || !onStatusFilterChange) return;
      
      const statusFilter = columnFilters.find(f => f.id === 'status');
      const rawValue = statusFilter?.value;
      const newValue = Array.isArray(rawValue) && rawValue.length > 0 ? rawValue[0] : undefined;
      
      if (newValue !== prevStatusRef.current) {
          prevStatusRef.current = newValue;
          onStatusFilterChange(newValue);
      }
  }, [columnFilters, manualFiltering, onStatusFilterChange]);

  return (
    <Card ref={tableContainerRef} className="w-full px-4 py-4">
      <TableHeader
        ref={toolbarRef}
        title={title}
        description={description}
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={handleGlobalFilterChange}
        onCreate={onCreate}
        onFilterClick={onFilterClick}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        manualFiltering={manualFiltering}
        loading={loading}
        customActions={customActions}
        filterDefs={allFilterDefs}
        density={density}
        onDensityChange={setDensity}
      />
      {enableRowSelection && selectedRowCount > 0 && (
        <BulkActionsBar
          table={table}
          selectedCount={selectedRowCount}
          customActions={bulkActions}
        />
      )}
      <CardContent>
        <TableContent
          table={table}
          enableRowSelection={enableRowSelection}
          enableColumnResizing={enableColumnResizing}
          compact={compact}
        />
        {table.getRowModel().rows.length === 0 && !loading && emptyState && (
          <div className="py-8">{emptyState}</div>
        )}
      </CardContent>
      <TablePagination
        table={table}
        totalCount={serverPagination?.total}
        manualPagination={manualPagination}
        onPageSizeChange={onPageSizeChange}
        compact={compact}
      />
    </Card>
  );
}

// Re-export types for external use
export type { DataRow, DataTableProps, FilterDef, FilterOption } from "./types";

// Re-export column text header component
export { ColumnTextHeader } from "./column-text-header";
export type { ColumnTextHeaderProps } from "./column-text-header";

// Re-export column helpers
export {
  createTextColumn,
  createNumberColumn,
  createDateColumn,
  createDateTimeColumn,
  createPercentageColumn,
  createCurrencyColumn,
  createSequenceColumn,
  createIdentifierColumn,
  createIdentifiedColumn,
  createIdentifiedLinkColumn,
  createLinkColumn,
  createActionsColumn,
} from "./column-helpers";
export type {
  CreateTextColumnOptions,
  CreateNumberColumnOptions,
  CreateDateColumnOptions,
  CreateDateTimeColumnOptions,
  CreatePercentageColumnOptions,
  CreateCurrencyColumnOptions,
  CreateSequenceColumnOptions,
  CreateIdentifierColumnOptions,
  CreateIdentifiedColumnOptions,
  CreateIdentifiedLinkColumnOptions,
  CreateLinkColumnOptions,
  CreateActionsColumnOptions,
  ActionDefinition,
} from "./column-helpers";
