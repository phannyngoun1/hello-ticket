import { createFileRoute } from "@tanstack/react-router";
import { BookingPage } from "../../../pages/sales/bookings-page";

export const Route = createFileRoute("/sales/bookings/")({
  component: BookingPage,
});

