/**
 * Edit UoM Dialog Component
 *
 * Full-screen dialog for editing existing units of measure with form validation
 *
 * @author Phanny
 */

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@truths/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
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
import { UpdateUnitOfMeasureInput, UnitOfMeasure } from "../types";
import { useUoMService } from "./uom-provider";
import { useUoM } from "./use-uom";

export interface EditUoMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uom: UnitOfMeasure | null;
  onSubmit: (id: string, data: UpdateUnitOfMeasureInput) => Promise<void>;
  loading?: boolean;
  error?: Error | null;
}

interface FormData {
  code: string;
  name: string;
  base_uom: string;
  conversion_factor: string;
}

export function EditUoMDialog({
  open,
  onOpenChange,
  uom,
  onSubmit,
  loading = false,
  error = null,
}: EditUoMDialogProps) {
  const { t } = useTranslation();
  const density = useDensityStyles();
  const service = useUoMService();
  const [formData, setFormData] = useState<FormData>({
    code: "",
    name: "",
    base_uom: "",
    conversion_factor: "1",
  });
  const [originalFormData, setOriginalFormData] = useState<FormData>({
    code: "",
    name: "",
    base_uom: "",
    conversion_factor: "1",
  });
  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>(
    {}
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formKey, setFormKey] = useState(0); // Add key for force re-render
  const [localError, setLocalError] = useState<Error | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Fetch available UOMs for base_uom dropdown (only when dialog is open)
  const { data: uomResponse } = useUoM(service, {
    pagination: { page: 1, pageSize: 1000 },
    enabled: open, // Only fetch when dialog is open
  });
  const availableUoMs = uomResponse?.data || [];

  // Sync error from props
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  // Populate form when UOM changes or dialog opens
  useEffect(() => {
    if (open && uom) {
      const initialData: FormData = {
        code: uom.code || "",
        name: uom.name || "",
        base_uom: uom.base_uom || "",
        conversion_factor: uom.conversion_factor?.toString() || "1",
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
      setValidationErrors({});
      setLocalError(null);
      setFormKey((prev) => prev + 1);
    }
  }, [open, uom]);

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    // Code validation
    if (!formData.code.trim()) {
      errors.code = t(
        "pages.settings.inventory.uom.codeRequired",
        "Code is required"
      );
    } else if (formData.code.trim().length > 50) {
      errors.code = t(
        "pages.settings.inventory.uom.codeMaxLength",
        "Code must be 50 characters or less"
      );
    }

    // Name validation
    if (!formData.name.trim()) {
      errors.name = t(
        "pages.settings.inventory.uom.nameRequired",
        "Name is required"
      );
    } else if (formData.name.trim().length > 200) {
      errors.name = t(
        "pages.settings.inventory.uom.nameMaxLength",
        "Name must be 200 characters or less"
      );
    }

    // Base UOM validation
    if (!formData.base_uom.trim()) {
      errors.base_uom = t(
        "pages.settings.inventory.uom.baseUomRequired",
        "Base UOM is required"
      );
    }

    // Conversion factor validation
    if (!formData.conversion_factor.trim()) {
      errors.conversion_factor = t(
        "pages.settings.inventory.uom.conversionFactorRequired",
        "Conversion factor is required"
      );
    } else {
      const factor = parseFloat(formData.conversion_factor);
      if (isNaN(factor) || factor <= 0) {
        errors.conversion_factor = t(
          "pages.settings.inventory.uom.conversionFactorInvalid",
          "Conversion factor must be a positive number"
        );
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!uom) return;

    try {
      const updateUoMData: UpdateUnitOfMeasureInput = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        base_uom: formData.base_uom.trim().toUpperCase(),
        conversion_factor: parseFloat(formData.conversion_factor),
      };

      await onSubmit(uom.id, updateUoMData);

      // Close dialog on success
      setShowConfirmDialog(false);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by the parent component
      console.error("Error updating UoM:", error);
      setShowConfirmDialog(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear error message when user starts typing
    if (localError) {
      setLocalError(null);
    }
  };

  const handleClose = () => {
    if (uom) {
      // Reset to original values
      setFormData(originalFormData);
    }
    setValidationErrors({});
    onOpenChange(false);
  };

  const handleClear = () => {
    // Reset to original values
    if (uom) {
      setFormData({ ...originalFormData });
      setValidationErrors({});
      setLocalError(null);
      // Force re-render by incrementing the key
      setFormKey((prev) => prev + 1);
    }
  };

  // Focus the first field when dialog opens and after clearing
  useEffect(() => {
    if (open && uom) {
      // Use rAF to ensure element is mounted before focusing
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
      });
    }
  }, [open, formKey, uom]);

  // Keyboard shortcuts: Cmd/Ctrl + Enter to submit, Shift + Cmd/Ctrl + Delete/Backspace to clear
  // (Escape is handled by FullScreenDialog, but we intercept if confirmation dialog is open)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes confirmation dialog if open, otherwise FullScreenDialog handles it
      if (e.key === "Escape" && showConfirmDialog) {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirmDialog(false);
        return;
      }

      // Cmd/Ctrl + Enter submits
      if (
        (e.key === "Enter" || e.code === "Enter") &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();
        if (showConfirmDialog) {
          // If already confirming, finalize
          if (!loading) {
            void handleConfirmSubmit();
          }
        } else {
          // Validate and open confirmation
          if (!loading && validateForm()) {
            setShowConfirmDialog(true);
          }
        }
      }

      // Shift + Cmd/Ctrl + Delete/Backspace clears form
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

    // Use capture phase to intercept ESC before it reaches AlertDialog
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, showConfirmDialog, loading, formData, uom]);

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

  // Get base UOM options - include current code as option if it's a base unit
  const baseUomOptions = [
    ...availableUoMs.map((uom) => ({
      value: uom.code,
      label: `${uom.code} - ${uom.name}`,
    })),
    // Allow self-reference if code is entered and not already in available UOMs
    ...(formData.code.trim() &&
    !availableUoMs.some(
      (uom) => uom.code === formData.code.trim().toUpperCase()
    )
      ? [
          {
            value: formData.code.trim().toUpperCase(),
            label: `${formData.code.trim().toUpperCase()} - ${t(
              "pages.settings.inventory.uom.selfReference",
              "Self (Base Unit)"
            )}`,
          },
        ]
      : []),
  ];

  if (!uom) {
    return null;
  }

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title={t(
          "pages.settings.inventory.uom.editTitle",
          "Edit Unit of Measure"
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
              ? t("pages.settings.inventory.uom.updating", "Updating...")
              : t("pages.settings.inventory.uom.update", "Update UOM"),
            variant: "default",
            type: "submit",
            onClick: (e) => {
              e?.preventDefault();
              // Programmatically submit the form since button is outside form element
              // Use requestSubmit which will trigger the form's onSubmit handler
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
          {/* Enterprise Form Grid */}
          <div className={cn("bg-background border border-border rounded-lg shadow-sm mt-12", density.paddingForm)}>
            <div className={cn("grid grid-cols-1", density.gapForm)}>
              <FormItem className={density.spacingFormItem}>
                <FormLabel htmlFor="code" className={cn(density.textSizeLabel, "font-medium")}>
                  {t("pages.settings.inventory.uom.code", "Code")} *
                </FormLabel>
                <FormControl>
                  <Input
                    id="code"
                    ref={firstInputRef}
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.code && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder={t(
                      "pages.settings.inventory.uom.codePlaceholder",
                      "e.g., KG, LB, M"
                    )}
                    style={{ textTransform: "uppercase" }}
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>{validationErrors.code}</FormMessage>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel htmlFor="name" className={cn(density.textSizeLabel, "font-medium")}>
                  {t("pages.settings.inventory.uom.name", "Name")} *
                </FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.name && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder={t(
                      "pages.settings.inventory.uom.namePlaceholder",
                      "e.g., Kilogram, Pound, Meter"
                    )}
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>{validationErrors.name}</FormMessage>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel htmlFor="base_uom" className={cn(density.textSizeLabel, "font-medium")}>
                  {t("pages.settings.inventory.uom.baseUom", "Base UOM")} *
                </FormLabel>
                <FormControl>
                  <Select
                    value={formData.base_uom}
                    onValueChange={(value) =>
                      handleInputChange("base_uom", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className={cn(density.inputHeight, density.textSize)}>
                      <SelectValue
                        placeholder={t(
                          "pages.settings.inventory.uom.baseUomPlaceholder",
                          "Select base UOM"
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent className={density.textSize}>
                      {baseUomOptions.length > 0 ? (
                        baseUomOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className={density.textSize}
                          >
                            {option.label}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5">
                          <div className={cn(density.textSizeSmall, "text-muted-foreground")}>
                            {t(
                              "pages.settings.inventory.uom.noBaseUomAvailable",
                              "No base UOMs available"
                            )}
                          </div>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {formData.code.trim() &&
                    !availableUoMs.some(
                      (uom) => uom.code === formData.code.trim().toUpperCase()
                    ) && (
                      <p className={cn(density.textSizeSmall, "text-muted-foreground mt-1")}>
                        {t(
                          "pages.settings.inventory.uom.selfReferenceHint",
                          "You can select the code above to make this a base unit (conversion factor should be 1)"
                        )}
                      </p>
                    )}
                </FormControl>
                <FormMessage className={density.textSizeSmall}>{validationErrors.base_uom}</FormMessage>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel
                  htmlFor="conversion_factor"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  {t(
                    "pages.settings.inventory.uom.conversionFactor",
                    "Conversion Factor"
                  )}{" "}
                  *
                </FormLabel>
                <FormControl>
                  <Input
                    id="conversion_factor"
                    type="number"
                    step="any"
                    min="0"
                    value={formData.conversion_factor}
                    onChange={(e) =>
                      handleInputChange("conversion_factor", e.target.value)
                    }
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.conversion_factor && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder={t(
                      "pages.settings.inventory.uom.conversionFactorPlaceholder",
                      "e.g., 1, 0.453592, 1000"
                    )}
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>{validationErrors.conversion_factor}</FormMessage>
                <p className={cn(density.textSizeSmall, "text-muted-foreground mt-1")}>
                  {t(
                    "pages.settings.inventory.uom.conversionFactorHint",
                    "How many of this unit equals one base unit"
                  )}
                </p>
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
                      "pages.settings.inventory.uom.updateError",
                      "Failed to update UOM"
                    )}
                </span>
              </div>
            </div>
          )}
        </form>
      </FullScreenDialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          setShowConfirmDialog(open);
          // Prevent ESC from closing FullScreenDialog when confirmation dialog closes
          if (!open) {
            // Small delay to ensure event propagation is handled
            setTimeout(() => {
              // Focus back to the form to prevent FullScreenDialog from receiving ESC
              firstInputRef.current?.focus();
            }, 0);
          }
        }}
        title={t(
          "pages.settings.inventory.uom.confirmUpdateTitle",
          "Confirm UOM Update"
        )}
        description={
          <>
            <p className={cn("mb-3", density.textSizeSmall)}>
              {t(
                "pages.settings.inventory.uom.confirmUpdateDescription",
                "Are you sure you want to update this unit of measure with the following information?"
              )}
            </p>
            <div className={density.spacingFormItem}>
              <div className={cn("flex justify-between", density.textSizeSmall)}>
                <span className="font-medium text-muted-foreground">
                  {t("pages.settings.inventory.uom.code", "Code")}:
                </span>
                <span className="text-foreground font-mono">
                  {formData.code.trim().toUpperCase()}
                </span>
              </div>
              <div className={cn("flex justify-between", density.textSizeSmall)}>
                <span className="font-medium text-muted-foreground">
                  {t("pages.settings.inventory.uom.name", "Name")}:
                </span>
                <span className="text-foreground">{formData.name.trim()}</span>
              </div>
              <div className={cn("flex justify-between", density.textSizeSmall)}>
                <span className="font-medium text-muted-foreground">
                  {t("pages.settings.inventory.uom.baseUom", "Base UOM")}:
                </span>
                <span className="text-foreground font-mono">
                  {formData.base_uom.trim().toUpperCase()}
                </span>
              </div>
              <div className={cn("flex justify-between", density.textSizeSmall)}>
                <span className="font-medium text-muted-foreground">
                  {t(
                    "pages.settings.inventory.uom.conversionFactor",
                    "Conversion Factor"
                  )}
                  :
                </span>
                <span className="text-foreground font-mono">
                  {formData.conversion_factor}
                </span>
              </div>
            </div>
          </>
        }
        confirmAction={{
          label: loading
            ? t("pages.settings.inventory.uom.updating", "Updating...")
            : t(
                "pages.settings.inventory.uom.confirmUpdate",
                "Confirm & Update"
              ),
          onClick: handleConfirmSubmit,
          loading: loading,
          disabled: loading,
        }}
        cancelAction={{
          label: t("common.cancel", "Cancel"),
          variant: "outline",
          disabled: loading,
        }}
      />
    </>
  );
}

