/**
 * View Show Page Component
 *
 * Full-featured page for viewing a single show.
 * Handles data fetching, providers, and tab title updates.
 */

import { useEffect } from "react";
import { ShowDetail } from "./show-detail";
import { ShowProvider, useShowService } from "./show-provider";
import { useShow } from "./use-shows";
import { OrganizerProvider } from "../organizers/organizer-provider";
import { EventProvider } from "../events/event-provider";
import { VenueProvider } from "../venues/venue-provider";
import { LayoutProvider } from "../layouts/layout-provider";
import { AuditProvider } from "@truths/shared";
import type { ShowServiceConfig } from "./show-service";
import type { OrganizerServiceConfig } from "../organizers/organizer-service";
import type { EventServiceConfig } from "../events/event-service";
import type { VenueServiceConfig } from "../venues/venue-service";
import type { LayoutServiceConfig } from "../layouts/layout-service";
import type { AuditServiceConfig } from "@truths/shared";

export interface ViewShowPageConfig {
  show: ShowServiceConfig;
  organizer: OrganizerServiceConfig;
  event: EventServiceConfig;
  venue: VenueServiceConfig;
  layout: LayoutServiceConfig;
  audit: AuditServiceConfig;
}

export interface ViewShowPageProps {
  showId: string;
  config: ViewShowPageConfig;
  onNavigateToInventory?: (eventId: string) => void;
  onNavigateToVenue?: (venueId: string) => void;
}

function ShowDetailContent({
  showId,
  onNavigateToInventory,
  onNavigateToVenue,
}: {
  showId: string;
  onNavigateToInventory?: (eventId: string) => void;
  onNavigateToVenue?: (venueId: string) => void;
}) {
  const service = useShowService();
  const { data, isLoading, error } = useShow(service, showId ?? null);

  useEffect(() => {
    if (!data) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/ticketing/shows/${showId}`,
          title,
        },
      }),
    );
  }, [showId, data]);

  return (
    <ShowDetail
      data={data ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
      onNavigateToInventory={onNavigateToInventory}
      onNavigateToVenue={onNavigateToVenue}
    />
  );
}

export function ViewShowPage({
  showId,
  config,
  onNavigateToInventory,
  onNavigateToVenue,
}: ViewShowPageProps) {
  return (
    <ShowProvider config={config.show}>
      <OrganizerProvider config={config.organizer}>
        <EventProvider config={config.event}>
          <VenueProvider config={config.venue}>
            <LayoutProvider config={config.layout}>
              <AuditProvider config={config.audit}>
                <ShowDetailContent
                  showId={showId}
                  onNavigateToInventory={onNavigateToInventory}
                  onNavigateToVenue={onNavigateToVenue}
                />
              </AuditProvider>
            </LayoutProvider>
          </VenueProvider>
        </EventProvider>
      </OrganizerProvider>
    </ShowProvider>
  );
}
