import { useLocation, useNavigate } from "@tanstack/react-router";
import { CustomerGroupListContainer, CustomerGroupProvider } from "@truths/sales";
import { api } from "@truths/api";

export function CustomerGroupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <CustomerGroupProvider
      config={{
        apiClient: api,
        endpoints: {
          customerGroups: "/api/v1/sales/customer-groups",
        },
      }}
    >
      <div className="space-y-4">
        <CustomerGroupListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/settings/sales/customer-groups", search: {}})
          }
        />
      </div>
    </CustomerGroupProvider>
  );
}

