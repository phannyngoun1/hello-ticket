import { useParams } from "@tanstack/react-router";
import { SeatDesigner } from "@truths/ticketing";
import { useVenueService, useVenue } from "@truths/ticketing";
import { VenueProvider } from "@truths/ticketing";
import { api } from "@truths/api";

function SeatDesignerContent({ id }: { id: string }) {
  const service = useVenueService();
  const { data: venue, isLoading } = useVenue(service, id ?? null);

  if (isLoading) {
    return <div className="p-4">Loading venue...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <SeatDesigner venueId={id} imageUrl={venue?.image_url} />
    </div>
  );
}

export function SeatDesignerPage() {
  const { id } = useParams({ from: "/ticketing/venues/$id/seats/designer" });

  if (!id) {
    return <div className="p-4">Invalid venue ID</div>;
  }

  const serviceConfig = {
    apiClient: api,
    endpoints: {
      venues: "/api/v1/ticketing/venues",
    },
  };

  return (
    <VenueProvider config={serviceConfig}>
      <SeatDesignerContent id={id} />
    </VenueProvider>
  );
}
