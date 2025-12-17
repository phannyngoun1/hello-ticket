import { useState } from "react";
import { flexRender, Table } from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Checkbox, cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";

interface TableContentProps<TData> {
  table: Table<TData>;
  enableRowSelection?: boolean;
  enableColumnResizing?: boolean;
  compact?: boolean;
}

export function TableContent<TData>({
  table,
  enableRowSelection = false,
  enableColumnResizing = true,
  compact = true,
}: TableContentProps<TData>) {
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const density = useDensityStyles();

  const rowPadding = compact ? "py-0" : "py-1";
  const cellPadding = compact ? "px-2.5" : "px-3.5";
  const textSize = density.textSize;

  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse",
          textSize,
          !enableColumnResizing && "table-auto"
        )}
        style={{
          width: "100%",
        }}
      >
        <colgroup>
          {table.getAllColumns().map((column) => {
            const columnDef = column.columnDef;
            const size = column.getSize();
            const isActionsColumn =
              column.id === "actions" ||
              column.id === "action" ||
              columnDef.id === "actions" ||
              columnDef.id === "action";

            // Actions columns should use minimal width - only what's needed for buttons
            if (isActionsColumn) {
              return (
                <col
                  key={column.id}
                  style={{
                    width: "1%", // Use minimal space, shrink to content
                    minWidth: "50px",
                    maxWidth: "100px",
                  }}
                />
              );
            }

            return (
              <col
                key={column.id}
                style={{
                  minWidth: enableColumnResizing
                    ? `${size}px`
                    : columnDef.minSize
                      ? `${columnDef.minSize}px`
                      : undefined,
                  width: enableColumnResizing
                    ? undefined
                    : columnDef.size
                      ? `${columnDef.size}px`
                      : undefined,
                  maxWidth: columnDef.maxSize
                    ? `${columnDef.maxSize}px`
                    : undefined,
                }}
              />
            );
          })}
        </colgroup>
        <thead className="bg-muted/40 sticky top-0 z-10 border-b border-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, headerIndex) => {
                const isFirstColumn = headerIndex === 0;
                const isLastColumn =
                  headerIndex === headerGroup.headers.length - 1;
                const isResizing = resizingColumn === header.id;
                const isActionsColumn =
                  header.column.id === "actions" ||
                  header.column.id === "action" ||
                  header.column.columnDef.id === "actions" ||
                  header.column.columnDef.id === "action";

                return (
                  <th
                    key={header.id}
                    className={cn(
                      cellPadding,
                      rowPadding,
                      "text-left font-semibold text-muted-foreground bg-muted/10",
                      "relative leading-tight",
                      "antialiased",
                      isResizing && "bg-muted/60",
                      isLastColumn && "sticky right-0 bg-muted/40 z-20",
                      isLastColumn && isActionsColumn && "opacity-0",
                      enableColumnResizing &&
                        header.column.getCanResize() &&
                        isResizing &&
                        "cursor-col-resize"
                    )}
                    style={{
                      width:
                        enableColumnResizing && !isActionsColumn
                          ? header.getSize()
                          : undefined,
                      position: isLastColumn ? "sticky" : undefined,
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1.5 relative">
                        {enableRowSelection && isFirstColumn && (
                          <Checkbox
                            checked={
                              table.getIsSomeRowsSelected()
                                ? "indeterminate"
                                : table.getIsAllRowsSelected()
                            }
                            onCheckedChange={(checked) => {
                              table.toggleAllRowsSelected(
                                checked === "indeterminate" ? false : !!checked
                              );
                            }}
                            className="h-3.5 w-3.5"
                            aria-label="Select all rows"
                          />
                        )}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 flex-1 min-w-0",
                            header.column.getCanSort() &&
                              "cursor-pointer select-none hover:text-foreground",
                            !header.column.getCanSort() && "cursor-default"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {header.column.getCanSort() &&
                            header.column.getIsSorted() && (
                              <span className="flex-shrink-0">
                                {
                                  {
                                    asc: (
                                      <ChevronUp className="h-3 w-3 text-primary" />
                                    ),
                                    desc: (
                                      <ChevronDown className="h-3 w-3 text-primary" />
                                    ),
                                  }[header.column.getIsSorted() as string]
                                }
                              </span>
                            )}
                        </div>
                        {enableColumnResizing &&
                          header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              onMouseEnter={() => setResizingColumn(header.id)}
                              onMouseLeave={() => setResizingColumn(null)}
                              className={cn(
                                "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none",
                                "hover:bg-primary/50 transition-colors z-30",
                                isResizing && "bg-primary"
                              )}
                              style={{
                                cursor: "col-resize",
                                width: "6px",
                                marginRight: "-3px",
                                pointerEvents: "auto",
                              }}
                            />
                          )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={table.getAllColumns().length}
                className={cn(
                  cellPadding,
                  rowPadding,
                  "text-center text-muted-foreground",
                  "leading-relaxed",
                  "antialiased"
                )}
              >
                No data available
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, index) => {
              const isSelected = row.getIsSelected();
              const lastColumn =
                row.getVisibleCells()[row.getVisibleCells().length - 1];
              const isActionsColumn =
                lastColumn?.column.id === "actions" ||
                lastColumn?.column.id === "action" ||
                lastColumn?.column.columnDef.id === "actions" ||
                lastColumn?.column.columnDef.id === "action";

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border/10 transition-colors group",
                    "hover:bg-muted/30",
                    isSelected && "bg-primary/5 hover:bg-primary/10",
                    index % 2 === 0 ? "bg-background" : "bg-muted/10"
                  )}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const isFirstColumn = cellIndex === 0;
                    const isLastColumn =
                      cellIndex === row.getVisibleCells().length - 1;
                    const cellIsActions =
                      cell.column.id === "actions" ||
                      cell.column.id === "action" ||
                      cell.column.columnDef.id === "actions" ||
                      cell.column.columnDef.id === "action";

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          cellPadding,
                          rowPadding,
                          textSize,
                          "text-foreground",
                          "leading-tight",
                          "font-normal",
                          "antialiased",
                          isLastColumn &&
                            cn(
                              "sticky right-0 z-10 transition-opacity",
                              index % 2 === 0 ? "bg-background" : "bg-muted/10"
                            ),
                          isLastColumn &&
                            isActionsColumn &&
                            cn("opacity-0 group-hover:opacity-100")
                        )}
                        style={{
                          position: isLastColumn ? "sticky" : undefined,
                        }}
                      >
                        {enableRowSelection && isFirstColumn ? (
                          <div className="flex items-center gap-1.5">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                row.toggleSelected(!!checked);
                              }}
                              className="h-3.5 w-3.5"
                              aria-label={`Select row ${index + 1}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="flex-1 min-w-0 leading-tight">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="truncate leading-tight">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
