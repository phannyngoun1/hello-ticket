import { useParams, useSearch } from "@tanstack/react-router";
import { SeatDesignerPage as SeatDesignerPageComponent } from "@truths/ticketing";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { api } from "@truths/api";

export function SeatDesignerPage() {
  useRequireAuth();

  const { id } = useParams({ from: "/ticketing/venues/$id/seats/designer" });
  const search = useSearch({ from: "/ticketing/venues/$id/seats/designer" });
  const layoutId = search?.layoutId;

  if (!id) {
    return <div className="p-4">Invalid venue ID</div>;
  }

  const config = {
    venue: {
      apiClient: api,
      endpoints: { venues: "/api/v1/ticketing/venues" },
    },
    layout: {
      apiClient: api,
      endpoints: { layouts: "/api/v1/ticketing/layouts" },
    },
    event: {
      apiClient: api,
      endpoints: { events: "/api/v1/ticketing/events" },
    },
  };

  return (
    <SeatDesignerPageComponent
      venueId={id}
      layoutId={layoutId}
      config={config}
    />
  );
}
