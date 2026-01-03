import { useLocation, useNavigate } from "@tanstack/react-router";
import { VenueTypeListContainer, VenueTypeProvider } from "@truths/ticketing";
import { api } from "@truths/api";

export function VenueTypePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <VenueTypeProvider
      config={{
        apiClient: api,
        endpoints: {
          venueTypes: "/api/v1/ticketing/venue-types",
        },
      }}
    >
      <div className="space-y-4">
        <VenueTypeListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/settings/ticketing/venue-types", search: {}})
          }
        />
      </div>
    </VenueTypeProvider>
  );
}

