/**
 * Booking Detail Component
 *
 * Display detailed information about a booking with optional edit and activity views.
 */

import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Edit,
  MoreVertical,
  Info,
  Database,
  Ticket,
  DollarSign,
  Calendar,
  User,
  XCircle,
} from "lucide-react";
import { Booking } from "./types";
import { EventService } from "@truths/ticketing/events";
import { ShowService } from "@truths/ticketing/shows";
import { useEvent } from "@truths/ticketing/events";
import { useShow } from "@truths/ticketing/shows";
import { CustomerService } from "../customers/customer-service";
import { useCustomer } from "../customers/use-customers";
import { PaymentService } from "../payments/payment-service";
import {
  usePaymentsByBooking,
  useCreatePayment,
} from "../payments/use-payments";
import { PaymentDialog } from "../payments/payment-dialog";
import { VoidPaymentsDialog } from "../payments/void-payments-dialog";
import { api } from "@truths/api";
import type { Payment } from "../payments/types";

export interface BookingDetailProps {
  className?: string;
  data?: Booking;
  loading?: boolean;
  error?: Error | null;

  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;
  onEdit?: (data: Booking) => void;
  onPayment?: (booking: Booking) => void;

  customActions?: (data: Booking) => React.ReactNode;
}

export function BookingDetail({
  className,
  data,
  loading = false,
  error = null,

  showMetadata = false,
  editable = true,
  onEdit,
  onPayment,

  customActions,
}: BookingDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "information" | "payments" | "metadata"
  >("information");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [voidPaymentDialogOpen, setVoidPaymentDialogOpen] = useState(false);

  // Initialize services
  const eventService = useMemo(
    () =>
      new EventService({
        apiClient: api,
        endpoints: {
          events: "/api/v1/ticketing/events",
        },
      }),
    []
  );

  const showService = useMemo(
    () =>
      new ShowService({
        apiClient: api,
        endpoints: {
          shows: "/api/v1/ticketing/shows",
        },
      }),
    []
  );

  const customerService = useMemo(
    () =>
      new CustomerService({
        apiClient: api,
        endpoints: {
          customers: "/api/v1/sales/customers",
        },
      }),
    []
  );

  const paymentService = useMemo(
    () =>
      new PaymentService({
        apiClient: api,
        endpoints: {
          payments: "/api/v1/sales/payments",
        },
      }),
    []
  );

  // Fetch event, show, customer, and payment data
  const { data: eventData, isLoading: isLoadingEvent } = useEvent(
    eventService,
    data?.event_id || null
  );
  const { data: showData, isLoading: isLoadingShow } = useShow(
    showService,
    eventData?.show_id || null
  );
  const { data: customerData, isLoading: isLoadingCustomer } = useCustomer(
    customerService,
    data?.customer_id || null
  );
  const { data: payments = [], isLoading: isLoadingPayments } =
    usePaymentsByBooking(paymentService, data?.id || null);
  const createPaymentMutation = useCreatePayment(paymentService);

  // All hooks must be called before any early returns

  const getBookingDisplayName = () => {
    return data?.booking_number || data?.id || "";
  };

  const displayName = useMemo(
    () => (data ? getBookingDisplayName() : ""),
    [data, data?.booking_number]
  );

  const formatDate = (value?: Date | string) => {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };

  const formatFieldValue = (value: unknown) => {
    if (value === null || value === undefined) return "N/A";
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "N/A";
      const potentialDate = new Date(trimmed);
      if (!Number.isNaN(potentialDate.getTime())) {
        return potentialDate.toLocaleString();
      }
      return trimmed;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  // Calculate payment totals
  const paymentTotals = useMemo(() => {
    const totalPaid = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    // Use due_balance from booking model if available, otherwise calculate
    const balanceDue =
      data?.due_balance !== undefined
        ? Math.max(0, data.due_balance)
        : Math.max(0, (data?.total_amount || 0) - totalPaid);
    return {
      totalPaid,
      balanceDue,
    };
  }, [payments, data?.total_amount, data?.due_balance]);

  // Check if there are any completed payments that can be voided
  const hasVoidablePayments = useMemo(() => {
    if (!data || data.status === "cancelled") return false;
    return payments.some((p) => p.status === "completed");
  }, [payments, data]);

  // Check if payment is allowed
  const canProcessPayment = (status: string): boolean => {
    const normalizedStatus = status.toLowerCase().trim();
    return (
      normalizedStatus === "pending" ||
      normalizedStatus === "confirmed" ||
      normalizedStatus === "reserved"
    );
  };

  const handlePaymentSubmit = async (
    input: import("../payments/types").CreatePaymentInput
  ) => {
    try {
      await createPaymentMutation.mutateAsync(input);
      setPaymentDialogOpen(false);
      onPayment?.(data!);
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error: {error.message}</div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No booking selected</div>
        </div>
      </Card>
    );
  }

  const hasMetadata = showMetadata;

  return (
    <Card className={cn("p-6", className)}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
              <Info className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>

              <div className="flex items-center gap-4 mt-2">
                {data.status && (
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      data.status === "confirmed" || data.status === "paid"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : data.status === "cancelled" ||
                            data.status === "refunded"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    )}
                  >
                    {data.status.toUpperCase()}
                  </span>
                )}
                {data.payment_status && (
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      data.payment_status === "paid"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    )}
                  >
                    Payment: {data.payment_status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {customActions?.(data)}
              {/* Void Payment button if there are payments */}
              {data && hasVoidablePayments && (
                <Button
                  onClick={() => setVoidPaymentDialogOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Void Payment
                </Button>
              )}
              {/* Pay button for pending bookings */}
              {data &&
                canProcessPayment(data.status) &&
                paymentTotals.balanceDue > 0 && (
                  <Button
                    onClick={() => setPaymentDialogOpen(true)}
                    className="gap-2"
                    disabled={createPaymentMutation.isPending}
                  >
                    <DollarSign className="h-4 w-4" />
                    Pay {data.currency || "USD"}{" "}
                    {paymentTotals.balanceDue.toFixed(2)}
                  </Button>
                )}
            </div>
            {(editable && onEdit) || customActions ? (
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Actions">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {editable && onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(data)}>
                        <Edit className="mr-2 h-3.5 w-3.5" /> Edit booking
                      </DropdownMenuItem>
                    )}

                    {customActions && customActions(data)}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="border-b mb-4">
            <div className="flex gap-4">
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "information"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("information")}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Information
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "payments"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("payments")}
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payments ({payments.length})
                </span>
              </button>
              {hasMetadata && (
                <button
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "metadata"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("metadata")}
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Metadata
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-0">
            {/* Information Tab */}
            {activeTab === "information" && (
              <div className="space-y-6">
                <div>
                  <dl className="grid gap-4 md:grid-cols-3">
                    <div>
                      <dt className="text-sm font-medium flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        Customer
                      </dt>
                      <dd className="mt-1 text-sm text-muted-foreground">
                        {(() => {
                          if (!data.customer_id) {
                            return "-";
                          }
                          if (isLoadingCustomer) {
                            return (
                              <span className="text-muted-foreground">
                                Loading...
                              </span>
                            );
                          }
                          if (customerData?.code && customerData?.name) {
                            return `${customerData.code} - ${customerData.name}`;
                          }
                          if (customerData?.name) {
                            return customerData.name;
                          }
                          if (customerData?.code) {
                            return customerData.code;
                          }
                          return "-";
                        })()}
                      </dd>
                    </div>
                    {data.event_id && (
                      <div>
                        <dt className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Event
                        </dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {(() => {
                            if (isLoadingEvent || isLoadingShow) {
                              return (
                                <span className="text-muted-foreground">
                                  Loading...
                                </span>
                              );
                            }
                            if (showData?.name && eventData?.title) {
                              return `${showData.name} - ${eventData.title}`;
                            }
                            if (eventData?.title) {
                              return eventData.title;
                            }
                            return formatFieldValue(data.event_id);
                          })()}
                        </dd>
                      </div>
                    )}
                    {data.created_at && (
                      <div>
                        <dt className="text-sm font-medium">Created</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(data.created_at)}
                        </dd>
                      </div>
                    )}
                    {data.updated_at && (
                      <div>
                        <dt className="text-sm font-medium">Last Updated</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(data.updated_at)}
                        </dd>
                      </div>
                    )}
                    {data.reserved_until && (
                      <div>
                        <dt className="text-sm font-medium">Reserved Until</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(data.reserved_until)}
                        </dd>
                      </div>
                    )}
                    {data.cancelled_at && (
                      <div>
                        <dt className="text-sm font-medium text-destructive">
                          Cancelled At
                        </dt>
                        <dd className="mt-1 text-sm text-destructive">
                          {formatDate(data.cancelled_at)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Booking Items Section */}
                {data.items && data.items.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Booking Items ({data.items.length})
                    </h3>
                    <Card className="overflow-hidden border">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Seat
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Section
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Row
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Ticket Number
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Price
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {data.items.map((item, index) => (
                              <tr
                                key={item.id || index}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">
                                  {item.seat_number || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {item.section_name || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {item.row_name || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                                  {item.ticket_number || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-right">
                                  {item.currency || data.currency || "USD"}{" "}
                                  {item.unit_price?.toFixed(2) || "0.00"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-muted/50 border-t">
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-3 text-sm font-medium text-right pr-8"
                              >
                                Subtotal:
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-right whitespace-nowrap">
                                {data.currency || "USD"}{" "}
                                {data.subtotal_amount?.toFixed(2) || "0.00"}
                              </td>
                            </tr>
                            {data.discount_amount > 0 && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-4 py-3 text-sm font-medium text-right pr-8"
                                >
                                  Discount
                                  {data.discount_type === "percentage" &&
                                  data.discount_value
                                    ? ` (${data.discount_value}%)`
                                    : ""}
                                  :
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground text-right whitespace-nowrap">
                                  -{data.currency || "USD"}{" "}
                                  {data.discount_amount?.toFixed(2) || "0.00"}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-3 text-sm font-medium text-right pr-8"
                              >
                                Tax ({((data.tax_rate || 0) * 100).toFixed(0)}
                                %):
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground text-right whitespace-nowrap">
                                {data.currency || "USD"}{" "}
                                {data.tax_amount?.toFixed(2) || "0.00"}
                              </td>
                            </tr>
                            <tr className="border-t-2 border-border">
                              <td
                                colSpan={5}
                                className="px-4 py-3 text-sm font-bold text-right pr-8"
                              >
                                Total:
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-right whitespace-nowrap">
                                {data.currency || "USD"}{" "}
                                {data.total_amount?.toFixed(2) || "0.00"}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={5}
                                className="px-4 py-3 text-sm font-medium text-right pr-8"
                              >
                                Paid Amount:
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground text-right whitespace-nowrap">
                                {data.currency || "USD"}{" "}
                                {paymentTotals.totalPaid.toFixed(2)}
                              </td>
                            </tr>
                            <tr className="border-t-2 border-border">
                              <td
                                colSpan={5}
                                className="px-4 py-3 text-sm font-bold text-right pr-8"
                              >
                                Balance Due:
                              </td>
                              <td
                                className={cn(
                                  "px-4 py-3 text-sm font-bold text-right whitespace-nowrap",
                                  paymentTotals.balanceDue > 0
                                    ? "text-destructive"
                                    : "text-green-600"
                                )}
                              >
                                {data.currency || "USD"}{" "}
                                {paymentTotals.balanceDue.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                {/* Payment Summary */}
                <Card className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total Amount
                      </div>
                      <div className="text-lg font-semibold">
                        {data.currency || "USD"}{" "}
                        {data.total_amount?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Paid Amount
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {data.currency || "USD"}{" "}
                        {paymentTotals.totalPaid.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Balance Due
                      </div>
                      <div
                        className={cn(
                          "text-lg font-semibold",
                          paymentTotals.balanceDue > 0
                            ? "text-destructive"
                            : "text-green-600"
                        )}
                      >
                        {data.currency || "USD"}{" "}
                        {paymentTotals.balanceDue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Payment History */}
                <div>
                  <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                    Payment History
                  </h3>
                  {isLoadingPayments ? (
                    <Card className="p-6">
                      <div className="text-center text-muted-foreground">
                        Loading payments...
                      </div>
                    </Card>
                  ) : payments.length === 0 ? (
                    <Card className="p-6">
                      <div className="text-center text-muted-foreground">
                        No payments recorded
                      </div>
                    </Card>
                  ) : (
                    <Card className="overflow-hidden border">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Method
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Reference
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {payments.map((payment: Payment) => (
                              <tr
                                key={payment.id}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {formatDate(payment.created_at)}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold">
                                  {payment.currency || "USD"}{" "}
                                  {payment.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {(() => {
                                    const methodLabels: Record<string, string> =
                                      {
                                        credit_card: "Credit Card",
                                        debit_card: "Debit Card",
                                        paypal: "PayPal",
                                        bank_transfer: "Bank Transfer",
                                        cash: "Cash",
                                        other: "Other",
                                      };
                                    return (
                                      methodLabels[payment.payment_method] ||
                                      payment.payment_method
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                                  {payment.transaction_reference || "-"}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                      payment.status === "completed"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : payment.status === "void"
                                          ? "bg-gray-50 text-gray-700 border-gray-200"
                                          : "bg-gray-50 text-gray-700 border-gray-200"
                                    )}
                                  >
                                    {payment.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === "metadata" && (
              <div className="space-y-6">
                <Card>
                  <div className="p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      {data && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          booking={data}
          onSubmit={handlePaymentSubmit}
          isLoading={createPaymentMutation.isPending}
        />
      )}

      {/* Void Payment Dialog */}
      {data && (
        <VoidPaymentsDialog
          open={voidPaymentDialogOpen}
          onOpenChange={setVoidPaymentDialogOpen}
          booking={data}
        />
      )}
    </Card>
  );
}
