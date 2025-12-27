/**
 * Action List Component
 *
 * A reusable component that displays action buttons with automatic overflow
 * handling. Actions beyond the visible limit are moved to a "More" dropdown menu.
 */

import React from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@truths/ui";
import { MoreVertical } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import type { ActionListProps } from "./types";

/**
 * ActionList component
 *
 * Displays action buttons with automatic overflow handling. The first N actions
 * (determined by maxVisibleActions) are shown as buttons, and the rest are
 * moved to a "More" dropdown menu.
 *
 * @example
 * ```tsx
 * <ActionList
 *   actions={[
 *     { id: "edit", label: "Edit", icon: <Edit />, onClick: handleEdit },
 *     { id: "delete", label: "Delete", icon: <Trash2 />, onClick: handleDelete, variant: "destructive" },
 *   ]}
 *   maxVisibleActions={2}
 *   customActions={<Button>Custom</Button>}
 * />
 * ```
 */
export function ActionList({
  actions,
  maxVisibleActions = 2,
  customActions,
  className,
  size = "sm",
}: ActionListProps) {
  // Split actions into visible and overflow
  const visibleActions = actions.slice(0, maxVisibleActions);
  const overflowActions = actions.slice(maxVisibleActions);

  // Don't render anything if there are no actions
  if (actions.length === 0 && !customActions) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Visible Action Buttons */}
      {(visibleActions.length > 0 || customActions) && (
        <div className="flex items-center gap-2">
          {visibleActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "default"}
              size={size}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
          {customActions}
        </div>
      )}

      {/* More Actions Menu */}
      {overflowActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {overflowActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export type { ActionListProps, ActionItem } from "./types";

