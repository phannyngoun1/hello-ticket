/**
 * Payment Dialog Component
 *
 * Dialog for creating payments to settle bookings.
 * Supports partial payments.
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@truths/ui";
import { DollarSign } from "lucide-react";
import type { Booking } from "../bookings/types";
import type { CreatePaymentInput, PaymentMethod } from "./types";
import { usePaymentsByBooking } from "./use-payments";
import { PaymentService } from "./payment-service";
import { api } from "@truths/api";

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onSubmit: (input: CreatePaymentInput) => Promise<void>;
  isLoading?: boolean;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "paypal", label: "PayPal" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

/**
 * Check if a booking status allows payment
 * Payments can only be made for CONFIRMED or RESERVED bookings
 */
function canProcessPayment(status: string): boolean {
  const normalizedStatus = status.toLowerCase().trim();
  return normalizedStatus === "confirmed" || normalizedStatus === "reserved";
}

export function PaymentDialog({
  open,
  onOpenChange,
  booking,
  onSubmit,
  isLoading = false,
}: PaymentDialogProps) {
  const density = useDensityStyles();
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [transactionReference, setTransactionReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

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

  // Calculate remaining balance
  const remainingBalance = useMemo(() => {
    if (!booking) return 0;
    // Sum all completed payments
    const totalPaid = existingPayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, booking.total_amount - totalPaid);
  }, [booking, existingPayments]);

  // Calculate paid amount (for display)
  const paidAmount = useMemo(() => {
    if (!booking) return 0;
    return booking.total_amount - remainingBalance;
  }, [booking, remainingBalance]);

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return;
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setAmount(numericValue);
  };

  const handleSubmit = async () => {
    if (!booking) return;

    // Check if payment is allowed for this booking status
    if (!canProcessPayment(booking.status)) {
      alert(
        `Payment cannot be processed for booking with status '${booking.status}'. Booking must be CONFIRMED or RESERVED before payment.`
      );
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return;
    }

    if (paymentAmount > remainingBalance) {
      // This will be validated on backend, but show warning
      alert(
        `Payment amount (${paymentAmount}) exceeds remaining balance (${remainingBalance})`
      );
      return;
    }

    const input: CreatePaymentInput = {
      booking_id: booking.id,
      amount: paymentAmount,
      payment_method: paymentMethod,
      currency: booking.currency || "USD",
      transaction_reference: transactionReference.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await onSubmit(input);
      // Reset form
      setAmount("");
      setPaymentMethod("cash");
      setTransactionReference("");
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by parent
      console.error("Error creating payment:", error);
    }
  };

  const handleClose = () => {
    setAmount("");
    setPaymentMethod("cash");
    setTransactionReference("");
    setNotes("");
    onOpenChange(false);
  };

  const paymentAmount = parseFloat(amount) || 0;
  const canPay = canProcessPayment(booking?.status || "");
  const isValid =
    canPay && paymentAmount > 0 && paymentAmount <= remainingBalance;

  if (!booking) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Settle Booking Payment
          </DialogTitle>
          <DialogDescription>
            Create a payment for booking {booking.booking_number}. Partial
            payments are supported.
          </DialogDescription>
        </DialogHeader>

        <div className={cn("space-y-4", density.paddingForm)}>
          {/* Booking Status Validation */}
          {!canPay && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">
                Payment Not Allowed
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                Payments can only be processed for bookings with status{" "}
                <strong>CONFIRMED</strong> or <strong>RESERVED</strong>. Current
                status: <strong>{booking.status.toUpperCase()}</strong>
              </p>
            </div>
          )}
          {/* Booking Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-semibold">
                {booking.currency || "USD"} {booking.total_amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid Amount:</span>
              <span className="font-semibold">
                {booking.currency || "USD"} {paidAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-medium">Remaining Balance:</span>
              <span className="font-bold text-primary">
                {booking.currency || "USD"} {remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Payment Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="pl-[5rem]"
                disabled={isLoading || !canPay}
              />
            </div>
            {paymentAmount > 0 && paymentAmount > remainingBalance && (
              <p className="text-sm text-destructive">
                Amount exceeds remaining balance of {booking.currency || "USD"}{" "}
                {remainingBalance.toFixed(2)}
              </p>
            )}
            {paymentAmount > 0 && paymentAmount <= remainingBalance && (
              <p className="text-sm text-muted-foreground">
                New balance after payment: {booking.currency || "USD"}{" "}
                {(remainingBalance - paymentAmount).toFixed(2)}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">
              Payment Method <span className="text-destructive">*</span>
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
              disabled={isLoading || !canPay}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Reference */}
          <div className="space-y-2">
            <Label htmlFor="transaction-reference">Transaction Reference</Label>
            <Input
              id="transaction-reference"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="Optional transaction reference"
              disabled={isLoading || !canPay}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional payment notes"
              rows={3}
              disabled={isLoading || !canPay}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            Process Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
