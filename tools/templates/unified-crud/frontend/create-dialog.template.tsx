/**
 * Create {{EntityName}} Dialog Component
 *
 * Full-screen dialog for creating new {{entity-plural}} using the shared form component.
 */

import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { {{EntityName}}Form, type {{EntityName}}FormData } from "./{{entity-name}}-form";
import type { Create{{EntityName}}Input } from "./types";

export interface Create{{EntityName}}DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Create{{EntityName}}Input) => Promise<void>;
  title?: string;
  maxWidth?: string;
}

export function Create{{EntityName}}Dialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Create {{EntityName}}",
  maxWidth = "720px",
}: Create{{EntityName}}DialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<{{EntityName}}FormData | null>(null);

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

  const handleFormSubmit = async (data: {{EntityName}}FormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  // Build payload excludes timestamp fields (created_at, updated_at) - backend manages these
  // createValue is null for timestamp fields, so they are automatically excluded
  const buildPayload = useMemo(() => {
    return (data: {{EntityName}}FormData): Create{{EntityName}}Input => ({
{{#fields}}
{{#if createValue}}
      {{name}}: {{createValue}},
{{/if}}
{{/fields}}
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
      console.error("Error creating {{entity-name}}:", error);
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
          <{{EntityName}}Form
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
        title="Confirm {{EntityName}} Creation"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to create this {{entity-name}}?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}

