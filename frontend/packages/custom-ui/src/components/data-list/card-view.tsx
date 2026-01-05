import React from "react";
import { Badge } from "@truths/ui";
import { Button } from "@truths/ui";
import { Edit, Trash2, Users, FileText, Database } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { DataListItem, BadgeConfig, StatConfig } from "./types";

interface CardViewProps<T extends DataListItem> {
  items: T[];
  gridColsClass: string;
  renderItem?: (item: T) => React.ReactNode;
  showActions?: boolean;
  customActions?: (item: T) => React.ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onItemClick?: (item: T) => void;
  badges?: BadgeConfig<T>[];
  stats?: StatConfig<T>[];
}

export function CardView<T extends DataListItem>({
  items,
  gridColsClass,
  renderItem,
  showActions,
  customActions,
  onEdit,
  onDelete,
  onItemClick,
  badges = [],
  stats = [],
}: CardViewProps<T>) {
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

  return (
    <div className={gridColsClass}>
      {items.map((item) => {
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
                            <div
                              key={stat.key}
                              className="flex items-center gap-1.5"
                            >
                              {icon && (
                                <span className="flex-shrink-0">{icon}</span>
                              )}
                              <span className="text-sm font-semibold text-foreground">
                                {stat.value(item)}
                              </span>
                              <span className="text-xs text-muted-foreground font-normal">
                                {stat.label}
                              </span>
                              {index <
                                stats.filter((s) => s.show !== false).length -
                                  1 && (
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
  );
}
