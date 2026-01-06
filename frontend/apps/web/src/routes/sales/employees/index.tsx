import { createFileRoute } from "@tanstack/react-router";
import { EmployeePage } from "../../../pages/sales/employees-page";

export const Route = createFileRoute("/sales/employees/")({
  component: EmployeePage,
});

