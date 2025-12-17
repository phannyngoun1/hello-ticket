import { User, ShoppingCart, FileText } from "lucide-react";
import type { QuickAction } from "@truths/custom-ui";

/**
 * Get app-specific quick actions for the command palette
 * These actions allow users to quickly create new entities
 */
export function getAppQuickActions(
    navigate?: (options: { to: string }) => void
): QuickAction[] {
    return [
        {
            icon: User,
            label: "Add New User",
            value: "action-add-user",
            keywords: ["user", "usr", "people", "person"],
            action: () => {
                if (navigate) {
                    navigate({ to: "/users?action=create" });
                }
            },
        },
        {
            icon: ShoppingCart,
            label: "Add New Customer",
            value: "action-add-customer",
            keywords: ["customer", "cust", "client", "cus"],
            action: () => {
                if (navigate) {
                    navigate({ to: "/sales/customers?action=create" });
                }
            },
        },
    ];
}

