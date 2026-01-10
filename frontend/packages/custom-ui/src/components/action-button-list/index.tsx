/**
 * Action Button List Component
 *
 * A reusable component for displaying action buttons in list items,
 * typically shown on hover with fade-in animation.
 */

import { cn } from "@truths/ui/lib/utils";
import type { ActionButtonListProps } from "./types";

/**
 * ActionButtonList component
 *
 * Displays action buttons for list items with hover effects.
 * Supports both custom actions via render prop and built-in action configurations.
 *
 * @example
 * ```tsx
 * // Using built-in actions
 * <ActionButtonList
 *   item={event}
 *   actions={[
 *     {
 *       id: "edit",
 *       icon: <Edit className="h-3.5 w-3.5" />,
 *       title: "Edit",
 *       onClick: (item) => handleEdit(item),
 *       show: true,
 *     },
 *     {
 *       id: "delete",
 *       icon: <Trash2 className="h-3.5 w-3.5" />,
 *       title: "Delete",
 *       onClick: (item) => handleDelete(item),
 *       className: "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
 *       show: true,
 *     },
 *   ]}
 * />
 *
 * // Using custom actions
 * <ActionButtonList
 *   item={event}
 *   customActions={(item) => (
 *     <>
 *       <button onClick={() => handleEdit(item)}>Edit</button>
 *       <button onClick={() => handleDelete(item)}>Delete</button>
 *     </>
 *   )}
 * />
 * ```
 */
export function ActionButtonList<T = any>({
  item,
  customActions,
  actions = [],
  className,
  size = "sm",
  showOnHover = true,
}: ActionButtonListProps<T>) {
  // Don't render anything if no actions are available
  const hasCustomActions = customActions;
  const visibleActions = actions.filter(action => action.show !== false);

  if (!hasCustomActions && visibleActions.length === 0) {
    return null;
  }

  const buttonSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        showOnHover && "opacity-0 group-hover:opacity-100 transition-opacity",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {customActions ? (
        customActions(item)
      ) : (
        visibleActions.map((action) => (
          <button
            key={action.id}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(item);
            }}
            className={cn(
              `${buttonSize} p-0 rounded-md hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center`,
              action.className
            )}
            title={action.title}
          >
            <span className={`flex items-center [&_svg]:${iconSize}`}>
              {action.icon}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

export type { ActionButtonListProps, ActionButtonItem } from "./types";