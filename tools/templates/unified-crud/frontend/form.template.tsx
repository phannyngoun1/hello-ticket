/**
 * {{EntityName}} Form Component
 *
 * Shared form used for creating and editing {{entity-plural}} with Zod validation.
 */

import { forwardRef, useEffect, useRef } from "react";
import { useForm{{#if hasControlledField}}, Controller{{/if}} } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Input,{{#if hasTextArea}}
  Textarea,{{/if}}{{#if hasSelectField}}
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,{{/if}}{{#if hasBooleanField}}
  Checkbox,{{/if}}
  Field,
  FieldLabel,
  FieldError,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

// Form schema excludes timestamp fields (created_at, updated_at) as they are backend-managed
const {{entityName}}FormSchema = z
  .object({
    {{#fields}}
    {{#unless isSystemField}}
    {{name}}: {{fieldSchema}},
    {{/unless}}
    {{/fields}}
  })
  .transform((values) => values);

export type {{EntityName}}FormData = z.infer<typeof {{entityName}}FormSchema>;

export interface {{EntityName}}FormProps {
  defaultValues?: Partial<{{EntityName}}FormData>;
  onSubmit: (data: {{EntityName}}FormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export const {{EntityName}}Form = forwardRef<HTMLFormElement, {{EntityName}}FormProps>(
  function {{EntityName}}Form(
    {
      defaultValues,
      onSubmit,
      isLoading = false,
      mode = "create",
    },
    ref
  ) {
    const {
      register,
      handleSubmit,{{#if hasControlledField}}
      control,{{/if}}
      formState: { errors, isSubmitted },
    } = useForm<{{EntityName}}FormData>({
      resolver: zodResolver({{entityName}}FormSchema),
      defaultValues: {
        {{#fields}}
        {{#unless isSystemField}}
        {{name}}: {{defaultValue}},
        {{/unless}}
        {{/fields}}
        ...defaultValues,
      },
    });

    const firstErrorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (isSubmitted && Object.keys(errors).length > 0) {
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.querySelector(
          `[name="${firstErrorField}"], #${firstErrorField}`
        ) as HTMLElement | null;

        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          errorElement.focus?.();
        } else if (firstErrorRef.current) {
          firstErrorRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }, [errors, isSubmitted]);

    const handleFormSubmit = async (data: {{EntityName}}FormData) => {
      await onSubmit(data);
    };

    return (
      <form
        ref={ref}
        id="{{entity-name}}-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}
          ref={firstErrorRef}
        >
          {{#fields}}
          {{#unless isSystemField}}
          <Field data-invalid={!!errors.{{name}}}>
            <FieldLabel htmlFor="{{name}}">
              {{label}}{{#if required}} <span className="text-destructive">*</span>{{/if}}
            </FieldLabel>
            {{#if isBoolean}}
            <div className="flex items-center gap-2 pt-2">
              <Controller
                name="{{name}}"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="{{name}}"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                )}
              />
              <span className="text-sm text-muted-foreground">{{label}}</span>
            </div>
            <FieldError>{errors.{{name}}?.message}</FieldError>
            {{else}}
              {{#if isSelect}}
              <Controller
                name="{{name}}"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value as string}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="{{name}}">
                      <SelectValue placeholder="Select {{label}}" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {{else}}
                {{#if isTextArea}}
                <Textarea
                  id="{{name}}"
                  placeholder="{{placeholder}}"
                  {...register("{{name}}")}
                  disabled={isLoading}
                  className={cn(errors.{{name}} && "border-destructive")}
                  rows={4}
                />
                {{else}}
                {(() => {
                  const isCodeLocked =
                    ({{isCodeField}} && mode === "edit") ||
                    ({{isAutoGeneratedCode}} && mode === "create");
                  const lockReason =
                    {{isCodeField}} && mode === "edit"
                      ? "Codes cannot be modified after creation"
                      : {{isAutoGeneratedCode}} && mode === "create"
                        ? "Code will be generated automatically"
                        : undefined;
                  return (
                    <Input
                      id="{{name}}"
                      type="{{inputType}}"
                      placeholder="{{placeholder}}"
                      {...register("{{name}}"{{#if isNumber}}, { valueAsNumber: true }{{/if}})}
                      disabled={isLoading || isCodeLocked}
                      readOnly={isCodeLocked}
                      tabIndex={isCodeLocked ? -1 : undefined}
                      aria-disabled={isCodeLocked || undefined}
                      aria-readonly={isCodeLocked || undefined}
                      title={lockReason}
                      className={cn(
                        isCodeLocked && "cursor-not-allowed bg-muted text-muted-foreground",
                        errors.{{name}} && "border-destructive"
                      )}
                    />
                  );
                })()}
                {{/if}}
              {{/if}}
              <FieldError>{errors.{{name}}?.message}</FieldError>
            {{/if}}
          </Field>
          {{/unless}}
          {{/fields}}
        </div>
      </form>
    );
  }
);

