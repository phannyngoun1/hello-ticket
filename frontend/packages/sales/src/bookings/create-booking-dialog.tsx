/**
 * Create Booking Dialog Component
 *
 * Full-screen dialog for creating new bookings using the shared form component.
 */

import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { BookingForm, type BookingFormData } from "./booking-form";
import type { CreateBookingInput } from "./types";

export interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBookingInput) => Promise<void>;
  title?: string;
  maxWidth?: string;
}

export function CreateBookingDialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Create Booking",
  maxWidth = "720px",
}: CreateBookingDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<BookingFormData | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

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

  // Build payload excludes timestamp fields (created_at, updated_at) - backend manages these
  // createValue is null for timestamp fields, so they are automatically excluded
  const buildPayload = useMemo(() => {
    return (data: BookingFormData): CreateBookingInput => ({


      code: undefined,



      name: data.name,


    });
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit(payload);
      setPendingFormData(null);
      setShowConfirmDialog(false);
      // Let parent control closing; consumers can close via onOpenChange
    } catch (error) {
      console.error("Error creating booking:", error);
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
    setPendingFormData(null);
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
        ) as HTMLElement | null;
        firstInput?.focus();
      }, 0);
    }
  };

  const confirmAction = {
    label: isSubmitting ? "Creating..." : "Confirm & Create",
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

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title={title}
        maxWidth={maxWidth}
        loading={isSubmitting}
        formSelector={formRef}
        onClear={handleClear}
        onCancel={handleClose}
        showSubmitButton
        onSubmit={() => {
          formRef.current?.requestSubmit();
        }}
      >
        <div
          className={cn(
            "bg-background border border-border rounded-lg shadow-sm mt-12",
            density.paddingForm
          )}
        >
          <BookingForm
            ref={formRef}
            key={formKey}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
            mode="create"
          />
        </div>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={(dialogOpen) => {
          setShowConfirmDialog(dialogOpen);
          if (!dialogOpen) {
            setPendingFormData(null);
            setTimeout(() => {
              const firstInput = formRef.current?.querySelector(
                "input, textarea, select"
              ) as HTMLElement | null;
              firstInput?.focus();
            }, 0);
          }
        }}
        title="Confirm Booking Creation"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to create this booking?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}

