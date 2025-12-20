import { useLocation, useNavigate } from "@tanstack/react-router";
import { VenueListContainer, VenueProvider } from "@truths/ticketing";
import { api } from "@truths/api";

export function VenuePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <VenueProvider
      config={{
        apiClient: api,
        endpoints: {
          venues: "/api/v1/ticketing/venues",
        },
      }}
    >
      <div className="space-y-4">
        <VenueListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/ticketing/venues", search: {}})
          }
          onNavigateToVenue={(id) =>
            navigate({
              to: "/ticketing/venues/$id",
              params: { id },
            })
          }
        />
      </div>
    </VenueProvider>
  );
}

