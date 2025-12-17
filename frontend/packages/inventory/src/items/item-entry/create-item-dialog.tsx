/**
 * Create Item Dialog
 *
 * Dialog for creating new inventory items with comprehensive form
 *
 * @author Phanny
 */

import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  FullScreenDialog,
  useDensityStyles,
  ConfirmationDialog,
} from "@truths/custom-ui";
import { ItemForm, type ItemFormData } from "./item-form";
import type { CreateItemInput } from "../../types";
import { cn } from "@truths/ui";
import type { ItemCategoryTree } from "../../types";

export interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateItemInput) => Promise<void>;
  categoryTree?: ItemCategoryTree[];
  isCategoryTreeLoading?: boolean;
  categoryTreeError?: Error | null;
  onReloadCategoryTree?: () => void;
  uomOptions?: Array<{ code: string; name: string }>;
}

export function CreateItemDialog({
  open,
  onOpenChange,
  onSubmit,
  categoryTree = [],
  isCategoryTreeLoading,
  categoryTreeError,
  onReloadCategoryTree,
  uomOptions,
}: CreateItemDialogProps) {
  const density = useDensityStyles();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ItemFormData | null>(
    null
  );
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);

  const categoryLookup = useMemo(() => {
    const flatten = (
      tree: ItemCategoryTree[] | undefined,
      parentPath: string[] = []
    ): Record<string, { label: string; code: string; name: string }> => {
      if (!tree || tree.length === 0) return {};

      return tree.reduce<
        Record<string, { label: string; code: string; name: string }>
      >((acc, node) => {
        const path = [...parentPath, node.name || node.code];
        const label = `${path.join(" / ")} (${node.code})`;

        acc[node.id] = {
          label,
          code: node.code,
          name: node.name,
        };

        const childLookup = flatten(node.children, path);
        Object.assign(acc, childLookup);
        return acc;
      }, {});
    };

    return flatten(categoryTree);
  }, [categoryTree]);

  // Focus the first field when dialog opens
  useEffect(() => {
    if (open) {
      // Use rAF to ensure element is mounted before focusing
      requestAnimationFrame(() => {
        const firstInput = formRef.current?.querySelector(
          'input[id="code"]'
        ) as HTMLInputElement;
        firstInput?.focus();
      });
    }
  }, [open, formKey]);

  const handleClose = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
    onOpenChange(false);
  };

  const handleClear = () => {
    setPendingFormData(null);
    if (formRef.current) {
      formRef.current.reset();
    }
    setFormKey((prev) => prev + 1);
  };

  const handleFormSubmit = async (data: ItemFormData) => {
    // Show confirmation dialog instead of submitting directly
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    setIsSubmitting(true);
    try {
      const input: CreateItemInput = {
        code: pendingFormData.code || undefined,
        sku:
          pendingFormData.sku === ""
            ? null
            : (pendingFormData.sku ?? undefined),
        name: pendingFormData.name,
        description:
          pendingFormData.description === ""
            ? null
            : (pendingFormData.description ?? undefined),
        item_type: pendingFormData.item_type,
        item_usage: pendingFormData.item_usage,
        category_id: pendingFormData.category_id || undefined,
        tracking_scope: pendingFormData.tracking_scope,
        tracking_requirements: pendingFormData.tracking_requirements,
        default_uom: pendingFormData.default_uom,
        uom_mappings:
          pendingFormData.uom_mappings &&
          pendingFormData.uom_mappings.length > 0
            ? pendingFormData.uom_mappings
                .filter(
                  (m) => m.context && m.uom_code && m.conversion_factor > 0
                )
                .map((m) => ({
                  context: m.context,
                  uom_code: m.uom_code,
                  conversion_factor: m.conversion_factor,
                  is_primary: m.is_primary,
                }))
            : undefined,
        perishable: pendingFormData.perishable,
      };
      await onSubmit(input);
      setShowConfirmDialog(false);
      setPendingFormData(null);
      // Do not close here; let parent control dialog state after success
    } catch (error) {
      console.error("Error creating item:", error);
      setShowConfirmDialog(false);
      // Don't close dialog on error, let user fix the issue
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Escape key to close confirmation dialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showConfirmDialog) {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirmDialog(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, showConfirmDialog]);

  // Helper to get category name
  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return "None";
    const category = categoryLookup[categoryId];
    return category ? category.label : "Unknown";
  };

  // Helper to get UoM name
  const getUomName = (uomCode: string) => {
    const uom = uomOptions?.find((u) => u.code === uomCode);
    return uom ? `${uom.code} - ${uom.name}` : uomCode;
  };

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title="Create Item"
        maxWidth="800px"
        loading={isSubmitting}
        formSelector={formRef}
        onClear={handleClear}
        onCancel={handleClose}
        showSubmitButton
        onSubmit={() => {
          if (formRef.current) {
            formRef.current.requestSubmit();
          }
        }}
      >
        <div
          className={cn(
            "bg-background border border-border rounded-lg shadow-sm mt-12",
            density.paddingForm
          )}
        >
          <ItemForm
            ref={formRef}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
            mode="create"
            categoryTree={categoryTree}
            isCategoryTreeLoading={isCategoryTreeLoading}
            categoryTreeError={categoryTreeError}
            onReloadCategoryTree={onReloadCategoryTree}
            uomOptions={uomOptions}
          />
        </div>
      </FullScreenDialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          setShowConfirmDialog(open);
          if (!open) {
            setPendingFormData(null);
            // Small delay to ensure event propagation is handled
            setTimeout(() => {
              // Focus back to the form to prevent FullScreenDialog from receiving ESC
              const firstInput = formRef.current?.querySelector(
                "input, textarea, select"
              ) as HTMLElement;
              firstInput?.focus();
            }, 0);
          }
        }}
        title="Confirm Item Creation"
        description={
          pendingFormData ? (
            <>
              <p className={cn("mb-3", density.textSizeSmall)}>
                Are you sure you want to create a new item with the following
                information?
              </p>
              <div className={density.spacingFormItem}>
                <div
                  className={cn("flex justify-between", density.textSizeSmall)}
                >
                  <span className="font-medium text-muted-foreground">
                    Code:
                  </span>
                  <span className="text-foreground font-mono">
                    {pendingFormData.code}
                  </span>
                </div>
                {pendingFormData.sku && (
                  <div
                    className={cn(
                      "flex justify-between",
                      density.textSizeSmall
                    )}
                  >
                    <span className="font-medium text-muted-foreground">
                      SKU:
                    </span>
                    <span className="text-foreground font-mono">
                      {pendingFormData.sku}
                    </span>
                  </div>
                )}
                <div
                  className={cn("flex justify-between", density.textSizeSmall)}
                >
                  <span className="font-medium text-muted-foreground">
                    Name:
                  </span>
                  <span className="text-foreground">
                    {pendingFormData.name}
                  </span>
                </div>
                {pendingFormData.description && (
                  <div
                    className={cn(
                      "flex justify-between",
                      density.textSizeSmall
                    )}
                  >
                    <span className="font-medium text-muted-foreground">
                      Description:
                    </span>
                    <span className="text-foreground">
                      {pendingFormData.description}
                    </span>
                  </div>
                )}
                <div
                  className={cn("flex justify-between", density.textSizeSmall)}
                >
                  <span className="font-medium text-muted-foreground">
                    Type:
                  </span>
                  <span className="text-foreground">
                    {pendingFormData.item_type}
                  </span>
                </div>
                <div
                  className={cn("flex justify-between", density.textSizeSmall)}
                >
                  <span className="font-medium text-muted-foreground">
                    Usage:
                  </span>
                  <span className="text-foreground">
                    {pendingFormData.item_usage}
                  </span>
                </div>
                <div
                  className={cn("flex justify-between", density.textSizeSmall)}
                >
                  <span className="font-medium text-muted-foreground">
                    Category:
                  </span>
                  <span className="text-foreground">
                    {getCategoryName(pendingFormData.category_id)}
                  </span>
                </div>
                <div
                  className={cn("flex justify-between", density.textSizeSmall)}
                >
                  <span className="font-medium text-muted-foreground">
                    Tracking Scope:
                  </span>
                  <span className="text-foreground">
                    {pendingFormData.tracking_scope}
                  </span>
                </div>
                {pendingFormData.tracking_requirements.length > 0 && (
                  <div
                    className={cn(
                      "flex justify-between",
                      density.textSizeSmall
                    )}
                  >
                    <span className="font-medium text-muted-foreground">
                      Tracking Requirements:
                    </span>
                    <span className="text-foreground">
                      {pendingFormData.tracking_requirements.join(", ")}
                    </span>
                  </div>
                )}
                <div
                  className={cn("flex justify-between", density.textSizeSmall)}
                >
                  <span className="font-medium text-muted-foreground">
                    Default UoM:
                  </span>
                  <span className="text-foreground">
                    {getUomName(pendingFormData.default_uom)}
                  </span>
                </div>
                <div
                  className={cn("flex justify-between", density.textSizeSmall)}
                >
                  <span className="font-medium text-muted-foreground">
                    Perishable:
                  </span>
                  <span className="text-foreground">
                    {pendingFormData.perishable ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </>
          ) : null
        }
        confirmAction={{
          label: isSubmitting ? "Creating..." : "Confirm & Create",
          onClick: handleConfirmSubmit,
          loading: isSubmitting,
          disabled: isSubmitting,
        }}
        cancelAction={{
          label: "Cancel",
          variant: "outline",
          disabled: isSubmitting,
        }}
      />
    </>
  );
}
