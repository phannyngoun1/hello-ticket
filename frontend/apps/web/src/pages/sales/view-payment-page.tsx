import { useRef, useMemo } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { Button, Skeleton } from "@truths/ui";
import { ArrowLeft, Printer } from "lucide-react";
import { api } from "@truths/api";
import {
  PaymentService,
  usePayment,
  useBooking,
  useBookingService,
} from "@truths/sales";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { formatDate } from "@truths/utils";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  paypal: "PayPal",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  other: "Other",
};

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function ViewPaymentPage() {
  useRequireAuth();
  const { id } = useParams({ from: "/sales/payments/$id" });
  const printRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/sales/payments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Link>
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      <div
        ref={printRef}
        className="mx-auto max-w-lg border rounded-lg bg-background p-8 shadow-sm print:shadow-none print:border print:p-6"
      >
        {/* Receipt Header */}
        <div className="text-center border-b pb-6 mb-6">
          <h1 className="text-xl font-bold">PAYMENT RECEIPT</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {payment.payment_code || `PAY-${payment.id.slice(0, 8).toUpperCase()}`}
          </p>
        </div>

        {/* Amount - prominent */}
        <div className="text-center py-6 border-b mb-6">
          <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
          <p className="text-3xl font-bold">
            {formatCurrency(payment.amount, payment.currency)}
          </p>
          <p
            className={`mt-2 text-sm font-medium ${
              payment.status === "completed" ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {payment.status.toUpperCase()}
          </p>
        </div>

        {/* Receipt Details */}
        <div className="space-y-4 text-sm">
          <ReceiptRow label="Date" value={formatDate(payment.created_at)} />
          <ReceiptRow
            label="Payment Method"
            value={PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
          />
          <ReceiptRow
            label="Booking"
            value={booking?.booking_number || payment.booking_id?.slice(0, 8).toUpperCase() || "—"}
          />
          {booking?.customer_name && (
            <ReceiptRow label="Customer" value={booking.customer_name} />
          )}
          {payment.transaction_reference && (
            <ReceiptRow label="Transaction Ref" value={payment.transaction_reference} />
          )}
          {payment.processed_at && (
            <ReceiptRow label="Processed" value={formatDate(payment.processed_at)} />
          )}
          {payment.notes && (
            <ReceiptRow label="Notes" value={payment.notes} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>Thank you for your payment</p>
          <p className="mt-1">
            Receipt generated on {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}
