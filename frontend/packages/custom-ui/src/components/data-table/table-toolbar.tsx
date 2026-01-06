import { Table } from "@tanstack/react-table";
import { Button, Input, cn } from "@truths/ui";
import { Filter, Plus, Download, Search, X, Loader2 } from "lucide-react";
import { exportToCSV } from "./utils";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { FilterDef } from "./types";
import { DataTableViewOptions } from "./view-options";

interface TableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  onCreate?: () => void;
  onExport?: () => void;
  onFilterClick?: () => void;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  manualFiltering?: boolean;
  loading?: boolean;
  customActions?: React.ReactNode;
  filterDefs?: FilterDef[];
  density: string;
  onDensityChange: (density: string) => void;
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
      manualFiltering = false,
      loading = false,
      customActions,
      filterDefs = [],
      density,
      onDensityChange,
    },
    ref
  ) {
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

    // Check if any filters are active (global filter or any column filter)
    const isFiltered =
      globalFilter.trim() !== "" ||
      hasActiveFilters ||
      table.getState().columnFilters.length > 0;

    const handleReset = () => {
      // Reset global filter
      onGlobalFilterChange("");
      
      // Reset all column filters
      table.resetColumnFilters();

      // Call custom reset handler if provided
      onResetFilters?.();
    };

    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-1.5 overflow-hidden min-w-0">
          <div className="relative flex-shrink-0" style={{ width: "240px" }}>
            {loading ? (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            )}
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(e) => onGlobalFilterChange(e.target.value)}
              className={cn(
                "h-8 pl-8 pr-2 text-xs",
                "w-full focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
              )}
            />
          </div>
          <div className="flex items-center gap-1 min-w-0">
            {onFilterClick && (
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8 px-2 text-xs", "whitespace-nowrap")}
                onClick={onFilterClick}
              >
                <Filter
                  className={cn(
                    "h-3 w-3",
                    "mr-1",
                    hasActiveFilters && "fill-current"
                  )}
                />
                Filters
              </Button>
            )}

            {filterDefs.map((filter) => {
              const column = table.getColumn(filter.columnId);
              if (!column) return null;
              
              return (
                <DataTableFacetedFilter
                  key={filter.columnId}
                  column={column}
                  title={filter.title}
                  options={filter.options}
                />
              );
            })}

            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8 px-2 text-xs", "whitespace-nowrap")}
                onClick={handleReset}
                title="Reset all filters"
              >
                <X className={cn("h-3 w-3", "mr-1")} />
                Reset
              </Button>
            )}
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 flex-shrink-0")}>
          {customActions}
          {onCreate && (
            <Button
              variant="default"
              size="sm"
              className={cn("h-8 px-2 text-xs")}
              onClick={onCreate}
            >
              <Plus className={cn("h-3 w-3", "mr-1")} />
              New
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className={cn("h-8 px-2 text-xs")}
          >
            <Download className={cn("h-3 w-3", "mr-1")} />
            Export
          </Button>
          <DataTableViewOptions 
            table={table} 
            density={density}
            onDensityChange={onDensityChange}
           />
        </div>
      </div>
    );
  }
);

TableToolbar.displayName = "TableToolbar";
