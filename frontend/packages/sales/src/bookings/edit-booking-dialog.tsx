/**
 * Edit Booking Dialog Component
 *
 * Full-screen dialog for editing existing bookings using shared form logic.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { BookingForm, type BookingFormData } from "./booking-form";
import type { Booking, UpdateBookingInput } from "./types";

export interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateBookingInput) => Promise<void>;
  booking: Booking | null;
  title?: string;
  maxWidth?: string;
}

export function EditBookingDialog({
  open,
  onOpenChange,
  onSubmit,
  booking,
  title = "Edit Booking",
  maxWidth = "720px",
}: EditBookingDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null);

  const defaultValues = useMemo(() => {
    if (!booking) return undefined;
    return {
      code: booking.booking_number ?? "",
      name: booking.booking_number ?? "",
    };
  }, [booking]);

  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      const firstInput = formRef.current?.querySelector(
        "input, textarea, select"
      ) as HTMLElement | null;
      firstInput?.focus();
    });
  }, [open, formKey]);

  const handleFormSubmit = async (data: BookingFormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  // Build payload - map form data to UpdateBookingInput
  const buildPayload = useMemo(() => {
    return (_data: BookingFormData): UpdateBookingInput => ({});
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData || !booking) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit(booking.id, payload);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    } catch (error) {
      console.error("Error updating booking:", error);
      setShowConfirmDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFormKey((prev) => prev + 1);
  };

  const handleDialogSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleConfirmDialogChange = (dialogOpen: boolean) => {
    setShowConfirmDialog(dialogOpen);
    if (!dialogOpen) {
      setPendingFormData(null);
      setTimeout(() => {
        const firstInput = formRef.current?.querySelector(
          "input, textarea, select"
        ) as HTMLElement;
        firstInput?.focus();
      }, 0);
    }
  };

  const confirmAction = {
    label: isSubmitting ? "Updating..." : "Confirm & Update",
    onClick: handleConfirmSubmit,
    loading: isSubmitting,
    disabled: isSubmitting,
    variant: "default" as const,
  };

  const cancelAction = {
    label: "Cancel",
    variant: "outline" as const,
    disabled: isSubmitting,
  };

  if (!booking) {
    return null;
  }

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title={title}
        maxWidth={maxWidth}
        loading={isSubmitting}
        formSelector={formRef}
        autoSubmitShortcut
        showClearButton
        onClear={handleClear}
        showCancelButton
        onCancel={handleClose}
        showSubmitButton
        onSubmit={handleDialogSubmit}
      >
        <div
          className={cn(
            "bg-background border border-border rounded-lg shadow-sm mt-12",
            density.paddingForm
          )}
        >
          <BookingForm
            ref={formRef}
            key={`${booking.id}-${formKey}`}
            defaultValues={defaultValues}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
            mode="edit"
          />
        </div>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={handleConfirmDialogChange}
        title="Confirm Booking Update"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to update this booking?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}
