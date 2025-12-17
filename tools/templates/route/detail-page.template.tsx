import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import {
  {{EntityName}}Detail,
  {{EntityName}}Provider,
  use{{EntityName}},
  use{{EntityName}}Service,
} from "@truths/{{PackageName}}";
import { api } from "@truths/api";

function {{EntityName}}DetailContent({ id }: { id: string | undefined }) {
  const service = use{{EntityName}}Service();
  const {
    data,
    isLoading,
    error,
  } = use{{EntityName}}(service, id ?? null);

  useEffect(() => {
    if (!data) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `{{RoutePath}}/${id}`,
          title,
          iconName: "{{IconName}}",
        },
      })
    );
  }, [id, data]);

  return (
    <{{EntityName}}Detail
      data={data ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
    />
  );
}

export function View{{EntityName}}Page() {
  const { id } = useParams({ from: "{{RoutePath}}/$id" });

  const serviceConfig = {
    apiClient: api,
    endpoints: {
      {{EntityNamePluralCamel}}: "{{ApiEndpoint}}",
    },
  };

  return (
    <{{EntityName}}Provider config={serviceConfig}>
      <{{EntityName}}DetailContent id={id} />
    </{{EntityName}}Provider>
  );
}

