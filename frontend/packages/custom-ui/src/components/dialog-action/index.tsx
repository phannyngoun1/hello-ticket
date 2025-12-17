/**
 * Dialog Action Component
 *
 * Wrapper component for dialog action buttons with built-in density support.
 * Use this instead of plain Button components in dialog footers for consistent styling.
 */

import React from "react";
import { Button, ButtonProps, cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";

export interface DialogActionProps extends Omit<ButtonProps, "className"> {
  className?: string;
}

/**
 * DialogAction - A button component for dialog actions with built-in density support
 *
 * Automatically applies density-aware styles (height, padding, text size).
 * Use this for any action button in dialog footers (cancel, submit, confirm, etc.).
 *
 * @example
 * ```tsx
 * <DialogAction
 *   variant="default"
 *   onClick={handleConfirm}
 *   disabled={loading}
 * >
 *   Confirm
 * </DialogAction>
 * 
 * <DialogAction
 *   variant="outline"
 *   onClick={handleCancel}
 * >
 *   Cancel
 * </DialogAction>
 * ```
 */
export const DialogAction = React.forwardRef<HTMLButtonElement, DialogActionProps>(
  ({ className, ...props }, ref) => {
    const density = useDensityStyles();

    return (
      <Button
        ref={ref}
        className={cn(
          density.buttonHeightSmall,
          density.paddingCell,
          density.textSizeSmall,
          "font-medium",
          className
        )}
        {...props}
      />
    );
  }
);
DialogAction.displayName = "DialogAction";

