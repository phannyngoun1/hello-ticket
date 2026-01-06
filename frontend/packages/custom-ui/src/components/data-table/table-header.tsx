import { CardTitle, CardDescription, cn } from "@truths/ui";
import { TableToolbar, type TableToolbarRef } from "./table-toolbar";
import { Table } from "@tanstack/react-table";
import React, { forwardRef } from "react";

interface TableHeaderProps<TData> {
  title: string;
  description?: string;
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
  compact?: boolean;
  customActions?: React.ReactNode;
  filterDefs?: any[]; // using any temporarily, should be imported FilterDef but circular dep risk?
  density?: string;
  onDensityChange?: (density: string) => void;
}

export const TableHeader = forwardRef<TableToolbarRef, TableHeaderProps<any>>(
  function TableHeader(
    {
      title,
      description,
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
      compact = true,
      customActions,
      filterDefs,
      density = "comfortable",
      onDensityChange = () => {},
    },
    ref
  ) {
    const titleSize = compact ? "text-sm" : "text-base";
    const descSize = compact ? "text-xs" : "text-sm";

    return (
      <div className="flex flex-col gap-3 mt-4  ">
        <div className="flex items-center gap-2">
          <CardTitle className={titleSize}>{title}</CardTitle>
          {description && (
            <CardDescription className={cn(descSize, "text-muted-foreground")}>
              {description}
            </CardDescription>
          )}
        </div>
        <TableToolbar
          ref={ref}
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={onGlobalFilterChange}
          onCreate={onCreate}
          onExport={onExport}
          onFilterClick={onFilterClick}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={onResetFilters}
          manualFiltering={manualFiltering}
          loading={loading}
          customActions={customActions}
          filterDefs={filterDefs}
          density={density}
          onDensityChange={onDensityChange}
        />
      </div>
    );
  }
);

TableHeader.displayName = "TableHeader";
