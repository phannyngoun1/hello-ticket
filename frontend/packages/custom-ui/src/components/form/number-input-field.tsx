/**
 * Number Input Field Component
 *
 * Reusable number input field component that integrates with react-hook-form.
 * Handles numeric validation and formatting.
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

export interface NumberInputFieldProps<
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
   * Minimum value allowed
   */
  min?: number;

  /**
   * Maximum value allowed
   */
  max?: number;

  /**
   * Step value for increment/decrement
   */
  step?: number | "any";

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

  /**
   * Whether to allow decimal values
   * @default true
   */
  allowDecimals?: boolean;
}

/**
 * Number Input Field Component
 *
 * A reusable number input field that integrates with react-hook-form.
 * Automatically handles validation errors and displays them.
 */
export function NumberInputField<
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
  step,
  helperText,
  className,
  errorMessage,
  allowDecimals = true,
  control: controlProp,
}: NumberInputFieldProps<TFieldValues>) {
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
            type="number"
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            min={min}
            max={max}
            step={step || (allowDecimals ? "any" : 1)}
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
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string or valid number
              if (value === "" || !isNaN(Number(value))) {
                field.onChange(value === "" ? undefined : Number(value));
              }
            }}
            value={field.value ?? ""}
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

export default NumberInputField;
