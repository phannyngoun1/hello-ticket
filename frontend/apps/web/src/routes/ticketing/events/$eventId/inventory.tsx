import { createFileRoute } from "@tanstack/react-router";
import { EventInventoryPage } from "../../../../pages/ticketing/event-inventory-page";

export const Route = createFileRoute("/ticketing/events/$eventId/inventory")({
  component: EventInventoryPage,
});

