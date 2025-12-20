import { useLocation, useNavigate } from "@tanstack/react-router";
import { OrganizerListContainer, OrganizerProvider } from "@truths/ticketing";
import { api } from "@truths/api";

export function OrganizerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <OrganizerProvider
      config={{
        apiClient: api,
        endpoints: {
          organizers: "/api/v1/ticketing/organizers",
        },
      }}
    >
      <div className="space-y-4">
        <OrganizerListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/ticketing/organizers", search: {}})
          }
          onNavigateToOrganizer={(id) =>
            navigate({
              to: "/ticketing/organizers/$id",
              params: { id },
            })
          }
        />
      </div>
    </OrganizerProvider>
  );
}

