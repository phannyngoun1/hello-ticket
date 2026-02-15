/**
 * View Booking Page Component
 *
 * Full-featured page for viewing a single booking.
 * Handles data fetching and tab title updates.
 * Must be used within BookingProvider (e.g. from domain providers).
 */

import { useEffect } from "react";
import { BookingDetail } from "./booking-detail";
import { useBooking } from "./use-bookings";
import { useBookingService } from "./booking-provider";

export interface ViewBookingPageProps {
  bookingId: string;
}

function BookingDetailContent({ bookingId }: { bookingId: string }) {
  const service = useBookingService();
  const { data, isLoading, error } = useBooking(service, bookingId ?? null);

  useEffect(() => {
    if (!data) return;
    const title = data.booking_number || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/sales/bookings/${bookingId}`,
          title,
        },
      }),
    );
  }, [bookingId, data]);

  return (
    <BookingDetail
      data={data ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
    />
  );
}

export function ViewBookingPage({ bookingId }: ViewBookingPageProps) {
  return <BookingDetailContent bookingId={bookingId} />;
}
