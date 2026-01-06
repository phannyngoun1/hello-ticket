import { createFileRoute } from "@tanstack/react-router";
import { ViewEmployeePage } from "../../../pages/sales/view-employees-page";

export const Route = createFileRoute("/sales/employees/$id")({
  component: ViewEmployeePage,
});

