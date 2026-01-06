/**
 * Data List Component
 *
 * Generic, reusable data grid component for displaying items
 * Features:
 * - Search functionality
 * - Loading states
 * - Error handling
 * - Empty states
 * - Customizable stats and badges
 * - Responsive grid layout
 * - List and card view modes
 */

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@truths/ui";
import { Input } from "@truths/ui";
import { LayoutGrid, Calendar } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { userPreferences } from "@truths/utils";
import { DataListProps, DataListItem } from "./types";
import { CardView } from "./card-view";
import { ListView } from "./list-view";

export type {
  DataListProps,
  DataListItem,
  StatConfig,
  BadgeConfig,
} from "./types";

export function DataList<T extends DataListItem>({
  className,
  items = [],
  loading = false,
  error = null,
  searchable = true,
  searchPlaceholder = "Search...",
  title,
  description,
  stats = [],
  badges = [],
  showActions = true,
  showCreateButton = false,
  createButtonLabel = "Create",
  onCreate,
  onItemClick,
  onEdit,
  onDelete,
  onSearch,
  customActions,
  renderItem,
  loadingMessage = "Loading...",
  emptyMessage = "No items found",
  errorMessage,
  gridCols = { default: 1, md: 2, lg: 3 },
  viewMode: controlledViewMode,
  defaultViewMode = "card",
  onViewModeChange,
  showViewToggle = true,
  renderCalendarView,
}: DataListProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  // Generate component ID based on context (title or className)
  // Sanitize to ensure it's valid
  const componentId = useMemo(() => {
    const identifier = (title || className || "default")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return identifier;
  }, [title, className]);

  // Load view mode from centralized user preferences on mount
  const initialViewMode = useMemo(() => {
    if (controlledViewMode) {
      return controlledViewMode;
    }
    const cached = userPreferences.getDataListView(componentId);
    return cached || defaultViewMode;
  }, [componentId, defaultViewMode, controlledViewMode]);

  const [internalViewMode, setInternalViewMode] = useState<
    "card" | "list" | "calendar"
  >(initialViewMode as "card" | "list" | "calendar");

  // Use controlled viewMode if provided, otherwise use internal state
  const viewMode = controlledViewMode ?? internalViewMode;

  // Save to centralized user preferences when view mode changes (only for uncontrolled mode)
  useEffect(() => {
    if (
      !controlledViewMode &&
      internalViewMode &&
      internalViewMode !== "calendar"
    ) {
      // Only save card/list to preferences, not calendar
      userPreferences.setDataListView(
        componentId,
        internalViewMode as "card" | "list"
      );
    }
  }, [internalViewMode, controlledViewMode, componentId]);

  const handleViewModeChange = (newViewMode: "card" | "list" | "calendar") => {
    if (!controlledViewMode) {
      setInternalViewMode(newViewMode);
      // Save to centralized user preferences immediately (only for card/list)
      if (newViewMode !== "calendar") {
        userPreferences.setDataListView(
          componentId,
          newViewMode as "card" | "list"
        );
      }
    }
    onViewModeChange?.(newViewMode);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  // View toggle component
  const viewToggle = (
    <div className="flex items-center border border-border/60 rounded-md p-0.5 bg-muted/30">
      <Button
        variant={viewMode === "card" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleViewModeChange("card")}
        className="h-8 px-2.5"
        title="Card view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={viewMode === "calendar" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleViewModeChange("calendar")}
        className="h-8 px-2.5"
        title="Calendar view"
      >
        <Calendar className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // Filter items based on search query
  const filteredItems = searchQuery
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  // Generate grid columns class
  // Map to explicit Tailwind classes for proper tree-shaking
  const gridColMap = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };
  const mdGridColMap = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  };
  const lgGridColMap = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  };

  const gridColsClass = cn(
    "grid gap-4",
    gridCols.default && gridColMap[gridCols.default as keyof typeof gridColMap],
    gridCols.md && mdGridColMap[gridCols.md as keyof typeof mdGridColMap],
    gridCols.lg && lgGridColMap[gridCols.lg as keyof typeof lgGridColMap]
  );

  return (
    
      <div>
        {/* Header with Title and Subtitle */}
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {/* Search, View Toggle, and Create Button */}
        <div className="flex items-center gap-2.5">
          {searchable && (
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9 text-sm flex-1 max-w-sm"
            />
          )}
          {/* View Mode Toggle */}
          {showViewToggle && viewToggle}
          {showCreateButton && onCreate && (
            <Button size="sm" onClick={onCreate} className="h-9">
              {typeof createButtonLabel === "string"
                ? createButtonLabel
                : createButtonLabel || "Create"}
            </Button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {errorMessage || error.message}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">{loadingMessage}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        )}

        {/* Item Cards, List, or Calendar */}
        {!loading && filteredItems.length > 0 && (
          <>
            {viewMode === "calendar" && renderCalendarView ? (
              // Calendar View
              renderCalendarView()
            ) : viewMode === "card" ? (
              // Card/Grid View
              <CardView
                items={filteredItems}
                gridColsClass={gridColsClass}
                renderItem={renderItem}
                showActions={showActions}
                customActions={customActions}
                onEdit={onEdit}
                onDelete={onDelete}
                onItemClick={onItemClick}
                badges={badges}
                stats={stats}
              />
            ) : (
              // List View
              <ListView
                items={filteredItems}
                renderItem={renderItem}
                showActions={showActions}
                customActions={customActions}
                onEdit={onEdit}
                onDelete={onDelete}
                onItemClick={onItemClick}
                badges={badges}
                stats={stats}
              
              />
            )}
          </>
        )}
      </div>
  );
}
