import { Table } from "@tanstack/react-table";
import { Button } from "@truths/ui";
import { X } from "lucide-react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";

interface BulkActionsBarProps<TData> {
  table: Table<TData>;
  selectedCount: number;
  customActions?: React.ReactNode;
}

export function BulkActionsBar<TData>({
  table,
  selectedCount,
  customActions,
}: BulkActionsBarProps<TData>) {
  const density = useDensityStyles();
  const handleClearSelection = () => {
    table.toggleAllRowsSelected(false);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        density.paddingCell,
        density.paddingRow,
        "bg-primary/5 border-b border-border",
        density.textSize
      )}
    >
      <div className={cn("flex items-center", density.gapButtonGroup)}>
        <span className="font-medium text-foreground">
          {selectedCount} {selectedCount === 1 ? "row" : "rows"} selected
        </span>
        {customActions && <div className={cn("flex items-center", density.gapButtonGroup)}>{customActions}</div>}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClearSelection}
        className={cn(density.buttonHeightSmall, density.textSizeSmall)}
        aria-label="Clear selection"
      >
        <X className={cn(density.iconSize, "mr-1")} />
        Clear
      </Button>
    </div>
  );
}

