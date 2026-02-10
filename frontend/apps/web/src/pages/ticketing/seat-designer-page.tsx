import { useParams, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { SeatDesigner, useLayoutsByVenue } from "@truths/ticketing";
import {
  useVenueService,
  useVenue,
  useLayoutService,
  useLayoutWithSeats,
  useUpdateLayout,
} from "@truths/ticketing";
import {
  VenueProvider,
  LayoutProvider,
  EventProvider,
} from "@truths/ticketing";
import { useEventService, useEvents, EventStatus } from "@truths/ticketing";
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
  const eventService = useEventService();
  const { data: venue, isLoading: venueLoading } = useVenue(
    venueService,
    id ?? null,
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
  const updateLayoutMutation = useUpdateLayout(layoutService);

  // Check if layout is attached to any active events (not completed or cancelled)
  const { data: eventsData } = useEvents(
    eventService,
    effectiveLayoutId
      ? {
          filter: {
            layout_id: effectiveLayoutId,
            is_active: true, // Only care about active events in general
          },
        }
      : undefined,
  );

  const isReadOnly = eventsData?.data.some(
    (event) =>
      event.status !== EventStatus.COMPLETED &&
      event.status !== EventStatus.CANCELLED,
  );

  // Update tab title with layout name when available
  // Include layoutId in path to ensure each layout gets its own tab
  useEffect(() => {
    if (!id || !effectiveLayoutId) return;
    const layoutName =
      layoutWithSeats?.layout.name || `Layout ${effectiveLayoutId}`;
    const title = `Designer - ${layoutName}`;
    // Include layoutId in path so each layout gets a unique tab
    const tabPath = `/ticketing/venues/${id}/seats/designer?layoutId=${effectiveLayoutId}`;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: tabPath,
          title,
        },
      }),
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
        designMode={layoutWithSeats?.layout.design_mode}
        initialSeats={layoutWithSeats?.seats}
        initialSections={layoutWithSeats?.sections}
        fileId={layoutWithSeats?.layout.file_id}
        initialCanvasBackgroundColor={
          layoutWithSeats?.layout.canvas_background_color
        }
        readOnly={isReadOnly}
        onImageUpload={(_url, fileId) => {
          if (fileId) {
            updateLayoutMutation.mutate({
              id: effectiveLayoutId,
              input: { file_id: fileId },
            });
          }
        }}
        onRemoveImage={async () => {
          await updateLayoutMutation.mutateAsync({
            id: effectiveLayoutId,
            input: { file_id: "" },
          });
        }}
        onCanvasBackgroundColorChange={(color) => {
          updateLayoutMutation.mutate({
            id: effectiveLayoutId,
            input: { canvas_background_color: color },
          });
        }}
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

  const eventServiceConfig = {
    apiClient: api,
    endpoints: {
      events: "/api/v1/ticketing/events",
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
        <EventProvider config={eventServiceConfig}>
          <SeatDesignerContent id={id} layoutId={layoutId} />
        </EventProvider>
      </LayoutProvider>
    </VenueProvider>
  );
}
