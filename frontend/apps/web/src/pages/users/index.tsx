import { useRequireAuth } from "../../hooks/use-require-auth";
import { UserManagementPage } from "@truths/account";
import { useNavigate, useLocation } from "@tanstack/react-router";

export function UsersPage() {
  // Check authentication on mount
  useRequireAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  // Determine default tab from URL query params
  const defaultTab =
    (searchParams.get("tab") as "users" | "roles" | "groups" | null) || "users";

  return (
    <div className="space-y-4">
      <UserManagementPage
        autoOpenCreate={autoOpenCreate}
        defaultTab={defaultTab}
        onCreateDialogClose={() => navigate({ to: "/users", search: {} })}
        onUserClick={(userId) =>
          navigate({ to: "/users/$id", params: { id: userId } })
        }
        onRoleClick={(role) => {
          // Optional: Navigate to role detail if you create that route
          // For now, we'll just stay on the roles tab
        }}
        onGroupClick={(group) => {
          // Optional: Navigate to group detail if you create that route
          // For now, we'll just stay on the groups tab
        }}
      />
    </div>
  );
}
