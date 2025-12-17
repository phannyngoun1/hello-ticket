import {
    Home,
    LayoutDashboard,
    Users,
    Settings,
    User,
    FileText,
    Layout,
} from "lucide-react";
import { NavigationItem, QuickAction } from "../types";

/**
 * Detect OS for shortcut display
 */
export function detectOS(): boolean {
    if (typeof navigator === "undefined") return false;
    return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

/**
 * Get shortcut key based on OS
 */
export function getShortcutKey(): string {
    return detectOS() ? "⌘" : "Ctrl";
}

/**
 * Default navigation items
 */
export function getNavigationItems(): NavigationItem[] {
    const shortcutKey = getShortcutKey();

    return [
        {
            icon: Home,
            label: "Home",
            value: "nav-home",
            path: "/",
            shortcut: `${shortcutKey}H`,
        },
        {
            icon: LayoutDashboard,
            label: "Dashboard",
            value: "nav-dashboard",
            path: "/dashboard",
            shortcut: `${shortcutKey}D`,
        },
        {
            icon: Users,
            label: "Users",
            value: "nav-users",
            path: "/users",
            shortcut: `${shortcutKey}U`,
        },
        {
            icon: Settings,
            label: "Settings",
            value: "nav-settings",
            path: "/settings",
            shortcut: `${shortcutKey},`,
        },
    ];
}

/**
 * Default quick actions
 */
export function getQuickActions(navigate?: (options: { to: string }) => void): QuickAction[] {
    return [
        {
            icon: User,
            label: "Add New User",
            value: "action-add-user",
            action: () => {
                if (navigate) {
                    navigate({ to: "/users?action=create" });
                }
                // You can add state here to open a dialog
            },
        },
        {
            icon: FileText,
            label: "View Reports",
            value: "action-reports",
            action: () => {
            },
        },
    ];
}
