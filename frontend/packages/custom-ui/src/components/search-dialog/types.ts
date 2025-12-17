/**
 * Types for the SearchDialog component
 */

export interface SearchDialogProps<T> {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when an item is selected */
  onSelect: (item: T) => void;
  /** Function to fetch/search items */
  onSearch: (query: string) => Promise<T[]>;
  /** Items to exclude from results */
  excludeItems?: T[];
  /** Function to get unique identifier for an item */
  getItemId: (item: T) => string;
  /** Function to render an item in the list */
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Search input placeholder */
  placeholder?: string;
  /** Empty state message when no search query */
  emptyStateMessage?: string;
  /** No results message template (will receive {query} placeholder) */
  noResultsMessage?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Maximum height of the results list */
  maxListHeight?: string;
}
