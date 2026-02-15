/**
 * Seat Designer Page Component
 *
 * Full-featured page for designing seat layouts.
 * Handles venue/layout data fetching, providers, read-only mode for active events,
 * and tab title updates.
 */

import { useEffect } from "react";
import { SeatDesigner } from "../components/seat-designer";
import {
  useLayoutsByVenue,
  useLayoutWithSeats,
  useUpdateLayout,
} from "./use-layouts";
import { VenueProvider, useVenueService } from "../venues/venue-provider";
import { useVenue } from "../venues/use-venues";
import { LayoutProvider, useLayoutService } from "./layout-provider";
import { EventProvider, useEventService } from "../events/event-provider";
import { useEvents } from "../events/use-events";
import { EventStatus } from "../events/types";
import type { VenueServiceConfig } from "../venues/venue-service";
import type { LayoutServiceConfig } from "./layout-service";
import type { EventServiceConfig } from "../events/event-service";

export interface SeatDesignerPageConfig {
  venue: VenueServiceConfig;
  layout: LayoutServiceConfig;
  event: EventServiceConfig;
}

export interface SeatDesignerPageProps {
  venueId: string;
  layoutId?: string;
  config: SeatDesignerPageConfig;
}

function SeatDesignerContent({
  venueId,
  layoutId,
}: {
  venueId: string;
  layoutId?: string;
}) {
  const venueService = useVenueService();
  const layoutService = useLayoutService();
  const eventService = useEventService();
  const { data: venue, isLoading: venueLoading } = useVenue(
    venueService,
    venueId ?? null,
  );
  const {
    data: layouts,
    isLoading: layoutsLoading,
    error: layoutsError,
  } = useLayoutsByVenue(layoutService, venueId ?? null);

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
            is_active: true,
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
  useEffect(() => {
    if (!venueId || !effectiveLayoutId) return;
    const layoutName =
      layoutWithSeats?.layout.name || `Layout ${effectiveLayoutId}`;
    const title = `Designer - ${layoutName}`;
    const tabPath = `/ticketing/venues/${venueId}/seats/designer?layoutId=${effectiveLayoutId}`;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: tabPath,
          title,
        },
      }),
    );
  }, [venueId, effectiveLayoutId, layoutWithSeats?.layout.name]);

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
        key={effectiveLayoutId}
        venueId={venueId}
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
        markerFillTransparency={
          layoutWithSeats?.layout.marker_fill_transparency
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
        onCanvasBackgroundColorChange={async (color) => {
          await updateLayoutMutation.mutateAsync({
            id: effectiveLayoutId,
            input: { canvas_background_color: color },
          });
        }}
        onMarkerFillTransparencyChange={async (transparency) => {
          await updateLayoutMutation.mutateAsync({
            id: effectiveLayoutId,
            input: { marker_fill_transparency: transparency },
          });
        }}
      />
    </div>
  );
}

export function SeatDesignerPage({
  venueId,
  layoutId,
  config,
}: SeatDesignerPageProps) {
  return (
    <VenueProvider config={config.venue}>
      <LayoutProvider config={config.layout}>
        <EventProvider config={config.event}>
          <SeatDesignerContent venueId={venueId} layoutId={layoutId} />
        </EventProvider>
      </LayoutProvider>
    </VenueProvider>
  );
}
