import { Table } from "@tanstack/react-table";
import { Button, Input, cn } from "@truths/ui";
import { Filter, Plus, Download, Search, X, Loader2 } from "lucide-react";
import { ColumnVisibilityMenu } from "./column-visibility-menu";
import { exportToCSV } from "./utils";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { useDensityStyles } from "@truths/utils";

interface TableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  onCreate?: () => void;
  onExport?: () => void;
  onFilterClick?: () => void;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  onStatusFilterChange?: (status: string | undefined) => void;
  manualFiltering?: boolean;
  loading?: boolean;
  customActions?: React.ReactNode;
}

export interface TableToolbarRef {
  focusSearch: () => void;
}

export const TableToolbar = forwardRef<TableToolbarRef, TableToolbarProps<any>>(
  function TableToolbar(
    {
      table,
      globalFilter,
      onGlobalFilterChange,
      onCreate,
      onExport,
      onFilterClick,
      hasActiveFilters = false,
      onResetFilters,
      onStatusFilterChange,
      manualFiltering = false,
      loading = false,
      customActions,
    },
    ref
  ) {
    const density = useDensityStyles();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Expose focus method via ref
    useImperativeHandle(ref, () => ({
      focusSearch: () => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      },
    }));

    const handleExport = () => {
      if (onExport) {
        onExport();
      } else {
        exportToCSV(
          table.getFilteredRowModel().rows.map((row) => row.original)
        );
      }
    };

    // Get status column if it exists (safely check without throwing)
    // Check if column exists in the column definitions first
    const statusColumnId = "status";
    const hasStatusColumn = table
      .getAllColumns()
      .some(
        (col) =>
          col.id === statusColumnId ||
          (col.columnDef as { accessorKey?: string })?.accessorKey ===
            statusColumnId
      );

    let statusColumn: ReturnType<typeof table.getColumn> | undefined;
    if (hasStatusColumn) {
      try {
        statusColumn = table.getColumn(statusColumnId);
      } catch {
        // Column doesn't exist or can't be accessed, which is fine
        statusColumn = undefined;
      }
    }

    // Check if any filters are active (global filter, column filters, or advanced filters)
    const hasAnyFilters =
      globalFilter.trim() !== "" ||
      statusColumn?.getFilterValue() !== undefined ||
      hasActiveFilters;

    const handleReset = () => {
      // Reset global filter
      onGlobalFilterChange("");
      // Reset status column filter
      if (statusColumn) {
        if (manualFiltering && onStatusFilterChange) {
          // In server-side mode, use callback
          onStatusFilterChange(undefined);
        } else {
          statusColumn.setFilterValue(undefined);
        }
      }
      // Call custom reset handler if provided
      onResetFilters?.();
    };

    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 overflow-hidden min-w-0">
          <div className="relative flex-shrink-0" style={{ width: "280px" }}>
            {loading ? (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(e) => onGlobalFilterChange(e.target.value)}
              className={cn(
                density.searchInputHeight,
                "pl-10",
                density.textSize,
                "w-full focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
              )}
            />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            {onFilterClick && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  density.buttonHeightSmall,
                  density.textSizeSmall,
                  "whitespace-nowrap"
                )}
                onClick={onFilterClick}
              >
                <Filter
                  className={cn(
                    density.iconSize,
                    "mr-1",
                    hasActiveFilters && "fill-current"
                  )}
                />
                Filters
              </Button>
            )}

            {statusColumn && (
              <>
                <DataTableFacetedFilter
                  column={statusColumn}
                  title="Status"
                  options={[
                    {
                      label: "Active",
                      value: "active",
                    },
                    {
                      label: "Inactive",
                      value: "inactive",
                    },
                    {
                      label: "Pending",
                      value: "pending",
                    },
                  ]}
                  onFilterChange={
                    manualFiltering && onStatusFilterChange
                      ? (value) => {
                          // For server-side mode, extract the status from filter value
                          // Filter value is an array of selected statuses
                          if (Array.isArray(value) && value.length > 0) {
                            // Take first selected status (or you could modify to handle multiple)
                            // Cast to string since the callback accepts string | undefined
                            onStatusFilterChange(value[0] as string);
                          } else {
                            onStatusFilterChange(undefined);
                          }
                        }
                      : undefined
                  }
                />
                {hasAnyFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      density.buttonHeightSmall,
                      density.textSizeSmall,
                      "whitespace-nowrap"
                    )}
                    onClick={handleReset}
                    title="Reset all filters"
                  >
                    <X className={cn(density.iconSize, "mr-1")} />
                    Reset
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 flex-shrink-0",
            density.gapButtonGroup
          )}
        >
          {customActions}
          {onCreate && (
            <Button
              variant="default"
              size="sm"
              className={cn(density.buttonHeightSmall, density.textSizeSmall)}
              onClick={onCreate}
            >
              <Plus className={cn(density.iconSize, "mr-1")} />
              New
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className={cn(density.buttonHeightSmall, density.textSizeSmall)}
          >
            <Download className={cn(density.iconSize, "mr-1")} />
            Export
          </Button>
          <ColumnVisibilityMenu table={table} />
        </div>
      </div>
    );
  }
);

TableToolbar.displayName = "TableToolbar";
