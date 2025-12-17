import { useLocation, useNavigate } from "@tanstack/react-router";
import { {{EntityName}}ListContainer, {{EntityName}}Provider } from "@truths/{{PackageName}}";
import { api } from "@truths/api";

export function {{EntityName}}Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  const serviceConfig = {
    apiClient: api,
    endpoints: {
      {{EntityNamePluralCamel}}: "/api/v1/{{ParentRoute}}/{{EntityNamePluralLower}}",
    },
  };

  return (
    <{{EntityName}}Provider config={serviceConfig}>
      <div className="space-y-4">
        <{{EntityName}}ListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "{{RoutePath}}", search: {} })
          }
          onNavigateTo{{EntityName}}={(id: string) =>
            navigate({
              to: "{{RoutePath}}/$id",
              params: { id },
            })
          }
        />
      </div>
    </{{EntityName}}Provider>
  );
}

