import { createFileRoute } from "@tanstack/react-router";
import { ViewPaymentPage } from "../../../pages/sales/view-payment-page";

export const Route = createFileRoute("/sales/payments/$id")({
  component: ViewPaymentPage,
});
