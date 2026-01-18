import { type ReactNode } from "react";
import { Check, ListFilter } from "lucide-react";
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
  items?: string[];
  selectedItems?: Set<string>;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onToggleItem?: (item: string) => void;
  onClear?: () => void;
  label?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  clearLabel?: string;
  buttonClassName?: string;
  popoverContentClassName?: string;
  maxLabelLength?: number;
  badgeCount?: number;
  children?: ReactNode;
  align?: "start" | "center" | "end";
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
  badgeCount,
  children,
  align = "start",
}: FilterPopoverProps) {
  const hasCustomContent = !!children;
  const selectedCount = badgeCount ?? selectedItems?.size ?? 0;
  const triggerLabel =
    hasCustomContent || selectedCount === 0
      ? label
      : selectedCount === 1
        ? (() => {
            const selected = Array.from(selectedItems ?? [])[0] ?? "";
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
          className={cn(
            "h-8 gap-2 px-4 shadow-sm border-dashed",
            buttonClassName
          )}
        >
          <ListFilter className="h-4 w-4" />
          {triggerLabel}
          {selectedCount > 0 && (
            <div className="bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 grid place-items-center ml-1 font-bold">
              {selectedCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          hasCustomContent ? "p-0" : "w-[250px] p-0",
          popoverContentClassName
        )}
        align={align}
      >
        {hasCustomContent ? (
          children
        ) : (
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery ?? ""}
              onValueChange={onSearchQueryChange ?? (() => {})}
            />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {(items ?? []).map((item) => {
                  const isSelected = selectedItems?.has(item) ?? false;
                  return (
                    <CommandItem
                      key={item}
                      onSelect={() => onToggleItem?.(item)}
                    >
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
              {selectedCount > 0 && onClear && (
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
        )}
      </PopoverContent>
    </Popover>
  );
}
