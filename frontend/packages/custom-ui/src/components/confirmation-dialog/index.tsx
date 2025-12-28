/**
 * Confirmation Dialog Component
 *
 * A reusable confirmation dialog component that provides a consistent
 * interface for confirmation actions across the application.
 *
 * Supports custom title, description, and action buttons with flexible configuration.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@truths/ui";
import { Button, Input, Label, cn } from "@truths/ui";
import { useDensityStyles, useDensity } from "@truths/utils";
import { Check, X, Loader2, Trash2 } from "lucide-react";
import type { ConfirmationDialogProps } from "./types";

/**
 * ConfirmationDialog component
 *
 * A flexible confirmation dialog that supports custom actions and content.
 *
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Item"
 *   description="Are you sure you want to delete this item? This action cannot be undone."
 *   confirmAction={{
 *     label: "Delete",
 *     variant: "destructive",
 *     onClick: handleDelete,
 *     loading: isDeleting
 *   }}
 *   cancelAction={{
 *     label: "Cancel",
 *     onClick: () => setIsOpen(false)
 *   }}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmAction,
  cancelAction,
  footer,
  className,
  headerClassName,
  footerClassName,
  confirmText,
  confirmTextLabel = "Type to confirm",
  confirmTextPlaceholder,
}: ConfirmationDialogProps) {
  const [confirmTextValue, setConfirmTextValue] = useState("");
  const confirmTextInputId = useId();

  // Reset confirmation text when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmTextValue("");
    }
  }, [open]);
  const handleCancel = () => {
    if (cancelAction?.onClick) {
      const result = cancelAction.onClick();
      if (result instanceof Promise) {
        result.finally(() => {
          if (!cancelAction.disabled) {
            onOpenChange(false);
          }
        });
      } else {
        if (!cancelAction.disabled) {
          onOpenChange(false);
        }
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    if (confirmAction?.onClick) {
      const result = confirmAction.onClick();
      // If it's a Promise, don't auto-close - let the parent handle closing
      // If it's sync, the parent typically handles closing too for consistency
      // Parents should call onOpenChange(false) when done
      if (!(result instanceof Promise) && !confirmAction.disabled) {
        // For sync actions without a Promise, auto-close if not disabled
        onOpenChange(false);
      }
    } else {
      // No action handler, just close
      onOpenChange(false);
    }
  };

  const defaultCancelAction: ConfirmationDialogProps["cancelAction"] = {
    label: "Cancel",
    variant: "outline",
    onClick: handleCancel,
    ...cancelAction,
  };

  // Check if confirmation text matches
  const isConfirmTextValid = confirmText
    ? confirmTextValue.toLowerCase() === confirmText.toLowerCase()
    : true;

  const defaultConfirmAction: ConfirmationDialogProps["confirmAction"] = {
    label: "Confirm",
    variant: "default",
    onClick: handleConfirm,
    ...confirmAction,
  };

  // Apply confirmation text validation to disabled state
  const isConfirmDisabled =
    defaultConfirmAction.disabled ||
    defaultConfirmAction.loading ||
    (confirmText ? !isConfirmTextValid : false);

  // Refs to track button elements
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Get density from user preference
  const { isCompact } = useDensity();
  const baseDensity = useDensityStyles();

  // Use base density styles with paddingCell override for buttons
  const density = {
    ...baseDensity,
    // Override paddingCell to include vertical padding for buttons
    paddingCell: isCompact ? "px-2 py-1.5" : "px-3 py-2",
  };

  // Determine icon for confirm button based on type or variant
  const getConfirmIcon = () => {
    if (defaultConfirmAction?.loading) {
      return <Loader2 className={cn(density.iconSizeSmall, "animate-spin")} />;
    }
    if (
      defaultConfirmAction?.type === "delete" ||
      defaultConfirmAction?.variant === "destructive"
    ) {
      return <Trash2 className={density.iconSizeSmall} />;
    }
    return <Check className={density.iconSizeSmall} />;
  };

  // Determine icon for cancel button
  const getCancelIcon = () => {
    if (defaultCancelAction?.loading) {
      return <Loader2 className={cn(density.iconSizeSmall, "animate-spin")} />;
    }
    return <X className={density.iconSizeSmall} />;
  };

  // Handle Enter key to confirm/cancel when dialog is open
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter key (not Cmd/Ctrl+Enter which is handled by parent)
      if (
        e.key === "Enter" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        // Don't handle if it's coming from an input field
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        // Check if focus is on cancel button
        const activeElement = document.activeElement as HTMLElement;
        const isCancelFocused =
          activeElement === cancelButtonRef.current ||
          cancelButtonRef.current?.contains(activeElement) ||
          (activeElement.tagName === "BUTTON" &&
            activeElement.hasAttribute("data-cancel-button")) ||
          (activeElement.closest('[role="alertdialog"]') &&
            activeElement.closest("[data-cancel-button]"));

        // If cancel button is focused, trigger cancel
        if (isCancelFocused && defaultCancelAction) {
          const isCancelDisabled =
            defaultCancelAction.disabled ||
            defaultCancelAction.loading ||
            defaultConfirmAction?.loading;
          if (!isCancelDisabled) {
            e.preventDefault();
            e.stopPropagation();
            handleCancel();
            return;
          }
        }

        // Otherwise, trigger confirm action
        const isDisabled =
          defaultConfirmAction?.disabled || defaultConfirmAction?.loading;
        if (isDisabled) {
          return;
        }

        // Trigger confirm action
        e.preventDefault();
        e.stopPropagation();
        handleConfirm();
      }
    };

    // Use capture phase to handle Enter before parent handlers
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, defaultConfirmAction, defaultCancelAction]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn(density.paddingContainer, className)}>
        <AlertDialogHeader
          className={cn(density.spacingFormItem, headerClassName)}
        >
          <AlertDialogTitle
            className={cn(isCompact ? "text-base" : "text-lg", "font-semibold")}
          >
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription
              className={cn(density.textSizeSmall, "[&>p]:mb-0")}
            >
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {confirmText && (
          <div className={cn(density.spacingFormItem, "px-6")}>
            <Label
              htmlFor={confirmTextInputId}
              className={cn(density.textSizeSmall)}
            >
              {confirmTextLabel}
            </Label>
            <Input
              id={confirmTextInputId}
              type="text"
              value={confirmTextValue}
              onChange={(e) => setConfirmTextValue(e.target.value)}
              placeholder={
                confirmTextPlaceholder || `Type "${confirmText}" to confirm`
              }
              className={cn(density.inputHeight, "mt-1.5")}
              autoFocus
            />
          </div>
        )}
        {footer !== undefined ? (
          <AlertDialogFooter
            className={cn(density.gapButtonGroup, footerClassName)}
          >
            {footer}
          </AlertDialogFooter>
        ) : (
          <AlertDialogFooter
            className={cn(density.gapButtonGroup, footerClassName)}
          >
            {defaultCancelAction && (
              <AlertDialogCancel asChild>
                <Button
                  ref={cancelButtonRef}
                  data-cancel-button="true"
                  variant={defaultCancelAction.variant || "outline"}
                  disabled={
                    defaultCancelAction.disabled ||
                    defaultCancelAction.loading ||
                    defaultConfirmAction?.loading
                  }
                  onClick={handleCancel}
                  className={cn(
                    density.buttonHeightSmall,
                    density.paddingCell,
                    density.textSizeSmall,
                    "font-medium",
                    defaultCancelAction.className
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {getCancelIcon()}
                    <span>
                      {defaultCancelAction.loading
                        ? "Loading..."
                        : defaultCancelAction.label}
                    </span>
                  </span>
                </Button>
              </AlertDialogCancel>
            )}
            {defaultConfirmAction && (
              <AlertDialogAction asChild>
                <Button
                  ref={confirmButtonRef}
                  variant={defaultConfirmAction.variant || "default"}
                  disabled={isConfirmDisabled}
                  onClick={handleConfirm}
                  className={cn(
                    density.buttonHeightSmall,
                    density.paddingCell,
                    density.textSizeSmall,
                    "font-medium",
                    defaultConfirmAction.className
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {getConfirmIcon()}
                    <span>
                      {defaultConfirmAction.loading
                        ? "Loading..."
                        : defaultConfirmAction.label}
                    </span>
                  </span>
                </Button>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type {
  ConfirmationDialogProps,
  ConfirmationDialogAction,
} from "./types";
