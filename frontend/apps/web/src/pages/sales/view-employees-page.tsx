import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import {
  EmployeeDetail,
  EmployeeProvider,
  useEmployee,
  useEmployeeService,
} from "@truths/sales";
import { api } from "@truths/api";

function EmployeeDetailContent({ id }: { id: string | undefined }) {
  const service = useEmployeeService();
  const {
    data,
    isLoading,
    error,
  } = useEmployee(service, id ?? null);

  useEffect(() => {
    if (!data) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/sales/employees/${id}`,
          title,
          iconName: "Users",
        },
      })
    );
  }, [id, data]);

  return (
    <EmployeeDetail
      data={data ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
    />
  );
}

export function ViewEmployeePage() {
  const { id } = useParams({ from: "/sales/employees/$id" });

  const serviceConfig = {
    apiClient: api,
    endpoints: {
      employees: "/api/v1/sales/employees",
    },
  };

  return (
    <EmployeeProvider config={serviceConfig}>
      <EmployeeDetailContent id={id} />
    </EmployeeProvider>
  );
}

