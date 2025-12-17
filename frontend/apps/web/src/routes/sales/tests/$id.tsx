import { createFileRoute } from "@tanstack/react-router";
import { ViewTestPage } from "../../../pages/sales/view-tests-page";

export const Route = createFileRoute("/sales/tests/$id")({
  component: ViewTestPage,
});

