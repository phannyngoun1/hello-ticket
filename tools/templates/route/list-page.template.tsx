import { useLocation, useNavigate } from "@tanstack/react-router";
import { {{EntityName}}ListContainer, {{EntityName}}Provider } from "@truths/{{PackageName}}";
import { api } from "@truths/api";

export function {{EntityName}}Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <{{EntityName}}Provider
      config={{
        apiClient: api,
        endpoints: {
          {{ShortPropName}}: "{{ApiEndpoint}}",
        },
      }}
    >
      <div className="space-y-4">
        <{{EntityName}}ListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "{{RoutePath}}", search: {}})
          }{{NavigationHandler}}
        />
      </div>
    </{{EntityName}}Provider>
  );
}

