import * as React from "react";
import { Check, Filter } from "lucide-react";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Separator } from "./separator";
import { cn } from "../lib/utils";

export interface FilterPopoverProps {
  items: string[];
  selectedItems: Set<string>;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onToggleItem: (item: string) => void;
  onClear: () => void;
  label?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  clearLabel?: string;
  buttonClassName?: string;
  popoverContentClassName?: string;
  maxLabelLength?: number;
}

export function FilterPopover({
  items,
  selectedItems,
  searchQuery,
  onSearchQueryChange,
  onToggleItem,
  onClear,
  label = "Filters",
  searchPlaceholder = "Search filters...",
  emptyText = "No results found.",
  clearLabel = "Clear filters",
  buttonClassName,
  popoverContentClassName,
  maxLabelLength = 8,
}: FilterPopoverProps) {
  const selectedCount = selectedItems.size;
  const triggerLabel =
    selectedCount === 0
      ? label
      : selectedCount === 1
        ? (() => {
            const selected = Array.from(selectedItems)[0] ?? "";
            return maxLabelLength > 0
              ? selected.slice(0, maxLabelLength)
              : selected;
          })()
        : `${selectedCount}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 px-2 flex-shrink-0 justify-start gap-1",
            buttonClassName
          )}
        >
          <Filter className="h-3 w-3" />
          <span className="text-[10px] whitespace-nowrap">{triggerLabel}</span>
          {selectedCount > 0 && (
            <Badge
              variant="secondary"
              className="rounded-sm px-0.5 py-0 text-[9px] font-normal h-3 ml-0.5"
            >
              {selectedCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[250px] p-0", popoverContentClassName)}
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={onSearchQueryChange}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const isSelected = selectedItems.has(item);
                return (
                  <CommandItem key={item} onSelect={() => onToggleItem(item)}>
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{item}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedCount > 0 && (
              <>
                <Separator />
                <CommandGroup>
                  <CommandItem
                    onSelect={onClear}
                    className="justify-center text-center"
                  >
                    {clearLabel}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
