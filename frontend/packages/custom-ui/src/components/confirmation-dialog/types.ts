import { ReactNode } from 'react';

/**
 * Configuration for a confirmation dialog action button
 */
export interface ConfirmationDialogAction {
  /** Label text for the button */
  label: string;
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button shows a loading state */
  loading?: boolean;
  /** Click handler for the button */
  onClick?: () => void | Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the ConfirmationDialog component
 */
export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string | ReactNode;
  /** Dialog description/content */
  description?: string | ReactNode;
  /** Configuration for the confirm/primary action button */
  confirmAction?: ConfirmationDialogAction;
  /** Configuration for the cancel/secondary action button */
  cancelAction?: ConfirmationDialogAction;
  /** Custom footer content (if provided, overrides default actions) */
  footer?: ReactNode;
  /** Additional CSS classes for the dialog content */
  className?: string;
  /** Additional CSS classes for the header */
  headerClassName?: string;
  /** Additional CSS classes for the footer */
  footerClassName?: string;
  /** Override density mode. If undefined, uses user preference. true = compact, false = normal */
  compact?: boolean;
}

