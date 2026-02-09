import React from "react";
import { Badge } from "@truths/ui";
import { Button } from "@truths/ui";
import { Edit, Trash2} from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
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
  const density = useDensityStyles();

  return (
    <div className={density.spacingCard}>
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
              "group rounded-lg border bg-card transition-colors hover:bg-accent/50",
              density.paddingCard,
              onItemClick && "cursor-pointer"
            )}
            onClick={() => onItemClick?.(item)}
          >
            <div className={cn("flex items-start justify-between", density.gapForm)}>
              {/* Left side: Name, Description, Badges */}
              <div className={cn("flex-1 min-w-0", density.spacingFormItem)}>
                <div className={cn("flex items-start justify-between mb-1", density.gapCard)}>
                  <h4 className={cn("font-medium text-foreground", density.textSize)}>
                    {item.name}
                  </h4>
                  {/* Render badges */}
                  {badges.some((badge) => badge.condition(item)) && (
                    <div className={cn("flex items-center flex-wrap flex-shrink-0", density.gapFormItem)}>
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
                  <p className={cn("text-muted-foreground mb-2", density.textSize)}>
                    {item.description}
                  </p>
                )}
                {/* Stats & Actions */}
                <div className={cn("flex flex-wrap items-center justify-between pt-2 border-t border-border/40", density.gapCard)}>
                  {/* Stats */}
                  {stats.length > 0 && (
                    <div className={cn("flex flex-wrap items-center text-muted-foreground", density.gapCard, density.textSizeSmall)}>
                      {stats
                        .filter((stat) => stat.show !== false)
                        .map((stat) => (
                          <div
                            key={stat.key}
                            className={cn("flex items-center", density.gapFormItem)}
                          >
                            <span className={cn("font-semibold text-foreground", density.textSize)}>
                              {stat.value(item)}
                            </span>
                            <span className={cn("text-muted-foreground font-normal", density.textSizeSmall)}>
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
