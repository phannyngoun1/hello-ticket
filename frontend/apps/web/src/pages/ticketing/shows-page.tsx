import { useLocation, useNavigate } from "@tanstack/react-router";
import { ShowListContainer, ShowProvider, OrganizerProvider } from "@truths/ticketing";
import { api } from "@truths/api";

export function ShowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <ShowProvider
      config={{
        apiClient: api,
        endpoints: {
          shows: "/api/v1/ticketing/shows",
        },
      }}
    >
      <OrganizerProvider
        config={{
          apiClient: api,
          endpoints: {
            organizers: "/api/v1/ticketing/organizers",
          },
        }}
      >
        <div className="space-y-4">
          <ShowListContainer
            autoOpenCreate={autoOpenCreate}
            onCreateDialogClose={() =>
              navigate({ to: "/ticketing/shows", search: {}})
            }
            onNavigateToShow={(id) =>
              navigate({
                to: "/ticketing/shows/$id",
                params: { id },
              })
            }
          />
        </div>
      </OrganizerProvider>
    </ShowProvider>
  );
}

