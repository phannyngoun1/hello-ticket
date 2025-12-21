import { useParams, useSearch } from "@tanstack/react-router";
import { SeatDesigner } from "@truths/ticketing";
import {
  useVenueService,
  useVenue,
  useLayoutService,
  useLayoutWithSeats,
} from "@truths/ticketing";
import { VenueProvider, LayoutProvider } from "@truths/ticketing";
import { api } from "@truths/api";

function SeatDesignerContent({
  id,
  layoutId,
}: {
  id: string;
  layoutId?: string;
}) {
  const venueService = useVenueService();
  const layoutService = useLayoutService();
  const { data: venue, isLoading: venueLoading } = useVenue(
    venueService,
    id ?? null
  );

  // Use combined endpoint to fetch layout with seats in one request
  const { data: layoutWithSeats, isLoading: layoutLoading } =
    useLayoutWithSeats(layoutService, layoutId ?? null);

  // Don't render SeatDesigner until we have layoutId
  if (!layoutId) {
    return <div className="p-4">Layout ID is required</div>;
  }

  if (venueLoading || layoutLoading) {
    return <div className="p-4">Loading layout and seats...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <SeatDesigner
        key={layoutId} // Force remount when layoutId changes to reload seats
        venueId={id}
        layoutId={layoutId}
        imageUrl={layoutWithSeats?.layout.image_url || venue?.image_url}
        initialSeats={layoutWithSeats?.seats}
        fileId={layoutWithSeats?.layout.file_id}
      />
    </div>
  );
}

export function SeatDesignerPage() {
  const { id } = useParams({ from: "/ticketing/venues/$id/seats/designer" });
  const search = useSearch({ from: "/ticketing/venues/$id/seats/designer" });
  const layoutId = search?.layoutId;

  if (!id) {
    return <div className="p-4">Invalid venue ID</div>;
  }

  const venueServiceConfig = {
    apiClient: api,
    endpoints: {
      venues: "/api/v1/ticketing/venues",
    },
  };

  const layoutServiceConfig = {
    apiClient: api,
    endpoints: {
      layouts: "/api/v1/ticketing/layouts",
    },
  };

  return (
    <VenueProvider config={venueServiceConfig}>
      <LayoutProvider config={layoutServiceConfig}>
        <SeatDesignerContent id={id} layoutId={layoutId} />
      </LayoutProvider>
    </VenueProvider>
  );
}
