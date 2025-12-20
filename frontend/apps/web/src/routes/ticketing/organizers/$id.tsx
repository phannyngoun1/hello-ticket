import { createFileRoute } from "@tanstack/react-router";
import { ViewOrganizerPage } from "../../../pages/ticketing/view-organizers-page";

export const Route = createFileRoute("/ticketing/organizers/$id")({
  component: ViewOrganizerPage,
});

