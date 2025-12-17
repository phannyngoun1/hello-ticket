/**
 * Edit Category Dialog
 *
 * Dialog for editing existing item categories
 *
 * @author Phanny
 */

import { useForm } from "react-hook-form";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@truths/ui";
import { cn } from "@truths/ui";
import { useDensityStyles, useDensity } from "@truths/utils";
import { DialogAction } from "@truths/custom-ui";
import type { ItemCategoryTree, UpdateItemCategoryInput } from "../types";

const updateCategoryFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional(),
  sort_order: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

type CategoryFormData = z.infer<typeof updateCategoryFormSchema>;

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateItemCategoryInput) => Promise<void>;
  category: ItemCategoryTree | null;
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  category,
}: EditCategoryDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(updateCategoryFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      sort_order: 0,
      is_active: true,
    },
  });

  // Get density from user preference
  const { isCompact: userIsCompact } = useDensity();
  const baseDensity = useDensityStyles();

  // Determine effective compact mode
  const effectiveIsCompact = userIsCompact;

  // Use base density styles with proper button padding
  const density = {
    ...baseDensity,
    // Override paddingCell to include vertical padding for buttons
    paddingCell: effectiveIsCompact ? "px-2 py-1.5" : "px-3 py-2",
  };

  // Reset form when dialog opens or when category changes
  React.useEffect(() => {
    if (open && category) {
      reset({
        code: category.code || "",
        name: category.name || "",
        description: category.description || "",
        sort_order: category.sort_order || 0,
        is_active: category.is_active !== undefined ? category.is_active : true,
      });
    }
  }, [open, category, reset]);

  const onFormSubmit = async (data: CategoryFormData) => {
    if (!category) return;

    try {
      const input: UpdateItemCategoryInput = {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        sort_order: data.sort_order,
        is_active: data.is_active,
      };
      await onSubmit(category.id, input);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating category:", error);
      // Don't close dialog on error, let user fix the issue
    }
  };

  if (!category) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-2xl max-h-[90vh] overflow-y-auto",
          density.paddingContainer
        )}
      >
        <DialogHeader className={cn(density.spacingFormItem)}>
          <DialogTitle
            className={cn(
              effectiveIsCompact ? "text-base" : "text-lg",
              "font-semibold"
            )}
          >
            Edit Category
          </DialogTitle>
          <DialogDescription
            className={cn(density.textSizeSmall, "text-muted-foreground")}
          >
            Update category information. Parent category cannot be changed here.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit as any)}
          className={cn(density.spacingFormSection)}
        >
          <div className={cn("space-y-2", density.spacingFormItem)}>
            <Label
              htmlFor="code"
              className={cn(density.textSizeLabel, "font-medium")}
            >
              Code *
            </Label>
            <Input
              id="code"
              {...register("code")}
              className={cn(
                density.inputHeight,
                density.textSizeSmall,
                errors.code ? "border-destructive" : ""
              )}
            />
            {errors.code && (
              <p className={cn(density.textSizeSmall, "text-destructive")}>
                {errors.code.message}
              </p>
            )}
          </div>

          <div className={cn("space-y-2", density.spacingFormItem)}>
            <Label
              htmlFor="name"
              className={cn(density.textSizeLabel, "font-medium")}
            >
              Name *
            </Label>
            <Input
              id="name"
              type="text"
              {...register("name")}
              className={cn(
                density.inputHeight,
                density.textSizeSmall,
                errors.name ? "border-destructive" : ""
              )}
              autoComplete="off"
            />
            {errors.name && (
              <p className={cn(density.textSizeSmall, "text-destructive")}>
                {errors.name.message}
              </p>
            )}
          </div>

          <div className={cn("space-y-2", density.spacingFormItem)}>
            <Label
              htmlFor="description"
              className={cn(density.textSizeLabel, "font-medium")}
            >
              Description
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              rows={3}
              className={cn(density.textSizeSmall)}
            />
            {errors.description && (
              <p className={cn(density.textSizeSmall, "text-destructive")}>
                {errors.description.message}
              </p>
            )}
          </div>

          <div className={cn("grid grid-cols-2 gap-4", density.gapFormItem)}>
            <div className={cn("space-y-2", density.spacingFormItem)}>
              <Label
                htmlFor="sort_order"
                className={cn(density.textSizeLabel, "font-medium")}
              >
                Sort Order
              </Label>
              <Input
                id="sort_order"
                type="number"
                step="1"
                {...register("sort_order", { valueAsNumber: true })}
                className={cn(density.inputHeight, density.textSizeSmall)}
              />
            </div>
            <div className={cn("space-y-2", density.spacingFormItem)}>
              <Label
                htmlFor="is_active"
                className={cn(density.textSizeLabel, "font-medium")}
              >
                Active
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register("is_active")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="is_active"
                  className={cn(density.textSizeSmall, "font-normal")}
                >
                  Category is active
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className={cn(density.gapButtonGroup)}>
            <DialogAction
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </DialogAction>
            <DialogAction type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </DialogAction>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

