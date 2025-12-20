import { createFileRoute } from "@tanstack/react-router";
import { OrganizerPage } from "../../../pages/ticketing/organizers-page";

export const Route = createFileRoute("/ticketing/organizers/")({
  component: OrganizerPage,
});

