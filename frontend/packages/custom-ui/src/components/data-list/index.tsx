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
import { Card } from "@truths/ui";
import { Button } from "@truths/ui";
import { Input } from "@truths/ui";
import { Badge } from "@truths/ui";
import { LayoutGrid, List, Edit, Trash2, Users, FileText, Database, Plus } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { userPreferences } from "@truths/utils";
import { DataListProps, DataListItem } from "./types";

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
  
  const [internalViewMode, setInternalViewMode] = useState<"card" | "list">(initialViewMode);
  
  // Use controlled viewMode if provided, otherwise use internal state
  const viewMode = controlledViewMode ?? internalViewMode;
  
  // Save to centralized user preferences when view mode changes (only for uncontrolled mode)
  useEffect(() => {
    if (!controlledViewMode && internalViewMode) {
      userPreferences.setDataListView(componentId, internalViewMode);
    }
  }, [internalViewMode, controlledViewMode, componentId]);
  
  const handleViewModeChange = (newViewMode: "card" | "list") => {
    if (!controlledViewMode) {
      setInternalViewMode(newViewMode);
      // Save to centralized user preferences immediately
      userPreferences.setDataListView(componentId, newViewMode);
    }
    onViewModeChange?.(newViewMode);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Helper function to get icon for stat based on key
  const getStatIcon = (statKey: string) => {
    const key = statKey.toLowerCase();
    if (key.includes("user") || key.includes("member")) {
      return <Users className="h-3 w-3 text-muted-foreground" />;
    }
    if (key.includes("permission") || key.includes("access")) {
      return <FileText className="h-3 w-3 text-muted-foreground" />;
    }
    if (key.includes("role") || key.includes("group")) {
      return <Database className="h-3 w-3 text-muted-foreground" />;
    }
    return null;
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
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => handleViewModeChange("list")}
        className="h-8 px-2.5"
        title="List view"
      >
        <List className="h-3.5 w-3.5" />
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
    <Card className={cn("p-4 border-border/60", className)}>
      <div className="space-y-4">
        {/* Header with Title and Subtitle */}
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
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
          {viewToggle}
          {showCreateButton && onCreate && (
            <Button size="sm" onClick={onCreate} className="h-9">
              {typeof createButtonLabel === "string" ? (
                createButtonLabel
              ) : (
                createButtonLabel || "Create"
              )}
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

        {/* Item Cards or List */}
        {!loading && filteredItems.length > 0 && (
          <>
            {viewMode === "card" ? (
              // Card/Grid View
              <div className={gridColsClass}>
                {filteredItems.map((item) => {
                  // Use custom renderer if provided
                  if (renderItem) {
                    return <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>;
                  }

                  // Default card rendering
                  const hasActions = showActions && (customActions || onEdit || onDelete);
                  
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group flex flex-col rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50",
                        onItemClick && "cursor-pointer"
                      )}
                      onClick={() => onItemClick?.(item)}
                    >
                      {/* Main Content */}
                      <div className="flex-1 space-y-3">
                        {/* Item Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="text-sm font-medium text-foreground">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {/* Badges */}
                          {badges.some((badge) => badge.condition(item)) && (
                            <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                              {badges
                                .filter((badge) => badge.condition(item))
                                .map((badge) => (
                                  <Badge
                                    key={badge.key}
                                    variant={badge.variant || "secondary"}
                                    className="text-xs"
                                  >
                                    {badge.label}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Stats & Actions Footer */}
                        {(stats.length > 0 || hasActions) && (
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                            {/* Stats */}
                            {stats.length > 0 && (
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {stats
                                  .filter((stat) => stat.show !== false)
                                  .map((stat, index) => {
                                    const icon = getStatIcon(stat.key);
                                    return (
                                      <div key={stat.key} className="flex items-center gap-1.5">
                                        {icon && <span className="flex-shrink-0">{icon}</span>}
                                        <span className="text-sm font-semibold text-foreground">
                                          {stat.value(item)}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-normal">{stat.label}</span>
                                        {index < stats.filter((s) => s.show !== false).length - 1 && (
                                          <span className="w-px h-3 bg-border/60 mx-0.5" />
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                            
                            {/* Actions */}
                            {hasActions && (
                              <div
                                className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {customActions ? (
                                  customActions(item)
                                ) : (
                                  <>
                                    {onEdit && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(item)}
                                        className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                        title="Edit"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    {onDelete && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete(item)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // List View
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  // Use custom renderer if provided
                  if (renderItem) {
                    return <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>;
                  }

                  // Default list rendering
                  const hasActions = showActions && (customActions || onEdit || onDelete);
                  
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50",
                        onItemClick && "cursor-pointer"
                      )}
                      onClick={() => onItemClick?.(item)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left side: Name, Description, Badges */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground">
                              {item.name}
                            </h4>
                            {/* Render badges */}
                            {badges.some((badge) => badge.condition(item)) && (
                              <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                                {badges
                                  .filter((badge) => badge.condition(item))
                                  .map((badge) => (
                                    <Badge
                                      key={badge.key}
                                      variant={badge.variant || "secondary"}
                                      className="text-xs"
                                    >
                                      {badge.label}
                                    </Badge>
                                  ))}
                              </div>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          {/* Stats & Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                            {/* Stats */}
                            {stats.length > 0 && (
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {stats
                                  .filter((stat) => stat.show !== false)
                                  .map((stat) => (
                                    <div key={stat.key} className="flex items-center gap-1.5">
                                      <span className="text-sm font-semibold text-foreground">
                                        {stat.value(item)}
                                      </span>
                                      <span className="text-xs text-muted-foreground font-normal">{stat.label}</span>
                                    </div>
                                  ))}
                              </div>
                            )}
                            {/* Actions */}
                            {hasActions && (
                              <div
                                className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {customActions ? (
                                  customActions(item)
                                ) : (
                                  <>
                                    {onEdit && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(item)}
                                        className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                                        title="Edit"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    {onDelete && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete(item)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

