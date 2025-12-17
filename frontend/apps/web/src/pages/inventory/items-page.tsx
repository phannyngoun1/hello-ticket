import { useNavigate, useLocation } from "@tanstack/react-router";
import { ItemProvider, InventoryManagementPage } from "@truths/inventory";
import { api } from "@truths/api";

export function ItemsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  // Determine default tab from URL query params
  const defaultTab =
    (searchParams.get("tab") as "items" | "categories" | null) || "items";

  return (
    <div className="space-y-4">
      <InventoryManagementPage
        autoOpenCreate={autoOpenCreate}
        defaultTab={defaultTab}
        onCreateDialogClose={() =>
          navigate({ to: "/inventory/items", search: {} })
        }
        onItemClick={(itemId) =>
          navigate({ to: "/inventory/items/$id", params: { id: itemId } })
        }
        onCategoryClick={(category) => {
          // Optional: Navigate to category detail if you create that route
          // For now, we'll just stay on the categories tab
        }}
      />
    </div>
  );
}
