import { useLocation, useNavigate } from "@tanstack/react-router";
import { TestBasicListContainer, TestBasicProvider } from "@truths/sales";
import { api } from "@truths/api";

export function TestBasicPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <TestBasicProvider
      config={{
        apiClient: api,
        endpoints: {
          testBasics: "/api/v1/sales/test-basics",
        },
      }}
    >
      <div className="space-y-4">
        <TestBasicListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/settings/sales/test-basics", search: {}})
          }
        />
      </div>
    </TestBasicProvider>
  );
}

