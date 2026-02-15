import { useParams } from "@tanstack/react-router";
import { ViewBookingPage as ViewBookingPageComponent } from "@truths/sales";
import { useRequireAuth } from "../../hooks/use-require-auth";

export function ViewBookingPage() {
  useRequireAuth();

  const { id } = useParams({ from: "/sales/bookings/$id" });

  if (!id) {
    return <div className="p-4">Invalid booking ID</div>;
  }

  return <ViewBookingPageComponent bookingId={id} />;
}
