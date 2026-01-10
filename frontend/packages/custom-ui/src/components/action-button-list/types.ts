import { ReactNode } from "react";

/**
 * Built-in action types for ActionButtonList
 */
export interface ActionButtonItem {
  /** Unique identifier for the action */
  id: string;
  /** Icon to display for the action */
  icon: ReactNode;
  /** Tooltip/title for the action */
  title: string;
  /** Click handler - receives the item data */
  onClick: (item: any) => void;
  /** Optional CSS classes for styling */
  className?: string;
  /** Whether the action should be shown */
  show?: boolean;
}

/**
 * Props for ActionButtonList component
 */
export interface ActionButtonListProps<T = any> {
  /** The item data to pass to action handlers */
  item: T;
  /** Custom actions to render instead of built-in actions */
  customActions?: (item: T) => ReactNode;
  /** Built-in actions configuration */
  actions?: ActionButtonItem[];
  /** Additional CSS classes for the container */
  className?: string;
  /** Size of the action buttons */
  size?: "sm" | "default";
  /** Whether to show actions on hover (default: true) */
  showOnHover?: boolean;
}