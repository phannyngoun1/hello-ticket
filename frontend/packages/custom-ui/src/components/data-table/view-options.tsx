import { Table } from "@tanstack/react-table";
import { Button } from "@truths/ui";
import {
  Settings2,
  List,
  Columns,
  StretchHorizontal,
  AlignJustify,
  Rows,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@truths/ui";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  density: string;
  onDensityChange: (density: string) => void;
}

export function DataTableViewOptions<TData>({
  table,
  density,
  onDensityChange,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex items-center gap-2"
        >
          <Settings2 className="h-3.5 w-3.5" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>View Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Density Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
             <Rows className="mr-2 h-3.5 w-3.5" />
             Density
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
             <DropdownMenuRadioGroup value={density} onValueChange={onDensityChange}>
                <DropdownMenuRadioItem value="compact">
                    <AlignJustify className="mr-2 h-3.5 w-3.5" />
                    Compact
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="comfortable">
                    <StretchHorizontal className="mr-2 h-3.5 w-3.5" />
                    Comfortable
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="spacious">
                    <List className="mr-2 h-3.5 w-3.5" />
                    Spacious
                </DropdownMenuRadioItem>
             </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

         <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Columns className="mr-2 h-3.5 w-3.5" />
             Columns
          </DropdownMenuSubTrigger>
           <DropdownMenuSubContent className="w-[200px]">
             <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
             <DropdownMenuSeparator />
             {table
            .getAllColumns()
            .filter(
                (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
            .map((column) => {
                return (
                <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                    {column.columnDef.header as string || column.id}
                </DropdownMenuCheckboxItem>
                );
            })}
           </DropdownMenuSubContent>
        </DropdownMenuSub>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
