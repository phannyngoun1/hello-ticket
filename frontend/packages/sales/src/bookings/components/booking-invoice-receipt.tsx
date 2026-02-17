/**
 * Booking Invoice & Receipt
 *
 * Printable component combining invoice (booking details) and receipt (payment details).
 * - Booking only: prints invoice
 * - Booking with payments: prints invoice + receipt on single page
 */

import { useRef } from "react";
import { Button } from "@truths/ui";
import { Printer } from "lucide-react";
import { formatDate } from "@truths/utils";
import type { Booking } from "../types";
import type { Payment } from "../../payments/types";

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

export interface BookingInvoiceReceiptProps {
  booking: Booking;
  payments?: Payment[];
  /** Show print controls (hidden when printing) */
  showPrintButton?: boolean;
  onPrint?: () => void;
}

export function BookingInvoiceReceipt({
  booking,
  payments = [],
  showPrintButton = true,
  onPrint,
}: BookingInvoiceReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const completedPayments = payments.filter((p) => p.status === "completed");
  const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, booking.total_amount - totalPaid);

  return (
    <div className="space-y-6">
      {showPrintButton && onPrint && (
        <div className="print:hidden">
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice{completedPayments.length > 0 ? " & Receipt" : ""}
          </Button>
        </div>
      )}

      <div
        ref={printRef}
        className="mx-auto max-w-2xl border rounded-lg bg-background p-8 shadow-sm print:shadow-none print:border print:p-6"
      >
        {/* Invoice Section */}
        <div className="border-b pb-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">INVOICE</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {booking.booking_number}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(booking.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{booking.customer_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{booking.status}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Section</th>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Seat</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {booking.items?.map((item, i) => (
                  <tr key={item.id || i}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{item.section_name || "—"}</td>
                    <td className="px-3 py-2">{item.row_name || "—"}</td>
                    <td className="px-3 py-2">{item.seat_number || "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(item.unit_price || 0, booking.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right">
                    Subtotal
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(booking.subtotal_amount, booking.currency)}
                  </td>
                </tr>
                {booking.discount_amount > 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right">
                      Discount
                    </td>
                    <td className="px-3 py-2 text-right">
                      -{formatCurrency(booking.discount_amount, booking.currency)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-right">
                    Tax
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(booking.tax_amount, booking.currency)}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={4} className="px-3 py-2 text-right">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(booking.total_amount, booking.currency)}
                  </td>
                </tr>
                {completedPayments.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right">
                        Paid
                      </td>
                      <td className="px-3 py-2 text-right text-green-600">
                        {formatCurrency(totalPaid, booking.currency)}
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td colSpan={4} className="px-3 py-2 text-right">
                        Balance Due
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(balanceDue, booking.currency)}
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>
        </div>

        {/* Receipt Section - when there are payments */}
        {completedPayments.length > 0 && (
          <div className="pt-6 border-t">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold">PAYMENT RECEIPT(S)</h2>
            </div>

            <div className="space-y-6">
              {completedPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {payment.payment_code || `PAY-${payment.id.slice(0, 8).toUpperCase()}`}
                    </span>
                    <span className="text-lg font-bold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date: </span>
                      {formatDate(payment.created_at)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Method: </span>
                      {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
                    </div>
                    {payment.transaction_reference && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Ref: </span>
                        {payment.transaction_reference}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>Thank you for your business</p>
          <p className="mt-1">
            Generated on {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    </div>
  );
}
