import { createFileRoute } from "@tanstack/react-router";
import { TestPage } from "../../../pages/sales/tests-page";

export const Route = createFileRoute("/sales/tests/")({
  component: TestPage,
});

