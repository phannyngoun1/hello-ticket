/**
 * Full Screen Dialog Component Types
 */

import { ReactNode, RefObject } from "react";
import { ButtonProps } from "@truths/ui";

export interface KeyboardShortcut {
  /** Label/description of what the shortcut does */
  label: string;
  /** The key or key combination (e.g., "Enter", "Delete") */
  keys: string[];
  /** Whether Ctrl/Cmd modifier is required */
  metaOrCtrl?: boolean;
  /** Whether Shift modifier is required */
  shift?: boolean;
}

/**
 * Configuration for a dialog action button
 */
export interface DialogActionConfig {
  /** Label text for the button */
  label: string;
  /** Button variant */
  variant?: ButtonProps["variant"];
  /** Button type */
  type?: "button" | "submit" | "reset";
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler for the button */
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional CSS classes */
  className?: string;
}

export interface FullScreenDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Called when the dialog should be closed */
  onClose: () => void;

  /** Title displayed in the header */
  title: string;

  /** Dialog content (usually a form) */
  children: ReactNode;

  /** Footer content - can be an array of action configurations or a ReactNode */
  footer?: ReactNode | DialogActionConfig[];

  /** Maximum width of the content area (default: "800px") */
  maxWidth?: string;

  /** Show a Clear button in the footer */
  showClearButton?: boolean;

  /** Show a Cancel button in the footer */
  showCancelButton?: boolean;

  /** Show a Submit button in the footer */
  showSubmitButton?: boolean;

  /** Called when Clear button is clicked */
  onClear?: () => void;

  /** Called when Cancel button is clicked */
  onCancel?: () => void;

  /** Loading state - disables interactions */
  loading?: boolean;

  /** Additional className for the dialog container */
  className?: string;

  /** Additional className for the content area */
  contentClassName?: string;

  /** Custom keyboard shortcuts to display hints for */
  shortcuts?: KeyboardShortcut[];

  /** Show keyboard shortcuts hint (default: true) */
  showShortcutsHint?: boolean;

  /** Form element selector (CSS selector string) or ref to find the form for auto-submit */
  formSelector?: string | RefObject<HTMLFormElement>;

  /** Callback called when form should be submitted (via Cmd/Ctrl+Enter or auto-submit) */
  onSubmit?: () => void;

  /** Enable automatic Cmd/Ctrl+Enter shortcut for form submission (default: false) */
  autoSubmitShortcut?: boolean;

  /** Enable automatic Shift+Cmd/Ctrl+Delete/Backspace shortcut for form clearing (default: false) */
  autoClearShortcut?: boolean;

  /** Custom Escape key handler. If provided, takes over Escape handling (prevents default close) */
  onEscape?: (e: KeyboardEvent) => void;

  /** Prevent Escape key from closing the dialog (default: false) */
  preventEscClose?: boolean;
}

