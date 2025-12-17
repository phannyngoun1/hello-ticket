/**
 * Edit {{EntityName}} Dialog
 *
 * Dialog for editing existing {{entityPlural}}
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
import type {{{EntityName}}Tree, Update{{EntityName}}Input } from "./types";

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().max(200).optional(),
{{#fields}}
{{#unless isSystemField}}
  {{name}}: {{#if isNumber}}z.number(){{else}}z.string(){{/if}}{{#if required}}{{else}}.optional(){{/if}},
{{/unless}}
{{/fields}}
});

type FormData = z.infer<typeof formSchema>;

interface Edit{{EntityName}}DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: Update{{EntityName}}Input) => Promise<void>;
  item: {{EntityName}}Tree | null;
}

export function Edit{{EntityName}}Dialog({
  open,
  onOpenChange,
  onSubmit,
  item,
}: Edit{{EntityName}}DialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
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

  // Reset form when dialog opens or item changes
  React.useEffect(() => {
    if (open && item) {
      reset({
        code: item.code || "",
        name: item.name || "",
{{#fields}}
{{#unless isSystemField}}
        {{name}}: item.{{name}}{{#if isString}} || ""{{/if}}{{#if isNumber}}?.toString() || "0"{{/if}}{{#if isBoolean}} || {{defaultValue}}{{/if}}{{#if isDate}} || {{defaultValue}}{{/if}},
{{/unless}}
{{/fields}}
      });
    }
  }, [open, item, reset]);

  const onFormSubmit = async (data: FormData) => {
    if (!item) return;

    try {
      const input: Update{{EntityName}}Input = {
        code: data.code,
        name: data.name || undefined,
{{#fields}}
{{#unless isSystemField}}
        {{name}}: data.{{name}},
{{/unless}}
{{/fields}}
      };
      await onSubmit(item.id, input);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating {{entity-name}}:", error);
    }
  };

  if (!item) return null;

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
            Edit {{EntityName}}
          </DialogTitle>
          <DialogDescription
            className={cn(density.textSizeSmall, "text-muted-foreground")}
          >
            Update details for {item.name || item.code}
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
              {isSubmitting ? "Saving..." : "Save"}
            </DialogAction>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
