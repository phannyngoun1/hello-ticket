/**
 * Full Screen Dialog Component
 *
 * Reusable full-screen dialog for complex forms and data entry
 * Features:
 * - Full-screen overlay with backdrop
 * - Fixed header with title and close button
 * - Scrollable content area
 * - Fixed footer with action buttons
 * - Keyboard shortcuts support
 * - Auto-focus management
 */

import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button, Kbd, cn } from "@truths/ui";
import { useDensityStyles, useIsCompact } from "@truths/utils";
import { X, Keyboard } from "lucide-react";
import {
  FullScreenDialogProps,
  KeyboardShortcut,
  DialogActionConfig,
} from "./types";

/**
 * Detects if the user is on macOS
 */
function isMac(): boolean {
  if (typeof window === "undefined") return false;
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
}

/**
 * Renders a keyboard shortcut key badge using Kbd component from @truths/ui
 */
function KeyBadge({ children }: { children: React.ReactNode }) {
  return <Kbd>{children}</Kbd>;
}

/**
 * Renders a keyboard shortcut hint
 */
function ShortcutHint({ shortcut }: { shortcut: KeyboardShortcut }) {
  const isMacOS = isMac();
  const density = useDensityStyles();

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-muted-foreground flex-shrink-0",
        density.textSizeSmall
      )}
    >
      <span className="text-muted-foreground whitespace-nowrap">
        {shortcut.label}:
      </span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {shortcut.metaOrCtrl && <KeyBadge>{isMacOS ? "⌘" : "Ctrl"}</KeyBadge>}
        {shortcut.shift && <KeyBadge>Shift</KeyBadge>}
        {shortcut.keys.map((key, index) => (
          <KeyBadge key={index}>
            {key === "Enter"
              ? "↵"
              : key === "Delete"
                ? "⌫"
                : key === "Backspace"
                  ? "⌫"
                  : key === "Escape"
                    ? "Esc"
                    : key}
          </KeyBadge>
        ))}
      </div>
    </div>
  );
}

