import { Table } from "@tanstack/react-table";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Checkbox,
  cn,
} from "@truths/ui";
import { Settings2 } from "lucide-react";
import { useDensityStyles } from "@truths/utils";

interface ColumnVisibilityMenuProps<TData> {
  table: Table<TData>;
}

export function ColumnVisibilityMenu<TData>({
  table,
}: ColumnVisibilityMenuProps<TData>) {
  const density = useDensityStyles();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(density.buttonHeightSmall, density.textSizeSmall)}
        >
          <Settings2 className={cn(density.iconSize, "mr-1")} />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {table.getAllColumns().map((column) => (
          <div
            key={column.id}
            className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer hover:bg-accent rounded-sm"
            onClick={() => column.toggleVisibility(!column.getIsVisible())}
          >
            <Checkbox
              checked={column.getIsVisible()}
              onCheckedChange={(value: boolean) =>
                column.toggleVisibility(!!value)
              }
            />
            <span>{column.id}</span>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
