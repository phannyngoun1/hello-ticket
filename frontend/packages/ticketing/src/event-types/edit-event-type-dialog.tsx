/**
 * Edit EventType Dialog Component
 *
 * Full-screen dialog for editing existing event-types with form validation
 */

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@truths/ui";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  FullScreenDialog,
  KeyboardShortcut,
  ConfirmationDialog,
} from "@truths/custom-ui";
import { useDensityStyles } from "@truths/utils";
import { useTranslation } from "react-i18next";
import { UpdateEventTypeInput, EventType} from "./types";

export interface EditEventTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  et: EventType | null;
  onSubmit: (id: string, data: UpdateEventTypeInput) => Promise<void>;
  loading?: boolean;
  error?: Error | null;
}

interface FormData {

  code: string;

  name: string;

  }

export function EditEventTypeDialog({
  open,
  onOpenChange,
  et,
  onSubmit,
  loading = false,
  error = null,
}: EditEventTypeDialogProps) {
  const { t } = useTranslation();
  const density = useDensityStyles();
  const [formData, setFormData] = useState<FormData>({

    code: "",

    name: "",

    });
  const [originalFormData, setOriginalFormData] = useState<FormData>({

    code: "",

    name: "",

    });
  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>(
    {}
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [localError, setLocalError] = useState<Error | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Sync error from props
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  // Populate form when et changes or dialog opens
  useEffect(() => {
    if (open && et) {
      const initialData: FormData = {

        code: et.code || "",

        name: et.name || "",

        };
      setFormData(initialData);
      setOriginalFormData(initialData);
      setValidationErrors({});
      setLocalError(null);
      setFormKey((prev) => prev + 1);
    }}, [open, et]);

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.code) {
      errors.code = t(
        "pages.settings.ticketing.et.codeRequired",
        "Code is required"
      );
    }

    if (!formData.name) {
      errors.name = t(
        "pages.settings.ticketing.et.nameRequired",
        "Name is required"
      );
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!et) return;

    try {
      const updateData: UpdateEventTypeInput = {

        code: formData.code,

        name: formData.name,

        };

      await onSubmit(et.id, updateData);

      setShowConfirmDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating EventType:", error);
      setShowConfirmDialog(false);
    }};

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    if (localError) {
      setLocalError(null);
    }};

  const handleClose = () => {
    if (et) {
      setFormData(originalFormData);
    }
    setValidationErrors({});
    onOpenChange(false);
  };

  const handleClear = () => {
    if (et) {
      setFormData({ ...originalFormData });
      setValidationErrors({});
      setLocalError(null);
      setFormKey((prev) => prev + 1);
    }};

  useEffect(() => {
    if (open && et) {
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
      });
    }}, [open, formKey, et]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showConfirmDialog) {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirmDialog(false);
        return;
      }

      if (
        (e.key === "Enter" || e.code === "Enter") &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();
        if (showConfirmDialog) {
          if (!loading) {
            void handleConfirmSubmit();
          }} else {
          if (!loading && validateForm()) {
            setShowConfirmDialog(true);
          }}
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const isDel = e.key === "Delete" || e.code === "Delete";
        const isBackspace = e.key === "Backspace" || e.code === "Backspace";
        if (isDel || isBackspace) {
          e.preventDefault();
          if (!loading) {
            handleClear();
          }
          return;
        }}
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, showConfirmDialog, loading, formData, et]);

  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      label: "Submit",
      keys: ["Enter"],
      metaOrCtrl: true,
    },
    {
      label: "Reset",
      keys: ["Delete"],
      metaOrCtrl: true,
      shift: true,
    },
  ];

  if (!et) {
    return null;
  }

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title={t(
          "pages.settings.ticketing.et.editTitle",
          "Edit EventType"
        )}
        maxWidth="500px"
        loading={loading}
        showClearButton
        onClear={handleClear}
        shortcuts={keyboardShortcuts}
        footer={[
          {
            label: t("common.cancel", "Cancel"),
            variant: "outline",
            type: "button",
            onClick: () => handleClose(),
            disabled: loading,
          },
          {
            label: loading
              ? t("pages.settings.ticketing.et.updating", "Updating...")
              : t("pages.settings.ticketing.et.update", "Update EventType"),
            variant: "default",
            type: "submit",
            onClick: (e) => {
              e?.preventDefault();
              if (formRef.current) {
                formRef.current.requestSubmit();
              }},
            disabled: loading,
          },
        ]}
      >
        <form
          ref={formRef}
          key={formKey}
          onSubmit={handleSubmit}
          className={cn(density.spacingFormSection, "w-full")}
        >
          <div className={cn("bg-background border border-border rounded-lg shadow-sm mt-12", density.paddingForm)}>
            <div className={cn("grid grid-cols-1", density.gapForm)}>

              <FormItem className={density.spacingFormItem}>
                <FormLabel htmlFor="code" className={cn(density.textSizeLabel, "font-medium")}>
                  {t("pages.settings.ticketing.et.code", "Code")} *
                </FormLabel>
                <FormControl>
                  <Input
                    id="code"
                    ref={firstInputRef}
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.code && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder={t(
                      "pages.settings.ticketing.et.codePlaceholder",
                      "Enter code"
                    )}
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>{validationErrors.code}</FormMessage>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel htmlFor="name" className={cn(density.textSizeLabel, "font-medium")}>
                  {t("pages.settings.ticketing.et.name", "Name")} *
                </FormLabel>
                <FormControl>
                  <Input
                    id="name"

                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.name && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder={t(
                      "pages.settings.ticketing.et.namePlaceholder",
                      "Enter name"
                    )}
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>{validationErrors.name}</FormMessage>
              </FormItem>

            </div>
          </div>

          {localError && (
            <div className={cn("rounded-md bg-destructive/10 border border-destructive/20", density.paddingContainer, density.textSizeSmall, "text-destructive")}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive"></div>
                <span className="font-semibold">
                  {t("common.error", "ERROR")}:
                </span>
                <span>
                  {localError.message ||
                    t(
                      "pages.settings.ticketing.et.updateError",
                      "Failed to update EventType"
                    )}
                </span>
              </div>
            </div>
          )}
        </form>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          setShowConfirmDialog(open);
          if (!open) {
            setTimeout(() => {
              firstInputRef.current?.focus();
            }, 0);
          }}}
        title={t(
          "pages.settings.ticketing.et.confirmUpdateTitle",
          "Confirm EventType Update"
        )}
        description={
          <>
            <p className={cn("mb-3", density.textSizeSmall)}>
              {t(
                "pages.settings.ticketing.et.confirmUpdateDescription",
                "Are you sure you want to update this event-type?"
              )}
            </p>
          </>
        }
        confirmAction={{label: loading
              ? t("pages.settings.ticketing.et.updating", "Updating...")
              : t(
                  "pages.settings.ticketing.et.confirmUpdate",
                  "Confirm & Update"
                ),
            onClick: handleConfirmSubmit,
            loading,
            disabled: loading,
          }}
        cancelAction={{label: t("common.cancel", "Cancel"),
            variant: "outline",
            disabled: loading,
            onClick: () => setShowConfirmDialog(false),
        }}
      />
    </>
  );
}
