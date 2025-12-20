import { createFileRoute } from "@tanstack/react-router";
import { ViewVenuePage } from "../../../pages/ticketing/view-venues-page";

export const Route = createFileRoute("/ticketing/venues/$id")({
  component: ViewVenuePage,
});

