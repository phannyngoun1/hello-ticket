import { useLocation, useNavigate } from "@tanstack/react-router";
import { CustomerListContainer } from "@truths/sales";

export function CustomerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <div className="space-y-4">
      <CustomerListContainer
        autoOpenCreate={autoOpenCreate}
        onCreateDialogClose={() =>
          navigate({ to: "/sales/customers", search: {} })
        }
        onNavigateToCustomer={(id: string) =>
          navigate({
            to: "/sales/customers/$id",
            params: { id },
          })
        }
      />
    </div>
  );
}
