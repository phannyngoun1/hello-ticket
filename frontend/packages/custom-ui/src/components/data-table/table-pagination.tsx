import { Table } from "@tanstack/react-table";
import { Button, cn } from "@truths/ui";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { useDensityStyles } from "@truths/utils";

export interface TablePaginationProps<TData> {
  table: Table<TData>;
  totalCount?: number;
  manualPagination?: boolean;
  onPageSizeChange?: (pageSize: number) => void;
  compact?: boolean;
}

export function TablePagination<TData>({
  table,
  totalCount,
  manualPagination,
  onPageSizeChange,
  // compact: compactProp,
}: TablePaginationProps<TData>) {
  // const density = useDensityStyles();
  // Table footer always stays compact regardless of density mode
  const padding = "px-3 py-1.5";
  const textSize = "text-xs"; // Always compact
  const buttonSize = "h-6 w-6";
  const iconSize = "h-3 w-3"; // Always compact

  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-border bg-muted/10",
        padding
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn(textSize, "text-muted-foreground leading-none")}>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} •{" "}
          {typeof totalCount === "number"
            ? totalCount
            : table.getFilteredRowModel().rows.length}{" "}
          {typeof totalCount === "number" && totalCount === 1 ? "row" : "rows"}
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            const next = Number(e.target.value);
            table.setPageSize(next);
            if (manualPagination && onPageSizeChange) {
              // Reset to first page for server-side paging when page size changes
              table.setPageIndex(0);
              onPageSizeChange(next);
            }
          }}
          className={cn(
            textSize,
            "h-6 border border-border rounded-md px-2 bg-background leading-none",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          )}
          aria-label="Rows per page"
        >
          {[10, 20, 50, 100, 200].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize} per page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className={cn(buttonSize, "p-0 flex items-center justify-center")}
          aria-label="First page"
        >
          <ChevronsLeft className={iconSize} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={cn(buttonSize, "p-0 flex items-center justify-center")}
          aria-label="Previous page"
        >
          <ChevronLeft className={iconSize} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={cn(buttonSize, "p-0 flex items-center justify-center")}
          aria-label="Next page"
        >
          <ChevronRight className={iconSize} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className={cn(buttonSize, "p-0 flex items-center justify-center")}
          aria-label="Last page"
        >
          <ChevronsRight className={iconSize} />
        </Button>
      </div>
    </div>
  );
}
