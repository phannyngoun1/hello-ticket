/**
 * Create {{EntityName}} Dialog
 *
 * Dialog for creating new {{entityPlural}}
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
import type { Create{{EntityName}}Input } from "./types";

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().max(200).optional(),
  parent_id: z.string().optional(),
{{#fields}}
{{#unless isSystemField}}
  {{name}}: {{#if isNumber}}z.number(){{else}}z.string(){{/if}}{{#if required}}{{else}}.optional(){{/if}},
{{/unless}}
{{/fields}}
});

type FormData = z.infer<typeof formSchema>;

interface Create{{EntityName}}DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Create{{EntityName}}Input) => Promise<void>;
  parentId?: string;
  parentName?: string;
}

export function Create{{EntityName}}Dialog({
  open,
  onOpenChange,
  onSubmit,
  parentId,
  parentName,
}: Create{{EntityName}}DialogProps) {
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
{{#fields}}
{{#unless isSystemField}}
      {{name}}: {{defaultValue}},
{{/unless}}
{{/fields}}
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

  // Reset form when dialog opens or when props change
  React.useEffect(() => {
    if (open) {
      reset({
        code: "",
        name: "",
        parent_id: parentId || "",
{{#fields}}
{{#unless isSystemField}}
        {{name}}: {{defaultValue}},
{{/unless}}
{{/fields}}
      });
    }
  }, [open, parentId, reset]);

  const onFormSubmit = async (data: FormData) => {
    try {
      const input: Create{{EntityName}}Input = {
        code: data.code,
        name: data.name || undefined,
        parent_id: data.parent_id?.trim() || undefined,
{{#fields}}
{{#unless isSystemField}}
        {{name}}: data.{{name}},
{{/unless}}
{{/fields}}
      };
      await onSubmit(input);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating {{entity-name}}:", error);
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
            Create {{EntityName}}
          </DialogTitle>
          <DialogDescription
            className={cn(density.textSizeSmall, "text-muted-foreground")}
          >
            {parentName
              ? `Create a new {{entity-name}} under: ${parentName}`
              : "Create a new root {{entity-name}}"}
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

          {parentId && (
            <div className={cn("space-y-2", density.spacingFormItem)}>
              <Label
                htmlFor="parent_id"
                className={cn(density.textSizeLabel, "font-medium")}
              >
                Parent
              </Label>
              <input type="hidden" {...register("parent_id")} />
              <Input
                id="parent_id_display"
                value={parentName || parentId}
                disabled
                className={cn(density.inputHeight, density.textSizeSmall)}
              />
            </div>
          )}


{{#fields}}
{{#unless isSystemField}}
          <div className={cn("space-y-2", density.spacingFormItem)}>
            <Label
              htmlFor="{{name}}"
              className={cn(density.textSizeLabel, "font-medium")}
            >
              {{label}}{{#if required}} *{{/if}}
            </Label>
            <Input
              id="{{name}}"
              type="{{inputType}}"
              {{#if isNumber}}step="any"{{/if}}
              {...register("{{name}}"{{#if isNumber}}, { valueAsNumber: true }{{/if}})}
              placeholder="{{placeholder}}"
              className={cn(
                density.inputHeight,
                density.textSizeSmall,
                errors.{{name}} ? "border-destructive" : ""
              )}
            />
            {errors.{{name}} && (
              <p className={cn(density.textSizeSmall, "text-destructive")}>
                {errors.{{name}}.message}
              </p>
            )}
          </div>
{{/unless}}
{{/fields}}


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
