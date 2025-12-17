import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import {
  TestDetail,
  TestProvider,
  useTest,
  useTestService,
} from "@truths/sales";
import { api } from "@truths/api";

function TestDetailContent({ id }: { id: string | undefined }) {
  const service = useTestService();
  const {
    data,
    isLoading,
    error,
  } = useTest(service, id ?? null);

  useEffect(() => {
    if (!data) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/sales/tests/${id}`,
          title,
          iconName: "Users",
        },
      })
    );
  }, [id, data]);

  return (
    <TestDetail
      data={data ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
    />
  );
}

export function ViewTestPage() {
  const { id } = useParams({ from: "/sales/tests/$id" });

  const serviceConfig = {
    apiClient: api,
    endpoints: {
      tests: "/api/v1/sales/tests",
    },
  };

  return (
    <TestProvider config={serviceConfig}>
      <TestDetailContent id={id} />
    </TestProvider>
  );
}

