import { useLocation, useNavigate } from "@tanstack/react-router";
import { CustomerTypeListContainer, CustomerTypeProvider } from "@truths/sales";
import { api } from "@truths/api";
import { useDensityStyles } from "@truths/utils";
import { cn } from "@truths/ui/lib/utils";

export function CustomerTypePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const density = useDensityStyles();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <CustomerTypeProvider
      config={{
        apiClient: api,
        endpoints: {
          customerTypes: "/api/v1/sales/customer-types",
        },
      }}
    >
      <div className={cn("space-y-4", density.spacingFormSection)}>
        <CustomerTypeListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/settings/sales/customer-types", search: {}})
          }
        />
      </div>
    </CustomerTypeProvider>
  );
}

