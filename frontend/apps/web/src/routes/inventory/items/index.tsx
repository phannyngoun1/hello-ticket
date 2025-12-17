import { createFileRoute } from "@tanstack/react-router";
import { ItemsPage } from "../../../pages/inventory/items-page";

export const Route = createFileRoute("/inventory/items/")({
  component: ItemsPage,
});

