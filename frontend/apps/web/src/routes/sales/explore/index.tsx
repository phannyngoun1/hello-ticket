import { createFileRoute } from "@tanstack/react-router";
import { ExplorePageWithProvider } from "../../../pages/sales/explore-page";

export const Route = createFileRoute("/sales/explore/")({
  component: ExplorePageWithProvider,
});
