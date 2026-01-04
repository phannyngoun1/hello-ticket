import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import {
  BookingDetail,
  BookingProvider,
  useBooking,
  useBookingService,
} from "@truths/sales";
import { api } from "@truths/api";

function BookingDetailContent({ id }: { id: string | undefined }) {
  const service = useBookingService();
  const {
    data,
    isLoading,
    error,
  } = useBooking(service, id ?? null);

  useEffect(() => {
    if (!data) return;
    const title = data.booking_number || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/sales/bookings/${id}`,
          title,
          iconName: "ShoppingCart",
        },
      })
    );
  }, [id, data]);

  return (
    <BookingDetail
      data={data ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
    />
  );
}

export function ViewBookingPage() {
  const { id } = useParams({ from: "/sales/bookings/$id" });

  const serviceConfig = {
    apiClient: api,
    endpoints: {
      bookings: "/api/v1/sales/bookings",
    },
  };

  return (
    <BookingProvider config={serviceConfig}>
      <BookingDetailContent id={id} />
    </BookingProvider>
  );
}

