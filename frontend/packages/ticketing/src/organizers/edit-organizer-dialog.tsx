/**
 * Edit Organizer Dialog Component
 *
 * Full-screen dialog for editing existing organizers using shared form logic.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { OrganizerForm, type OrganizerFormData } from "./organizer-form";
import type { Organizer, UpdateOrganizerInput } from "./types";

export interface EditOrganizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateOrganizerInput) => Promise<void>;
  organizer: Organizer | null;
  title?: string;
  maxWidth?: string;
}

export function EditOrganizerDialog({
  open,
  onOpenChange,
  onSubmit,
  organizer,
  title = "Edit Organizer",
  maxWidth = "720px",
}: EditOrganizerDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<OrganizerFormData | null>(null);

  const defaultValues = useMemo(() => {
    if (!organizer) return undefined;
    return {






      name: organizer.name ?? "",


    };
  }, [organizer]);

  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      const firstInput = formRef.current?.querySelector(
        "input, textarea, select"
      ) as HTMLElement | null;
      firstInput?.focus();
    });
  }, [open, formKey]);

  const handleFormSubmit = async (data: OrganizerFormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  // Build payload excludes timestamp fields (created_at, updated_at) - backend manages these
  const buildPayload = useMemo(() => {
    return (data: OrganizerFormData): UpdateOrganizerInput => ({






      name: data.name,


    });
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData || !organizer) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit(organizer.id, payload);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    } catch (error) {
      console.error("Error updating organizer:", error);
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

  if (!organizer) {
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
          <OrganizerForm
            ref={formRef}
            key={`${organizer.id}-${formKey}`}
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
        title="Confirm Organizer Update"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to update this organizer?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}
