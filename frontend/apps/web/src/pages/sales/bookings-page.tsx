import { useLocation, useNavigate } from "@tanstack/react-router";
import { BookingListContainer, BookingProvider } from "@truths/sales";
import { api } from "@truths/api";

export function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <BookingProvider
      config={{
        apiClient: api,
        endpoints: {
          bookings: "/api/v1/sales/bookings",
        },
      }}
    >
      <div className="space-y-4">
        <BookingListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/sales/bookings", search: {}})
          }
          onNavigateToBooking={(id) =>
            navigate({
              to: "/sales/bookings/$id",
              params: { id },
            })
          }
        />
      </div>
    </BookingProvider>
  );
}

