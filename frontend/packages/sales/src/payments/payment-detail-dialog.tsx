import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@truths/ui";
import { DescriptionList, DescriptionItem } from "@truths/custom-ui";
import { formatDate } from "@truths/utils";
import { api } from "@truths/api";
import { BookingService, useBooking } from "../bookings";
import type { Payment } from "./types";

export interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
}

export function PaymentDetailDialog({
  open,
  onOpenChange,
  payment,
}: PaymentDetailDialogProps) {
  const bookingService = useMemo(
    () =>
      new BookingService({
        apiClient: api,
        endpoints: {
          bookings: "/api/v1/sales/bookings",
        },
      }),
    []
  );

  const { data: booking, isLoading: isLoadingBooking } = useBooking(
    bookingService,
    payment?.booking_id ?? null
  );

  if (!payment) return null;

  const paymentMethodLabels: Record<string, string> = {
    credit_card: "Credit Card",
    debit_card: "Debit Card",
    paypal: "PayPal",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    other: "Other",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            View payment information and transaction details.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <DescriptionList columns={2}>
            <DescriptionItem
              label="Payment Code"
              value={payment.payment_code || "N/A"}
              valueClassName="font-mono"
            />
            <DescriptionItem
              label="Amount"
              value={`${payment.currency} ${payment.amount.toFixed(2)}`}
              valueClassName="font-semibold"
            />
            <DescriptionItem
              label="Status"
              value={
                <span className="capitalize">{payment.status.toLowerCase()}</span>
              }
            />
            <DescriptionItem
              label="Payment Method"
              value={
                paymentMethodLabels[payment.payment_method] ||
                payment.payment_method
              }
            />
            <DescriptionItem
              label="Booking"
              value={
                isLoadingBooking
                  ? "Loading..."
                  : booking?.booking_number || payment.booking_id
              }
              valueClassName="font-mono"
              span="col-span-2"
            />
            <DescriptionItem
              label="Transaction Reference"
              value={payment.transaction_reference}
              span="col-span-2"
              valueClassName="font-mono"
            />
            <DescriptionItem
              label="Notes"
              value={payment.notes}
              span="col-span-2"
            />
            <DescriptionItem
              label="Created At"
              value={formatDate(payment.created_at)}
            />
            <DescriptionItem
              label="Processed At"
              value={payment.processed_at ? formatDate(payment.processed_at) : "N/A"}
            />
          </DescriptionList>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
