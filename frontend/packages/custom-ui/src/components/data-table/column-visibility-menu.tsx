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

interface ColumnVisibilityMenuProps<TData> {
  table: Table<TData>;
}

export function ColumnVisibilityMenu<TData>({
  table,
}: ColumnVisibilityMenuProps<TData>) {
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("h-8 px-2 text-xs")}
        >
          <Settings2 className={cn("h-3 w-3", "mr-1")} />
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
