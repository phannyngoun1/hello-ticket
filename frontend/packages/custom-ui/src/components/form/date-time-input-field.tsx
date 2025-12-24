/**
 * Date-Time Input Field Component
 *
 * Reusable date-time input field component that integrates with react-hook-form.
 * Handles date and time validation and formatting.
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
import { Input, Field, FieldLabel, FieldError } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

export interface DateTimeInputFieldProps<
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
   * Minimum date-time allowed (YYYY-MM-DDTHH:mm format)
   */
  min?: string;

  /**
   * Maximum date-time allowed (YYYY-MM-DDTHH:mm format)
   */
  max?: string;

  /**
   * Step value for time (in seconds)
   * @default 60 (1 minute)
   */
  step?: number;

  /**
   * Helper text displayed below the input
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
}

/**
 * Date-Time Input Field Component
 *
 * A reusable date-time input field that integrates with react-hook-form.
 * Automatically handles validation errors and displays them.
 * The value is stored as a string in YYYY-MM-DDTHH:mm format (datetime-local).
 */
export function DateTimeInputField<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  min,
  max,
  step = 60,
  helperText,
  className,
  errorMessage,
  control: controlProp,
}: DateTimeInputFieldProps<TFieldValues>) {
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
          <Input
            {...field}
            id={name}
            type="datetime-local"
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            min={min}
            max={max}
            step={step}
            className={cn(
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
            value={field.value || ""}
          />
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

export default DateTimeInputField;
