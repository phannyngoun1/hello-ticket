import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { EventInventory, useEvent, useEventService } from "@truths/ticketing";
import { useShow, useShowService } from "@truths/ticketing";
import { EventProvider } from "@truths/ticketing";
import { ShowProvider } from "@truths/ticketing";
import { LayoutProvider } from "@truths/ticketing";
import { api } from "@truths/api";
import { RootLayout } from "../../components/layouts/root-layout";

function EventInventoryWithTitle({ eventId }: { eventId: string }) {
  const eventService = useEventService();
  const showService = useShowService();
  const { data: event } = useEvent(eventService, eventId || null);
  const { data: show } = useShow(showService, event?.show_id || null);

  useEffect(() => {
    if (!eventId) return;
    if (!event) return;
    
    const code = show?.code || event.id;
    const title = `${code} - ${event.title}`;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/ticketing/events/${eventId}/inventory`,
          title,
          iconName: "Package",
        },
      })
    );
  }, [eventId, event, show]);

  return <EventInventory eventId={eventId} />;
}

function EventInventoryContent() {
  const { eventId } = useParams({ from: "/ticketing/events/$eventId/inventory" });

  if (!eventId) {
    return <div className="p-4">Invalid event ID</div>;
  }

  const eventServiceConfig = {
    apiClient: api,
    endpoints: {
      events: "/api/v1/ticketing/events",
    },
  };

  const showServiceConfig = {
    apiClient: api,
    endpoints: {
      shows: "/api/v1/ticketing/shows",
    },
  };

  const layoutServiceConfig = {
    apiClient: api,
    endpoints: {
      layouts: "/api/v1/ticketing/layouts",
    },
  };

  return (
    <RootLayout>
      <EventProvider config={eventServiceConfig}>
        <ShowProvider config={showServiceConfig}>
          <LayoutProvider config={layoutServiceConfig}>
            <EventInventoryWithTitle eventId={eventId} />
          </LayoutProvider>
        </ShowProvider>
      </EventProvider>
    </RootLayout>
  );
}

export function EventInventoryPage() {
  return <EventInventoryContent />;
}

