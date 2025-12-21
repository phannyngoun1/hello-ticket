import { createFileRoute } from "@tanstack/react-router";
import { ViewBookingPage } from "../../../pages/sales/view-bookings-page";

export const Route = createFileRoute("/sales/bookings/$id")({
  component: ViewBookingPage,
});

