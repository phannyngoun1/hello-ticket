import { useLocation, useNavigate } from "@tanstack/react-router";
import { EmployeeListContainer, EmployeeProvider } from "@truths/sales";
import { api } from "@truths/api";

export function EmployeePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <EmployeeProvider
      config={{
        apiClient: api,
        endpoints: {
          employees: "/api/v1/sales/employees",
        },
      }}
    >
      <div className="space-y-4">
        <EmployeeListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/sales/employees", search: {}})
          }
          onNavigateToEmployee={(id) =>
            navigate({
              to: "/sales/employees/$id",
              params: { id },
            })
          }
        />
      </div>
    </EmployeeProvider>
  );
}

