/**
 * Types for Tabs component
 */

import type { LucideIcon } from "lucide-react";

export interface TabItem {
    value: string;
    label: string;
    icon?: LucideIcon;
    disabled?: boolean;
    content?: React.ReactNode;
}

export type TabsVariant = "default" | "underline";

