import { useParams, useNavigate } from "@tanstack/react-router";
import { ViewCustomerPage as ViewCustomerPageComponent } from "@truths/sales";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { api } from "@truths/api";

export function ViewCustomerPage() {
  useRequireAuth();

  const { id } = useParams({ from: "/sales/customers/$id" });
  const navigate = useNavigate();

  if (!id) {
    return <div className="p-4">Invalid customer ID</div>;
  }

  const config = {
    tag: {
      apiClient: api,
      endpoints: { tags: "/api/v1/shared/tags" },
    },
    attachment: {
      apiClient: api,
      endpoints: {
        attachments: "/api/v1/shared/attachments",
        entityAttachments: "/api/v1/shared/attachments/entity",
        profilePhoto: "/api/v1/shared/attachments/entity",
      },
    },
    booking: {
      apiClient: api,
      endpoints: { bookings: "/api/v1/sales/bookings" },
    },
  };

  return (
    <ViewCustomerPageComponent
      customerId={id}
      config={config}
      onNavigateToCustomers={() => navigate({ to: "/sales/customers" })}
      onNavigateToBookings={(customerId) =>
        navigate({
          to: "/sales/bookings",
          search: { customer_id: customerId },
        })
      }
      onNavigateToBooking={(bookingId) =>
        navigate({
          to: "/sales/bookings/$id",
          params: { id: bookingId },
        })
      }
    />
  );
}
