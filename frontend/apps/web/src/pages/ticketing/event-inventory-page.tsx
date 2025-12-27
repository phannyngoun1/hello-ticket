import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { EventInventory } from "@truths/ticketing";
import { EventProvider } from "@truths/ticketing";
import { LayoutProvider } from "@truths/ticketing";
import { api } from "@truths/api";
import { RootLayout } from "../../components/layouts/root-layout";

function EventInventoryContent() {
  const { eventId } = useParams({ from: "/ticketing/events/$eventId/inventory" });

  useEffect(() => {
    if (!eventId) return;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/ticketing/events/${eventId}/inventory`,
          title: "Inventory Management",
          iconName: "Package",
        },
      })
    );
  }, [eventId]);

  if (!eventId) {
    return <div className="p-4">Invalid event ID</div>;
  }

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
    <RootLayout>
      <EventProvider config={eventServiceConfig}>
        <LayoutProvider config={layoutServiceConfig}>
          <EventInventory eventId={eventId} />
        </LayoutProvider>
      </EventProvider>
    </RootLayout>
  );
}

export function EventInventoryPage() {
  return <EventInventoryContent />;
}

