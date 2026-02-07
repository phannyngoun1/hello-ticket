/**
 * Create Venue Dialog Component
 *
 * Full-screen dialog for creating new venues using the shared form component.
 */

import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { VenueForm, type VenueFormData } from "./venue-form";
import type { CreateVenueInput } from "./types";

export interface CreateVenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateVenueInput) => Promise<void>;
  title?: string;
  maxWidth?: string;
}

export function CreateVenueDialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Create Venue",
  maxWidth = "720px",
}: CreateVenueDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<VenueFormData | null>(null);

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

  const handleFormSubmit = async (data: VenueFormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  // Build payload excludes timestamp fields (created_at, updated_at) - backend manages these
  const buildPayload = useMemo(() => {
    return (data: VenueFormData): CreateVenueInput => ({
      code: undefined,
      name: data.name,
      description: data.description || undefined,
      venue_type: data.venue_type || undefined,
      parking_info: data.parking_info || undefined,
      accessibility: data.accessibility || undefined,
      amenities: data.amenities && data.amenities.length > 0 ? data.amenities : undefined,
      opening_hours: data.opening_hours || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      website: data.website || undefined,
      street_address: data.street_address || undefined,
      city: data.city || undefined,
      state_province: data.state_province || undefined,
      postal_code: data.postal_code || undefined,
      country: data.country || undefined,
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
      console.error("Error creating venue:", error);
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
          <VenueForm
            ref={formRef}
            key={formKey}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
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
        title="Confirm Venue Creation"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to create this venue?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}

