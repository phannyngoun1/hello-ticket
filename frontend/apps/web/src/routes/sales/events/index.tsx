import { createFileRoute } from "@tanstack/react-router";
import { EventsPageWithProvider } from "../../../pages/sales/events-page";

export const Route = createFileRoute("/sales/events/")({
  component: EventsPageWithProvider,
});

