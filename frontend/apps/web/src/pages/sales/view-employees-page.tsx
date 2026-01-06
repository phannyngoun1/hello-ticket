import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import {
  EmployeeDetail,
  EmployeeProvider,
  useEmployee,
  useEmployeeService,
  EditEmployeeDialog,
  useUpdateEmployee,
} from "@truths/sales";
import type { UpdateEmployeeInput } from "@truths/sales";
import { api } from "@truths/api";

function EmployeeDetailContent({ id }: { id: string | undefined }) {
  const service = useEmployeeService();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const updateMutation = useUpdateEmployee(service);
  const { data, isLoading, error } = useEmployee(service, id ?? null);

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

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (
    employeeId: string,
    input: UpdateEmployeeInput
  ) => {
    try {
      await updateMutation.mutateAsync({ id: employeeId, input });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  return (
    <>
      <EmployeeDetail
        data={data ?? undefined}
        loading={isLoading}
        error={error as Error | null}
        editable={true}
        onEdit={handleEdit}
      />

      <EditEmployeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        employee={data ?? null}
      />
    </>
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
