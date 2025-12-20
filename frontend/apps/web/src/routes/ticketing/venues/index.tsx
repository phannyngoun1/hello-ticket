import { createFileRoute } from "@tanstack/react-router";
import { VenuePage } from "../../../pages/ticketing/venues-page";

export const Route = createFileRoute("/ticketing/venues/")({
  component: VenuePage,
});

