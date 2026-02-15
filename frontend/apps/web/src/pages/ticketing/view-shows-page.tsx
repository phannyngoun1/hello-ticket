import { useParams, useNavigate } from "@tanstack/react-router";
import { ViewShowPage as ViewShowPageComponent } from "@truths/ticketing";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { api } from "@truths/api";

export function ViewShowPage() {
  useRequireAuth();

  const { id } = useParams({ from: "/ticketing/shows/$id" });
  const navigate = useNavigate();

  if (!id) {
    return <div className="p-4">Invalid show ID</div>;
  }

  const config = {
    show: {
      apiClient: api,
      endpoints: { shows: "/api/v1/ticketing/shows" },
    },
    organizer: {
      apiClient: api,
      endpoints: { organizers: "/api/v1/ticketing/organizers" },
    },
    event: {
      apiClient: api,
      endpoints: { events: "/api/v1/ticketing/events" },
    },
    venue: {
      apiClient: api,
      endpoints: { venues: "/api/v1/ticketing/venues" },
    },
    layout: {
      apiClient: api,
      endpoints: { layouts: "/api/v1/ticketing/layouts" },
    },
    audit: {
      apiClient: api,
      baseUrl: "/api/v1",
    },
  };

  return (
    <ViewShowPageComponent
      showId={id}
      config={config}
      onNavigateToInventory={(eventId) =>
        navigate({
          to: "/ticketing/events/$eventId/inventory",
          params: { eventId },
        })
      }
      onNavigateToVenue={(venueId) =>
        navigate({ to: "/ticketing/venues/$id", params: { id: venueId } })
      }
    />
  );
}
