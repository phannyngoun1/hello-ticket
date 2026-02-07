/**
 * Textarea Input Field Component
 *
 * Reusable textarea field component that integrates with react-hook-form.
 * Handles multi-line text input with validation.
 *
 * @author Phanny
 */

import {
  useFormContext,
  Controller,
  Control,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { Textarea, Field, FieldLabel, FieldError } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { ImproveTextButton } from "../../ai";

export interface TextareaInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
> {
  /**
   * The name of the field in the form (must match the form schema)
   */
  name: FieldPath<TFieldValues>;

  /**
   * Optional control from react-hook-form. If not provided, will use useFormContext.
   */
  control?: Control<TFieldValues>;

  /**
   * Label text for the field
   */
  label?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Whether the field is read-only
   */
  readOnly?: boolean;

  /**
   * Number of rows (height)
   */
  rows?: number;

  /**
   * Maximum length of the input
   */
  maxLength?: number;

  /**
   * Minimum length of the input
   */
  minLength?: number;

  /**
   * Helper text displayed below the textarea
   */
  helperText?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Custom error message override
   */
  errorMessage?: string;

  /**
   * Show "Improve with AI" button next to the textarea
   */
  showImproveButton?: boolean;
}

/**
 * Textarea Input Field Component
 *
 * A reusable textarea field that integrates with react-hook-form.
 * Automatically handles validation errors and displays them.
 */
export function TextareaInputField<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  rows = 4,
  maxLength,
  minLength,
  helperText,
  className,
  errorMessage,
  showImproveButton = false,
  control: controlProp,
}: TextareaInputFieldProps<TFieldValues>) {
  let control: Control<TFieldValues>;
  let errors: any = {};

  if (controlProp) {
    control = controlProp;
    // When control is provided directly, we need to get errors from formState
    // This requires the form to be wrapped in FormProvider or errors passed separately
    // For now, we'll use an empty object and rely on errorMessage prop
  } else {
    const formContext = useFormContext<TFieldValues>();
    control = formContext.control;
    errors = formContext.formState.errors;
  }

  const error = errors[name];
  const hasError = !!error;
  const displayError = errorMessage || (error?.message as string | undefined);

  return (
    <Field data-invalid={hasError}>
      {label && (
        <FieldLabel htmlFor={name}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FieldLabel>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <div className="flex gap-2 items-start">
              <Textarea
                {...field}
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                rows={rows}
                maxLength={maxLength}
                minLength={minLength}
                className={cn(
                  "flex-1 min-w-0",
                  hasError && "border-destructive",
                  readOnly && "cursor-not-allowed bg-muted text-muted-foreground",
                  className
                )}
                aria-invalid={hasError}
                aria-describedby={
                  displayError || helperText
                    ? `${name}-${displayError ? "error" : "helper"}`
                    : undefined
                }
              />
              {showImproveButton && !readOnly && (
                <ImproveTextButton
                  value={field.value ?? ""}
                  onImproved={field.onChange}
                  disabled={disabled}
                  className="shrink-0"
                />
              )}
            </div>
          </div>
        )}
      />
      {helperText && !displayError && (
        <p id={`${name}-helper`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
      {displayError && (
        <FieldError id={`${name}-error`}>{displayError}</FieldError>
      )}
    </Field>
  );
}

export default TextareaInputField;

