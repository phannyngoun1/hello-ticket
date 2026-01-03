import { User, ShoppingCart, FileText, RotateCcw } from "lucide-react";
import type { QuickAction } from "@truths/custom-ui";
import { cacheManager } from "@truths/utils";
import { clearPersistedQueryCache } from "../../providers/query-provider";

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
        {
            icon: RotateCcw,
            label: "Invalidate Query Cache",
            value: "action-invalidate-cache",
            keywords: ["cache", "clear", "invalidate", "refresh", "reset"],
            action: () => {
                // Clear React Query in-memory cache
                if (cacheManager.queryClient) {
                    cacheManager.queryClient.clear();
                }
                // Clear React Query persisted cache (fire and forget)
                clearPersistedQueryCache().catch((error) => {
                    console.error("Failed to clear persisted query cache:", error);
                });
            },
        },
    ];
}