export function FullScreenDialog({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "800px",
  showClearButton = true,
  showCancelButton = true,
  showSubmitButton = true,
  loading = false,
  onSubmit,
  onClear,
  onCancel,
  className,
  contentClassName,
  shortcuts = [],
  showShortcutsHint = true,
  formSelector,
  autoSubmitShortcut = true,
  autoClearShortcut = true,
  onEscape,
  preventEscClose = false,
}: FullScreenDialogProps) {
  const density = useDensityStyles();
  const isCompact = useIsCompact();
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if footer is an array of DialogActionConfig
  const isFooterArray = Array.isArray(footer);
  const footerActions = isFooterArray ? footer : null;
  const footerNode = !isFooterArray ? footer : null;

  // Helper function to submit the form (memoized to avoid recreating)
  const handleFormSubmit = useCallback(() => {
    if (onSubmit) {
      onSubmit();
      return;
    }

    // Try to find and submit the form
    let form: HTMLFormElement | null = null;

    if (!formSelector) {
      // Auto-detect: find first form in content
      if (contentRef.current) {
        form = contentRef.current.querySelector("form");
      }
    } else if (typeof formSelector === "object" && "current" in formSelector) {
      // If formSelector is a ref
      form = formSelector.current;
    } else if (typeof formSelector === "string") {
      // If formSelector is a string (CSS selector)
      form = document.querySelector<HTMLFormElement>(formSelector);
    }

    if (form) {
      form.requestSubmit();
    }
  }, [onSubmit, formSelector]);

  // Build shortcut hints list
  const defaultShortcuts: KeyboardShortcut[] = preventEscClose
    ? []
    : [
        {
          label: "Close",
          keys: ["Escape"],
        },
      ];

  const autoShortcuts: KeyboardShortcut[] = [];
  if (autoSubmitShortcut || onSubmit) {
    autoShortcuts.push({
      label: "Submit",
      keys: ["Enter"],
      metaOrCtrl: true,
    });
  }
  if (autoClearShortcut && onClear) {
    autoShortcuts.push({
      label: "Clear",
      keys: ["Delete"],
      metaOrCtrl: true,
      shift: true,
    });
  }

  const allShortcuts = [
    ...defaultShortcuts,
    ...autoShortcuts,
    ...(shortcuts || []),
  ];

  // Comprehensive keyboard shortcuts handler
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes (or custom handler)
      if (e.key === "Escape") {
        if (preventEscClose) {
          // Prevent ESC from closing
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (onEscape) {
          // Custom handler takes over - prevent default close
          onEscape(e);
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        // Default behavior: close dialog
        e.preventDefault();
        if (!loading) {
          onClose();
        }
        return;
      }

      // Cmd/Ctrl + Enter submits (if auto-submit is enabled or onSubmit is provided)
      if (autoSubmitShortcut || onSubmit) {
        if (
          (e.key === "Enter" || e.code === "Enter") &&
          (e.metaKey || e.ctrlKey) &&
          !e.shiftKey
        ) {
          e.preventDefault();
          if (!loading) {
            handleFormSubmit();
          }
          return;
        }
      }

      // Shift + Cmd/Ctrl + Delete/Backspace clears (if auto-clear is enabled)
      if (autoClearShortcut && onClear) {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
          const isDel = e.key === "Delete" || e.code === "Delete";
          const isBackspace = e.key === "Backspace" || e.code === "Backspace";
          if (isDel || isBackspace) {
            e.preventDefault();
            if (!loading) {
              onClear();
            }
            return;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    loading,
    onClose,
    autoSubmitShortcut,
    autoClearShortcut,
    onClear,
    handleFormSubmit,
    onEscape,
    preventEscClose,
  ]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed !top-0 !left-0 !right-0 !bottom-0 z-50 bg-background/80 backdrop-blur-sm !m-0 !p-0"
      style={{
        margin: 0,
        padding: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 bottom-0 z-50 h-screen w-screen bg-background"
        style={{
          margin: 0,
          padding: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <div className={`flex flex-col h-full ${className || ""}`}>
          {/* Header */}
          <div className="flex-shrink-0 border-b bg-background w-full">
            <div className="flex items-center justify-between gap-2 px-4 py-2">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 hover:bg-accent flex-shrink-0"
                disabled={loading}
                title="Close (Esc)"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto bg-muted/30">
            <div
              ref={contentRef}
              className={`mx-auto w-full ${contentClassName || ""}`}
              style={{ maxWidth, marginTop: "8px" }}
            >
              {children}
            </div>
          </div>

          {/* Footer */}
          {footerNode
            ? footerNode
            : (footerActions ||
                showClearButton ||
                showCancelButton ||
                showSubmitButton) && (
                <div className="flex-shrink-0 border-t bg-background">
                  <div className={cn(isCompact ? "px-4" : "px-6", "py-3")}>
                    <div
                      className={cn(
                        "flex items-center justify-between max-w-4xl mx-auto",
                        density.gapButtonGroup
                      )}
                    >
                      {/* Keyboard Shortcuts Hint - Left side */}
                      {showShortcutsHint && allShortcuts.length > 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50">
                          <Keyboard
                            className={cn(
                              "text-muted-foreground flex-shrink-0",
                              density.iconSizeSmall
                            )}
                          />
                          <div className="flex items-center gap-1 flex-wrap">
                            {allShortcuts.map((shortcut, index) => (
                              <React.Fragment key={index}>
                                <ShortcutHint shortcut={shortcut} />
                                {index < allShortcuts.length - 1 && (
                                  <span
                                    className={cn(
                                      "text-muted-foreground/50 flex-shrink-0 mx-0.5",
                                      density.textSizeSmall
                                    )}
                                  >
                                    •
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Action buttons - Right side */}
                      <div className={cn("flex", density.gapButtonGroup)}>
                        {footerActions ? (
                          footerActions.map((action, index) => (
                            <Button
                              key={index}
                              type={action.type || "button"}
                              variant={action.variant || "default"}
                              onClick={action.onClick}
                              disabled={action.disabled ?? loading}
                              className={cn(
                                density.buttonHeightSmall,
                                density.textSizeSmall,
                                "px-3 font-medium border-border hover:bg-muted",
                                action.className
                              )}
                            >
                              {action.label}
                            </Button>
                          ))
                        ) : (
                          <>
                            {showClearButton && onClear && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={onClear}
                                disabled={loading}
                                className={cn(
                                  density.buttonHeightSmall,
                                  density.textSizeSmall,
                                  "px-3 font-medium border-border hover:bg-muted"
                                )}
                              >
                                Clear
                              </Button>
                            )}

                            {showCancelButton && onCancel && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={loading}
                                className={cn(
                                  density.buttonHeightSmall,
                                  density.textSizeSmall,
                                  "px-3 font-medium border-border hover:bg-muted"
                                )}
                              >
                                Cancel
                              </Button>
                            )}

                            {showSubmitButton && onSubmit && (
                              <Button
                                type="submit"
                                variant="default"
                                onClick={(e) => {
                                  e?.preventDefault();
                                  onSubmit();
                                }}
                                disabled={loading}
                                className={cn(
                                  density.buttonHeightSmall,
                                  density.textSizeSmall,
                                  "px-3 font-medium border-border hover:bg-muted",
                                  loading && "cursor-not-allowed"
                                )}
                              >
                                Submit
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Export types
export type { FullScreenDialogProps } from "./types";
