import { useState, useEffect, useRef } from "react";
import {
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  ColumnDef,
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
  onStatusFilterChange,
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
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [columnSizing, setColumnSizing] = useState({});
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<TableToolbarRef>(null);
  const isCompactDefault = useIsCompact();
  const compact = compactProp !== undefined ? compactProp : isCompactDefault;

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
        onStatusFilterChange={onStatusFilterChange}
        manualFiltering={manualFiltering}
        loading={loading}
        compact={compact}
        customActions={customActions}
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
export type { DataRow, DataTableProps } from "./types";

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
