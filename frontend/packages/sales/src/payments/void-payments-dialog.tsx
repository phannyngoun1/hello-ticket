/**
 * Void Payments Dialog Component
 *
 * Dialog for voiding payments for a booking.
 */

import { useState, useMemo } from "react";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  useToast,
  Checkbox,
  Textarea,
} from "@truths/ui";
import type { Booking } from "../bookings/types";
import type { Payment } from "./types";
import { usePaymentsByBooking, useVoidPayment } from "./use-payments";
import { PaymentService } from "./payment-service";
import { api } from "@truths/api";

export interface VoidPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

export function VoidPaymentsDialog({
  open,
  onOpenChange,
  booking,
}: VoidPaymentsDialogProps) {
  const density = useDensityStyles();
  const { toast } = useToast();
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const [remarks, setRemarks] = useState<string>("");
  const [isVoiding, setIsVoiding] = useState(false);

  // Create payment service
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

  // Fetch existing payments for this booking
  const { data: existingPayments = [] } = usePaymentsByBooking(
    paymentService,
    booking?.id || null
  );

  // Void payment mutation
  const voidPaymentMutation = useVoidPayment(paymentService);

  const canVoidPayment = (payment: Payment): boolean => {
    // Cannot void if booking is cancelled (payments should be voided before cancellation)
    if (booking?.status === "cancelled") {
      return false;
    }
    // Can only void completed payments
    return payment.status === "completed";
  };

  const voidablePayments = existingPayments.filter((p) => canVoidPayment(p));

  const handleClose = () => {
    setSelectedPaymentIds(new Set());
    setRemarks("");
    setIsVoiding(false);
    onOpenChange(false);
  };

  const handleTogglePayment = (paymentId: string) => {
    setSelectedPaymentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPaymentIds.size === voidablePayments.length) {
      setSelectedPaymentIds(new Set());
    } else {
      setSelectedPaymentIds(new Set(voidablePayments.map((p) => p.id)));
    }
  };

  const handleVoidSelected = async () => {
    if (selectedPaymentIds.size === 0) return;

    setIsVoiding(true);
    const paymentIds = Array.from(selectedPaymentIds);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const paymentId of paymentIds) {
        try {
          await voidPaymentMutation.mutateAsync(paymentId);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error voiding payment ${paymentId}:`, error);
        }
      }

      if (errorCount === 0) {
        toast({
          title: "Success",
          description: `Successfully voided ${successCount} payment${successCount > 1 ? "s" : ""}`,
        });
        handleClose();
      } else if (successCount > 0) {
        toast({
          title: "Partial Success",
          description: `Voided ${successCount} payment${successCount > 1 ? "s" : ""}, ${errorCount} failed`,
          variant: "default",
        });
        // Keep dialog open to see which ones failed
      } else {
        toast({
          title: "Error",
          description: `Failed to void ${errorCount} payment${errorCount > 1 ? "s" : ""}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsVoiding(false);
    }
  };

  if (!booking) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Void Payments</DialogTitle>
            <DialogDescription>
              Void payments for booking {booking.booking_number}. Payments can
              be voided for bookings with payments (full or partial), but cannot
              be voided if the booking is already cancelled.
            </DialogDescription>
          </DialogHeader>

          <div className={cn("space-y-4", density.paddingForm)}>
            {voidablePayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No voidable payments found for this booking.</p>
                {booking.status === "cancelled" ? (
                  <p className="text-sm mt-2 text-destructive">
                    Payments cannot be voided for cancelled bookings. Payments must be voided before cancellation.
                  </p>
                ) : (
                  <p className="text-sm mt-2">
                    Only payments that have been processed (paid, processing, failed) can be voided. Pending payments cannot be voided since no payment has been made yet.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Voidable Payments</Label>
                    {voidablePayments.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-8 text-xs"
                      >
                        {selectedPaymentIds.size === voidablePayments.length
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                    )}
                  </div>
                  <div className="rounded-lg border divide-y max-h-[300px] overflow-y-auto">
                    {voidablePayments.map((payment) => {
                      const methodLabels: Record<string, string> = {
                        credit_card: "Credit Card",
                        debit_card: "Debit Card",
                        paypal: "PayPal",
                        bank_transfer: "Bank Transfer",
                        cash: "Cash",
                        other: "Other",
                      };
                      const isSelected = selectedPaymentIds.has(payment.id);
                      return (
                        <label
                          key={payment.id}
                          className="p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleTogglePayment(payment.id)}
                            disabled={isVoiding}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold">
                                  {payment.currency || "USD"}{" "}
                                  {payment.amount.toFixed(2)}
                                </span>
                              </div>
                              {payment.transaction_reference && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-mono">
                                    {payment.transaction_reference}
                                  </span>
                                </div>
                              )}
                              {payment.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {payment.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                              {methodLabels[payment.payment_method] ||
                                payment.payment_method}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Textarea
                    id="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add remarks for voiding payments..."
                    rows={3}
                    disabled={isVoiding}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isVoiding}>
              Cancel
            </Button>
            {voidablePayments.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleVoidSelected}
                disabled={selectedPaymentIds.size === 0 || isVoiding}
              >
                {isVoiding ? "Voiding..." : `Void Selected (${selectedPaymentIds.size})`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

