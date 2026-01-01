import { createFileRoute } from "@tanstack/react-router";
import { PaymentPage } from "../../../pages/sales/payments-page";

export const Route = createFileRoute("/sales/payments/")({
  component: PaymentPage,
});

