/**
 * Create CustomerGroup Dialog
 *
 * Dialog for creating new customerGroups
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
  cn,
} from "@truths/ui";
import { useDensityStyles, useDensity } from "@truths/utils";
import { DialogAction } from "@truths/custom-ui";
import type { CreateCustomerGroupInput } from "./types";

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().max(200).optional(),
  parent_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateCustomerGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCustomerGroupInput) => Promise<void>;
  parentId?: string;
  parentName?: string;
}

export function CreateCustomerGroupDialog({
  open,
  onOpenChange,
  onSubmit,
  parentId,
  parentName,
}: CreateCustomerGroupDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      parent_id: "",
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
    paddingCell: effectiveIsCompact ? "px-2 py-1.5" : "px-3 py-2",
  };

  // Reset form when dialog opens or parentId changes
  React.useEffect(() => {
    if (open) {
      reset({
        code: "",
        name: "",
        parent_id: parentId || "",
      });
    }
  }, [open, parentId, reset]);

  // Also explicitly set parent_id when it changes (ensures react-hook-form tracks it)
  React.useEffect(() => {
    if (open) {
      setValue("parent_id", parentId || "");
    }
  }, [parentId, open, setValue]);

  const onFormSubmit = async (data: FormData) => {
    try {
      const input: CreateCustomerGroupInput = {
        code: data.code,
        name: data.name || undefined,
        // Only include parent_id if it has a value (not empty string)
        parent_id:
          data.parent_id && data.parent_id.trim()
            ? data.parent_id.trim()
            : undefined,
      };


      await onSubmit(input);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating customer-group:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-md max-h-[90vh] overflow-y-auto",
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
            Create CustomerGroup
          </DialogTitle>
          <DialogDescription
            className={cn(density.textSizeSmall, "text-muted-foreground")}
          >
            {parentName
              ? `Create a new customer-group under: ${parentName}`
              : "Create a new root customer-group"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
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
              placeholder="Enter code"
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
              Name
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter name"
              className={cn(
                density.inputHeight,
                density.textSizeSmall,
                errors.name ? "border-destructive" : ""
              )}
            />
            {errors.name && (
              <p className={cn(density.textSizeSmall, "text-destructive")}>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Always render hidden input to ensure react-hook-form tracks it */}
          <input type="hidden" {...register("parent_id")} />

          {parentId && (
            <div className={cn("space-y-2", density.spacingFormItem)}>
              <Label
                htmlFor="parent_id_display"
                className={cn(density.textSizeLabel, "font-medium")}
              >
                Parent
              </Label>
              <Input
                id="parent_id_display"
                value={parentName || parentId}
                disabled
                className={cn(density.inputHeight, density.textSizeSmall)}
              />
            </div>
          )}

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
