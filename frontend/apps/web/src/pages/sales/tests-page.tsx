import { useLocation, useNavigate } from "@tanstack/react-router";
import { TestListContainer, TestProvider } from "@truths/sales";
import { api } from "@truths/api";

export function TestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <TestProvider
      config={{
        apiClient: api,
        endpoints: {
          tests: "/api/v1/sales/tests",
        },
      }}
    >
      <div className="space-y-4">
        <TestListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/sales/tests", search: {}})
          }
          onNavigateToTest={(id) =>
            navigate({
              to: "/sales/tests/$id",
              params: { id },
            })
          }
        />
      </div>
    </TestProvider>
  );
}

