import { useParams, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { SeatDesigner, useLayoutsByVenue } from "@truths/ticketing";
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
  const {
    data: layouts,
    isLoading: layoutsLoading,
    error: layoutsError,
  } = useLayoutsByVenue(layoutService, id ?? null);

  // Prefer layoutId from route; if missing, fall back to first available layout
  const effectiveLayoutId =
    layoutId || (layouts && layouts.length > 0 ? layouts[0].id : undefined);

  // Use combined endpoint to fetch layout with seats in one request
  const { data: layoutWithSeats, isLoading: layoutLoading } =
    useLayoutWithSeats(layoutService, effectiveLayoutId ?? null);

  // Update tab title with layout name when available
  useEffect(() => {
    if (!id || !effectiveLayoutId) return;
    const layoutName =
      layoutWithSeats?.layout.name || `Layout ${effectiveLayoutId}`;
    const title = `Designer - ${layoutName}`;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/ticketing/venues/${id}/seats/designer`,
          title,
          iconName: "MapPin",
        },
      })
    );
  }, [id, effectiveLayoutId, layoutWithSeats?.layout.name]);

  // Loading states
  if (venueLoading || layoutLoading || layoutsLoading) {
    return <div className="p-4">Loading layout and seats...</div>;
  }

  // Handle missing layout
  if (!effectiveLayoutId) {
    if (layoutsError) {
      return (
        <div className="p-4 text-destructive">
          Failed to load layouts:{" "}
          {layoutsError instanceof Error
            ? layoutsError.message
            : "Unknown error"}
        </div>
      );
    }
    return (
      <div className="p-4 text-muted-foreground">
        No layouts found for this venue. Please create a layout first.
      </div>
    );
  }


  return (
    <div className="container mx-auto py-6 space-y-4">
      <SeatDesigner
        key={effectiveLayoutId} // Force remount when layoutId changes to reload seats
        venueId={id}
        layoutId={effectiveLayoutId}
        layoutName={layoutWithSeats?.layout.name}
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
