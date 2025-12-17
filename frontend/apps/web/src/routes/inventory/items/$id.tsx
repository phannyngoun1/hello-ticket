import { createFileRoute } from "@tanstack/react-router";
import { ViewItemPage } from "../../../pages/inventory/view-item-page";

export const Route = createFileRoute("/inventory/items/$id")({
  component: ViewItemPage,
});
