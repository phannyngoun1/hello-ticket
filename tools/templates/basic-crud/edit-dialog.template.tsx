/**
 * Edit {{EntityName}} Dialog Component
 *
 * Full-screen dialog for editing existing {{entity-plural}} with form validation
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
import { Update{{EntityName}}Input, {{EntityName}}} from "./types";

export interface Edit{{EntityName}}DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  {{entityVar}}: {{EntityName}} | null;
  onSubmit: (id: string, data: Update{{EntityName}}Input) => Promise<void>;
  loading?: boolean;
  error?: Error | null;
}

interface FormData {
  {{#fields}}
  {{#unless isSystemField}}
  {{name}}: {{fieldType}};
  {{/unless}}
  {{/fields}}
}

export function Edit{{EntityName}}Dialog({
  open,
  onOpenChange,
  {{entityVar}},
  onSubmit,
  loading = false,
  error = null,
}: Edit{{EntityName}}DialogProps) {
  const { t } = useTranslation();
  const density = useDensityStyles();
  const [formData, setFormData] = useState<FormData>({
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}: {{defaultValue}},
    {{/unless}}
    {{/fields}}
  });
  const [originalFormData, setOriginalFormData] = useState<FormData>({
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}: {{defaultValue}},
    {{/unless}}
    {{/fields}}
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

  // Populate form when {{entityVar}} changes or dialog opens
  useEffect(() => {
    if (open && {{entityVar}}) {
      const initialData: FormData = {
        {{#fields}}
        {{#unless isSystemField}}
        {{name}}: {{entityVar}}.{{name}} || {{defaultValue}},
        {{/unless}}
        {{/fields}}
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
      setValidationErrors({});
      setLocalError(null);
      setFormKey((prev) => prev + 1);
    }
  }, [open, {{entityVar}}]);

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    {{#fields}}
    {{#unless isSystemField}}
    {{#if required}}
    if (!formData.{{name}}) {
      errors.{{name}} = t(
        "pages.settings.{{packageName}}.{{entityVar}}.{{name}}Required",
        "{{label}} is required"
      );
    }
    {{/if}}
    {{/unless}}
    {{/fields}}

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
    if (!{{entityVar}}) return;

    try {
      const updateData: Update{{EntityName}}Input = {
        {{#fields}}
        {{#unless isSystemField}}
        {{name}}: formData.{{name}},
        {{/unless}}
        {{/fields}}
      };

      await onSubmit({{entityVar}}.id, updateData);

      setShowConfirmDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating {{EntityName}}:", error);
      setShowConfirmDialog(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    if (localError) {
      setLocalError(null);
    }
  };

  const handleClose = () => {
    if ({{entityVar}}) {
      setFormData(originalFormData);
    }
    setValidationErrors({});
    onOpenChange(false);
  };

  const handleClear = () => {
    if ({{entityVar}}) {
      setFormData({ ...originalFormData });
      setValidationErrors({});
      setLocalError(null);
      setFormKey((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (open && {{entityVar}}) {
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
      });
    }
  }, [open, formKey, {{entityVar}}]);

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
          }
        } else {
          if (!loading && validateForm()) {
            setShowConfirmDialog(true);
          }
        }
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
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, showConfirmDialog, loading, formData, {{entityVar}}]);

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

  if (!{{entityVar}}) {
    return null;
  }

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title={t(
          "pages.settings.{{packageName}}.{{entityVar}}.editTitle",
          "Edit {{EntityName}}"
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
              ? t("pages.settings.{{packageName}}.{{entityVar}}.updating", "Updating...")
              : t("pages.settings.{{packageName}}.{{entityVar}}.update", "Update {{EntityName}}"),
            variant: "default",
            type: "submit",
            onClick: (e) => {
              e?.preventDefault();
              if (formRef.current) {
                formRef.current.requestSubmit();
              }
            },
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
              {{#fields}}
              {{#unless isSystemField}}
              <FormItem className={density.spacingFormItem}>
                <FormLabel htmlFor="{{name}}" className={cn(density.textSizeLabel, "font-medium")}>
                  {t("pages.settings.{{packageName}}.{{entityVar}}.{{name}}", "{{label}}")} {{#if required}}*{{/if}}
                </FormLabel>
                <FormControl>
                  <Input
                    id="{{name}}"
                    {{#if isFirst}}ref={firstInputRef}{{/if}}
                    type="{{inputType}}"
                    value={formData.{{name}}}
                    onChange={(e) => handleInputChange("{{name}}", e.target.value)}
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.{{name}} && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder={t(
                      "pages.settings.{{packageName}}.{{entityVar}}.{{name}}Placeholder",
                      "{{placeholder}}"
                    )}
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>{validationErrors.{{name}}}</FormMessage>
              </FormItem>
              {{/unless}}
              {{/fields}}
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
                      "pages.settings.{{packageName}}.{{entityVar}}.updateError",
                      "Failed to update {{EntityName}}"
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
          }
        }}
        title={t(
          "pages.settings.{{packageName}}.{{entityVar}}.confirmUpdateTitle",
          "Confirm {{EntityName}} Update"
        )}
        description={
          <>
            <p className={cn("mb-3", density.textSizeSmall)}>
              {t(
                "pages.settings.{{packageName}}.{{entityVar}}.confirmUpdateDescription",
                "Are you sure you want to update this {{entity-name}}?"
              )}
            </p>
          </>
        }
        confirmAction={
          {
            label: loading
              ? t("pages.settings.{{packageName}}.{{entityVar}}.updating", "Updating...")
              : t(
                  "pages.settings.{{packageName}}.{{entityVar}}.confirmUpdate",
                  "Confirm & Update"
                ),
            onClick: handleConfirmSubmit,
            loading,
            disabled: loading,
          }
        }
        cancelAction={
          {
            label: t("common.cancel", "Cancel"),
            variant: "outline",
            disabled: loading,
            onClick: () => setShowConfirmDialog(false),
          }
        }
      />
    </>
  );
}

