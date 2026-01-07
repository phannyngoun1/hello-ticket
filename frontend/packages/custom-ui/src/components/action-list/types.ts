import { ReactNode } from "react";

/**
 * Action item definition for ActionList component
 */
export interface ActionItem {
  /** Unique identifier for the action */
  id: string;
  /** Label text for the action */
  label: string;
  /** Optional icon to display with the action */
  icon?: ReactNode;
  /** Click handler for the action */
  onClick: () => void;
  /** Button variant style */
  variant?:
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
  /** Whether the action is disabled */
  disabled?: boolean;
  /**
   * Controls how the action is displayed.
   * - 'button': Always displayed as a button.
   * - 'dropdown-item': Always displayed in the overflow dropdown menu.
   * - undefined: Automatically determined based on maxVisibleActions.
   */
  display?: "button" | "dropdown-item";
}

/**
 * Props for ActionList component
 */
export interface ActionListProps {
  /** Array of action items to display */
  actions: ActionItem[];
  /** Maximum number of actions to show as buttons before moving to overflow menu */
  maxVisibleActions?: number;
  /** Custom actions to render alongside the action list */
  customActions?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Size of the action buttons */
  size?: "default" | "sm" | "lg" | "icon";
}

