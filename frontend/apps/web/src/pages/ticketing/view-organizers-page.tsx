import { useParams } from "@tanstack/react-router";
import { ViewOrganizerPage as ViewOrganizerPageComponent } from "@truths/ticketing";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { api } from "@truths/api";

export function ViewOrganizerPage() {
  useRequireAuth();

  const { id } = useParams({ from: "/ticketing/organizers/$id" });

  if (!id) {
    return <div className="p-4">Invalid organizer ID</div>;
  }

  const config = {
    organizer: {
      apiClient: api,
      endpoints: { organizers: "/api/v1/ticketing/organizers" },
    },
    tag: {
      apiClient: api,
      endpoints: { tags: "/api/v1/shared/tags" },
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
    <ViewOrganizerPageComponent
      organizerId={id}
      config={config}
    />
  );
}
