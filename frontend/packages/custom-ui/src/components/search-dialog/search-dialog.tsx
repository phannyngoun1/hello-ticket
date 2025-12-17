/**
 * Generic Search Dialog Component
 *
 * A reusable searchable dialog component for selecting items from a list.
 * Features keyboard navigation, debounced search, and customizable rendering.
 *
 * @author Phanny
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Search } from "lucide-react";
import type { SearchDialogProps } from "./types";

export function SearchDialog<T>({
  open,
  onOpenChange,
  onSelect,
  onSearch,
  excludeItems = [],
  getItemId,
  renderItem,
  title = "Search",
  description = "Search and select an item. Use arrow keys to navigate and Enter to select.",
  placeholder = "Search...",
  emptyStateMessage = "Start typing to search...",
  noResultsMessage = 'No items found matching "{query}"',
  debounceMs = 300,
  maxListHeight = "400px",
}: SearchDialogProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Compute filtered items
  const filteredItems = useMemo(() => {
    if (excludeItems.length === 0) {
      return items;
    }
    const excludeIds = new Set(excludeItems.map(getItemId));
    return items.filter((item) => !excludeIds.has(getItemId(item)));
  }, [items, excludeItems, getItemId]);

  // Handle item selection
  const handleSelect = useCallback(
    (item: T) => {
      onSelect(item);
      onOpenChange(false);
      setSearchQuery("");
      setItems([]);
      setSelectedIndex(0);
    },
    [onSelect, onOpenChange]
  );

  // Debounced search
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setItems([]);
      setSelectedIndex(0);
      return;
    }

    // Focus search input when dialog opens
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length === 0) {
        setItems([]);
        return;
      }

      setLoading(true);
      setError(null);
      onSearch(searchQuery.trim())
        .then((results) => {
          setItems(results);
          setSelectedIndex(0);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, open, onSearch, debounceMs]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredItems.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredItems[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredItems, selectedIndex, onOpenChange, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-sm text-destructive">
              Error: {error.message}
            </div>
          )}

          {!loading && !error && searchQuery.trim().length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {emptyStateMessage}
            </div>
          )}

          {!loading &&
            !error &&
            searchQuery.trim().length > 0 &&
            filteredItems.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {noResultsMessage.replace("{query}", searchQuery)}
              </div>
            )}

          {!loading && !error && filteredItems.length > 0 && (
            <div
              ref={listRef}
              className="overflow-y-auto border rounded-md divide-y"
              style={{ maxHeight: maxListHeight }}
            >
              {filteredItems.map((item, index) => (
                <button
                  key={getItemId(item)}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-muted transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    index === selectedIndex && "bg-muted"
                  )}
                >
                  {renderItem(item, index === selectedIndex)}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
