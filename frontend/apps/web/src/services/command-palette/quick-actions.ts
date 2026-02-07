import {
  User,
  ShoppingCart,
  RotateCcw,
  UserRound,
  Ticket,
  Film,
  Building2,
  Store,
} from "lucide-react";
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
            icon: UserRound,
            label: "Add New Employee",
            value: "action-add-employee",
            keywords: ["employee", "emp", "staff", "worker"],
            action: () => {
                if (navigate) {
                    navigate({ to: "/sales/employees?action=create" });
                }
            },
        },
        {
            icon: Ticket,
            label: "Add New Booking",
            value: "action-add-booking",
            keywords: ["booking", "book", "reservation", "order"],
            action: () => {
                if (navigate) {
                    navigate({ to: "/sales/bookings?action=create" });
                }
            },
        },
        {
            icon: Film,
            label: "Add New Show",
            value: "action-add-show",
            keywords: ["show", "event", "concert"],
            action: () => {
                if (navigate) {
                    navigate({ to: "/ticketing/shows?action=create" });
                }
            },
        },
        {
            icon: Building2,
            label: "Add New Venue",
            value: "action-add-venue",
            keywords: ["venue", "location", "place", "theater"],
            action: () => {
                if (navigate) {
                    navigate({ to: "/ticketing/venues?action=create" });
                }
            },
        },
        {
            icon: Store,
            label: "Add New Organizer",
            value: "action-add-organizer",
            keywords: ["organizer", "org", "promoter"],
            action: () => {
                if (navigate) {
                    navigate({ to: "/ticketing/organizers?action=create" });
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

