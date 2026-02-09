import { useLocation, useNavigate } from "@tanstack/react-router";
import { CustomerGroupListContainer, CustomerGroupProvider } from "@truths/sales";
import { api } from "@truths/api";
import { useDensityStyles } from "@truths/utils";
import { cn } from "@truths/ui/lib/utils";

export function CustomerGroupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const density = useDensityStyles();
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
      <div className={cn("space-y-4", density.spacingFormSection)}>
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

