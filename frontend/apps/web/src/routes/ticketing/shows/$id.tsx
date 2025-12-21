import { createFileRoute } from "@tanstack/react-router";
import { ViewShowPage } from "../../../pages/ticketing/view-shows-page";

export const Route = createFileRoute("/ticketing/shows/$id")({
  component: ViewShowPage,
});

