/**
 * Create Category Dialog
 *
 * Dialog for creating new item categories
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
  cn,
} from "@truths/ui";
import { useDensityStyles, useDensity } from "@truths/utils";
import { DialogAction } from "@truths/custom-ui";
import type { CreateItemCategoryInput } from "../types";

const categoryFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional(),
  parent_category_id: z.string().optional(),
  sort_order: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateItemCategoryInput) => Promise<void>;
  parentCategoryId?: string;
  parentCategoryName?: string;
  forceRoot?: boolean; // When true, only allow root category creation
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  parentCategoryId,
  parentCategoryName,
  forceRoot = false,
}: CreateCategoryDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      parent_category_id: "",
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

  // Reset form when dialog opens or when props change
  React.useEffect(() => {
    if (open) {
      reset({
        code: "",
        name: "",
        description: "",
        parent_category_id: forceRoot ? undefined : parentCategoryId || "",
        sort_order: 0,
        is_active: true,
      });
    } else {
      // Reset when dialog closes too
      reset({
        code: "",
        name: "",
        description: "",
        parent_category_id: "",
        sort_order: 0,
        is_active: true,
      });
    }
  }, [open, forceRoot, parentCategoryId, reset]);

  // Sync parent_category_id with prop changes while dialog is open
  React.useEffect(() => {
    if (open && !forceRoot) {
      setValue("parent_category_id", parentCategoryId || "");
    }
  }, [parentCategoryId, setValue, open, forceRoot]);

  const onFormSubmit = async (data: CategoryFormData) => {
    try {
      // Ensure parent_category_id is included - use form data first, then fallback to prop
      const parentId =
        !forceRoot && (data.parent_category_id?.trim() || parentCategoryId?.trim())
          ? data.parent_category_id?.trim() || parentCategoryId?.trim()
          : undefined;

      const input: CreateItemCategoryInput = {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        parent_category_id: parentId,
        sort_order: data.sort_order,
        is_active: data.is_active !== undefined ? data.is_active : true,
      };
      await onSubmit(input);
      // Reset form to initial state
      reset({
        code: "",
        name: "",
        description: "",
        parent_category_id: forceRoot ? undefined : parentCategoryId || "",
        sort_order: 0,
        is_active: true,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating category:", error);
      // Don't close dialog on error, let user fix the issue
    }
  };

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
            {forceRoot ? "Create Root Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription
            className={cn(density.textSizeSmall, "text-muted-foreground")}
          >
            {forceRoot
              ? "Create a new root category (top level)"
              : parentCategoryName
                ? `Under: ${parentCategoryName}`
                : "Create a new category"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit as any)}
          className={cn(density.spacingFormSection)}
        >
          <div className={cn("grid grid-cols-2 gap-4", density.gapFormItem)}>
            <div
              className={cn(
                "space-y-2",
                density.spacingFormItem,
                forceRoot ? "col-span-2" : ""
              )}
            >
              <Label
                htmlFor="code"
                className={cn(density.textSizeLabel, "font-medium")}
              >
                Code *
              </Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="CAT-001"
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
            {!forceRoot && (
              <div className={cn("space-y-2", density.spacingFormItem)}>
                <Label
                  htmlFor="parent_category_id"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  Parent Category
                </Label>
                {/* Hidden input to ensure value is submitted even when visible input is disabled */}
                <input
                  type="hidden"
                  {...register("parent_category_id")}
                  value={parentCategoryId || ""}
                />
                <Input
                  id="parent_category_id"
                  value={
                    parentCategoryName || "Select a parent category from the tree"
                  }
                  disabled
                  placeholder="Will be set automatically"
                  className={cn(
                    density.inputHeight,
                    density.textSizeSmall,
                    errors.parent_category_id ? "border-destructive" : ""
                  )}
                />
                {errors.parent_category_id && (
                  <p className={cn(density.textSizeSmall, "text-destructive")}>
                    {errors.parent_category_id.message}
                  </p>
                )}
                {!parentCategoryId && (
                  <p
                    className={cn(density.textSizeSmall, "text-muted-foreground")}
                  >
                    Please select a parent category from the tree to create a child
                    category.
                  </p>
                )}
                {parentCategoryId && !errors.parent_category_id && (
                  <p
                    className={cn(density.textSizeSmall, "text-muted-foreground")}
                  >
                    Parent category is set from context
                  </p>
                )}
              </div>
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
              placeholder="Category Name"
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
              placeholder="Category description (optional)"
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
                  defaultChecked={true}
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
              {isSubmitting ? "Creating..." : "Create"}
            </DialogAction>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

