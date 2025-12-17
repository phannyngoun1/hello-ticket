/**
 * Edit {{EntityName}} Dialog Component
 *
 * Full-screen dialog for editing existing {{entity-plural}} using shared form logic.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { {{EntityName}}Form, type {{EntityName}}FormData } from "./{{entity-name}}-form";
import type { {{EntityName}}, Update{{EntityName}}Input } from "./types";

export interface Edit{{EntityName}}DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: Update{{EntityName}}Input) => Promise<void>;
  {{entityName}}: {{EntityName}} | null;
  title?: string;
  maxWidth?: string;
}

export function Edit{{EntityName}}Dialog({
  open,
  onOpenChange,
  onSubmit,
  {{entityName}},
  title = "Edit {{EntityName}}",
  maxWidth = "720px",
}: Edit{{EntityName}}DialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<{{EntityName}}FormData | null>(null);

  const defaultValues = useMemo(() => {
    if (!{{entityName}}) return undefined;
    return {
{{#fields}}
{{#unless isSystemField}}
      {{name}}: {{#if isDate}}{{entityName}}.{{name}} instanceof Date ? {{entityName}}.{{name}}.toISOString().split('T')[0] : {{entityName}}.{{name}} ? new Date({{entityName}}.{{name}}).toISOString().split('T')[0] : ""{{else}}{{entityName}}.{{name}}{{#if isBoolean}} ?? false{{else}}{{#if isNumber}} ?? 0{{else}} ?? ""{{/if}}{{/if}}{{/if}}{{/if}},
{{/unless}}
{{/fields}}
    };
  }, [{{entityName}}]);

  useEffect(() => {
    if (!open) return;

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
  const buildPayload = useMemo(() => {
    return (data: {{EntityName}}FormData): Update{{EntityName}}Input => ({
{{#fields}}
{{#unless isSystemField}}
      {{name}}: {{updateValue}},
{{/unless}}
{{/fields}}
    });
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData || !{{entityName}}) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit({{entityName}}.id, payload);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    } catch (error) {
      console.error("Error updating {{entity-name}}:", error);
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

  if (!{{entityName}}) {
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
          <{{EntityName}}Form
            ref={formRef}
            key={`${{{entityName}}.id}-${formKey}`}
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
        title="Confirm {{EntityName}} Update"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to update this {{entity-name}}?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}
