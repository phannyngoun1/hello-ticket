import { useParams } from "@tanstack/react-router";
import { ViewEmployeePage as ViewEmployeePageComponent } from "@truths/sales";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { api } from "@truths/api";

export function ViewEmployeePage() {
  useRequireAuth();

  const { id } = useParams({ from: "/sales/employees/$id" });

  if (!id) {
    return <div className="p-4">Invalid employee ID</div>;
  }

  const config = {
    tag: {
      apiClient: api,
      endpoints: {
        tags: "/api/v1/shared/tags",
        entityTags: "/api/v1/shared/tags/entity",
      },
    },
    attachment: {
      apiClient: api,
      endpoints: {
        attachments: "/api/v1/shared/attachments",
        entityAttachments: "/api/v1/shared/attachments/entity",
        profilePhoto: "/api/v1/shared/attachments/entity",
      },
    },
  };

  return (
    <ViewEmployeePageComponent
      employeeId={id}
      config={config}
    />
  );
}
