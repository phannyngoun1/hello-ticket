import { useLocation, useNavigate } from "@tanstack/react-router";
import { TestTreeListContainer, TestTreeProvider } from "@truths/sales";
import { api } from "@truths/api";

export function TestTreePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <TestTreeProvider
      config={{
        apiClient: api,
        endpoints: {
          testTrees: "/api/v1/sales/test-trees",
        },
      }}
    >
      <div className="space-y-4">
        <TestTreeListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/settings/sales/test-trees", search: {}})
          }
        />
      </div>
    </TestTreeProvider>
  );
}

