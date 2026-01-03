/**
 * Edit Venue Dialog Component
 *
 * Full-screen dialog for editing existing venues using shared form logic.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { VenueForm, type VenueFormData } from "./venue-form";
import type { Venue, UpdateVenueInput } from "./types";

export interface EditVenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateVenueInput) => Promise<void>;
  venue: Venue | null;
  title?: string;
  maxWidth?: string;
}

export function EditVenueDialog({
  open,
  onOpenChange,
  onSubmit,
  venue,
  title = "Edit Venue",
  maxWidth = "720px",
}: EditVenueDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<VenueFormData | null>(null);

  const defaultValues = useMemo(() => {
    if (!venue) return undefined;
    return {
      name: venue.name ?? "",
      description: venue.description ?? "",
      venue_type: venue.venue_type ?? "",
      capacity: venue.capacity ?? undefined,
      parking_info: venue.parking_info ?? "",
      accessibility: venue.accessibility ?? "",
      amenities: venue.amenities?.join(", ") ?? "",
      opening_hours: venue.opening_hours ?? "",
      phone: venue.phone ?? "",
      email: venue.email ?? "",
      website: venue.website ?? "",
      street_address: venue.street_address ?? "",
      city: venue.city ?? "",
      state_province: venue.state_province ?? "",
      postal_code: venue.postal_code ?? "",
      country: venue.country ?? "",
    };
  }, [venue]);

  useEffect(() => {
    if (!open) return;

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
    return (data: VenueFormData): UpdateVenueInput => ({
      code: undefined,
      name: data.name,
      description: data.description || undefined,
      venue_type: data.venue_type || undefined,
      capacity: data.capacity || undefined,
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
    if (!pendingFormData || !venue) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit(venue.id, payload);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    } catch (error) {
      console.error("Error updating venue:", error);
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

  if (!venue) {
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
          <VenueForm
            ref={formRef}
            key={`${venue.id}-${formKey}`}
            defaultValues={defaultValues}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
          />
        </div>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={handleConfirmDialogChange}
        title="Confirm Venue Update"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to update this venue?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}
