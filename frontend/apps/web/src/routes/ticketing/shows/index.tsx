import { createFileRoute } from "@tanstack/react-router";
import { ShowPage } from "../../../pages/ticketing/shows-page";

export const Route = createFileRoute("/ticketing/shows/")({
  component: ShowPage,
});

