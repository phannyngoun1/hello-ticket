import { useMemo } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { Button, Skeleton } from "@truths/ui";
import { ArrowLeft } from "lucide-react";
import { api } from "@truths/api";
import {
  PaymentService,
  usePayment,
  useBooking,
  useBookingService,
  usePaymentsByBooking,
  BookingInvoiceReceipt,
  type Booking,
  type BookingItem,
} from "@truths/sales";
import { useRequireAuth } from "../../hooks/use-require-auth";

export function ViewPaymentPage() {
  useRequireAuth();
  const { id } = useParams({ from: "/sales/payments/$id" });

  const paymentService = useMemo(
    () =>
      new PaymentService({
        apiClient: api,
        endpoints: { payments: "/api/v1/sales/payments" },
      }),
    []
  );

  const bookingService = useBookingService();

  const { data: payment, isLoading: loadingPayment, error: paymentError } = usePayment(
    paymentService,
    id ?? null
  );

  const { data: booking } = useBooking(
    bookingService,
    payment?.booking_id ?? null
  );

  const { data: payments = [] } = usePaymentsByBooking(
    paymentService,
    booking?.id ?? null
  );

  const handlePrint = () => {
    window.print();
  };

  if (!id) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/sales/payments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Link>
        </Button>
        <p className="text-muted-foreground">Invalid payment ID</p>
      </div>
    );
  }

  if (loadingPayment) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-80 w-full max-w-lg" />
      </div>
    );
  }

  if (paymentError || !payment) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/sales/payments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Link>
        </Button>
        <p className="text-muted-foreground">
          {paymentError?.message || "Payment not found"}
        </p>
      </div>
    );
  }

  // When we have booking, show combined invoice + receipt
  if (booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sales/payments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payments
            </Link>
          </Button>
        </div>
        <BookingInvoiceReceipt
          booking={booking}
          payments={payments}
          showPrintButton={true}
          onPrint={handlePrint}
        />
      </div>
    );
  }

  // Fallback: minimal invoice+receipt when booking not yet loaded
  const fallbackBooking: Booking = {
    id: payment.booking_id,
    tenant_id: "",
    booking_number: payment.booking_id?.slice(0, 8).toUpperCase() || "—",
    customer_name: undefined,
    event_id: "",
    status: "—",
    subtotal_amount: payment.amount,
    discount_amount: 0,
    tax_amount: 0,
    tax_rate: 0,
    total_amount: payment.amount,
    currency: payment.currency,
    due_balance: 0,
    items: [] as BookingItem[],
    created_at: payment.created_at instanceof Date ? payment.created_at : new Date(payment.created_at),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/sales/payments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Link>
        </Button>
      </div>
      <BookingInvoiceReceipt
        booking={fallbackBooking}
        payments={[payment]}
        showPrintButton={true}
        onPrint={handlePrint}
      />
    </div>
  );
}
