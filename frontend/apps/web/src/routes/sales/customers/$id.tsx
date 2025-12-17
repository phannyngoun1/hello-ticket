import { createFileRoute } from "@tanstack/react-router";
import { ViewCustomerPage } from "../../../pages/sales/view-customer-page";

export const Route = createFileRoute("/sales/customers/$id")({
  component: ViewCustomerPage,
});
