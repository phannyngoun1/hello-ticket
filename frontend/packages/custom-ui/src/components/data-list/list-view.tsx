import React from "react";
import { Badge } from "@truths/ui";
import { Button } from "@truths/ui";
import { Edit, Trash2} from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { DataListItem, BadgeConfig, StatConfig } from "./types";

interface ListViewProps<T extends DataListItem> {
  items: T[];
  renderItem?: (item: T) => React.ReactNode;
  showActions?: boolean;
  customActions?: (item: T) => React.ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onItemClick?: (item: T) => void;
  badges?: BadgeConfig<T>[];
  stats?: StatConfig<T>[];
}

export function ListView<T extends DataListItem>({
  items,
  renderItem,
  showActions,
  customActions,
  onEdit,
  onDelete,
  onItemClick,
  badges = [],
  stats = [],
}: ListViewProps<T>) {

  return (
    <div className="space-y-3">
      {items.map((item) => {
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
                          <div
                            key={stat.key}
                            className="flex items-center gap-1.5"
                          >
                            <span className="text-sm font-semibold text-foreground">
                              {stat.value(item)}
                            </span>
                            <span className="text-xs text-muted-foreground font-normal">
                              {stat.label}
                            </span>
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
  );
}
