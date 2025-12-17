import { createFileRoute } from "@tanstack/react-router";
import { CustomerPage } from "../../../pages/sales/customers-page";

export const Route = createFileRoute("/sales/customers/")({
  component: CustomerPage,
});
