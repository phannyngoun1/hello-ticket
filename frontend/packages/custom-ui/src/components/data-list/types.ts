/**
 * Data List Component Types
 * 
 * Generic data list component for displaying items in a grid layout
 */

import React from "react";

/**
 * Generic item interface - items must have at least an id and name
 */
export interface DataListItem {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

/**
 * Stats configuration for displaying metadata
 */
export interface StatConfig<T = any> {
  key: string;
  label: string;
  value: (item: T) => string | number;
  show?: boolean;
}

/**
 * Badge configuration for displaying status indicators
 */
export interface BadgeConfig<T = any> {
  key: string;
  label: string;
  condition: (item: T) => boolean;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

/**
 * Props for the DataList component
 */
export interface DataListProps<T extends DataListItem> {
  /** Additional CSS classes */
  className?: string;
  
  /** Array of items to display */
  items?: T[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: Error | null;
  
  /** Enable search functionality */
  searchable?: boolean;
  
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  
  /** Title shown in header */
  title?: string;
  
  /** Description/subtitle shown in header */
  description?: string;
  
  /** Stats configuration for displaying metadata */
  stats?: StatConfig<T>[];
  
  /** Badges configuration for status indicators */
  badges?: BadgeConfig<T>[];
  
  /** Show action buttons */
  showActions?: boolean;
  
  /** Show create button */
  showCreateButton?: boolean;
  
  /** Create button label (supports ReactNode for icons) */
  createButtonLabel?: string | React.ReactNode;
  
  /** Called when create button is clicked */
  onCreate?: () => void;
  
  /** Called when an item is clicked */
  onItemClick?: (item: T) => void;
  
  /** Called when edit button is clicked */
  onEdit?: (item: T) => void;
  
  /** Called when delete button is clicked */
  onDelete?: (item: T) => void;
  
  /** Called when search input changes */
  onSearch?: (query: string) => void;
  
  /** Custom action buttons renderer */
  customActions?: (item: T) => React.ReactNode;
  
  /** Custom item renderer */
  renderItem?: (item: T) => React.ReactNode;
  
  /** Loading message */
  loadingMessage?: string;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Error message override */
  errorMessage?: string;
  
  /** Grid columns configuration */
  gridCols?: {
    default?: number;
    md?: number;
    lg?: number;
  };

  /** View mode: 'card' for grid/card view, 'list' for list view */
  viewMode?: "card" | "list";

  /** Default view mode */
  defaultViewMode?: "card" | "list";

  /** Called when view mode changes */
  onViewModeChange?: (viewMode: "card" | "list") => void;
}

