/**
 * Slider Field Component
 *
 * Reusable slider/range field component that integrates with react-hook-form.
 * Handles numeric range selection with a slider.
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
import { Slider, Field, FieldLabel, FieldError } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

export interface SliderFieldProps<
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
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Minimum value
   * @default 0
   */
  min?: number;

  /**
   * Maximum value
   * @default 100
   */
  max?: number;

  /**
   * Step value
   * @default 1
   */
  step?: number;

  /**
   * Whether to show the current value
   * @default true
   */
  showValue?: boolean;

  /**
   * Custom value formatter function
   */
  formatValue?: (value: number) => string;

  /**
   * Helper text displayed below the slider
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
 * Slider Field Component
 *
 * A reusable slider field that integrates with react-hook-form.
 * Automatically handles validation errors and displays them.
 * The value is stored as a number or array of numbers (for range).
 */
export function SliderField<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  required = false,
  disabled = false,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  formatValue,
  helperText,
  className,
  errorMessage,
  control: controlProp,
}: SliderFieldProps<TFieldValues>) {
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

  const formatDisplayValue = (value: number | number[]): string => {
    if (Array.isArray(value)) {
      return value.map((v) => (formatValue ? formatValue(v) : v.toString())).join(" - ");
    }
    return formatValue ? formatValue(value) : value.toString();
  };

  return (
    <Field data-invalid={hasError} className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        {label && (
          <FieldLabel htmlFor={name}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FieldLabel>
        )}
        {showValue && (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <span className="text-sm font-medium text-muted-foreground">
                {field.value !== undefined && field.value !== null
                  ? formatDisplayValue(field.value as number | number[])
                  : min}
              </span>
            )}
          />
        )}
      </div>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Slider
            value={
              field.value !== undefined && field.value !== null
                ? (Array.isArray(field.value)
                    ? field.value
                    : [field.value]) as number[]
                : [min]
            }
            onValueChange={(values) => {
              // If single value slider, return single number, otherwise return array
              field.onChange(values.length === 1 ? values[0] : values);
            }}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              displayError || helperText
                ? `${name}-${displayError ? "error" : "helper"}`
                : undefined
            }
            className={cn(hasError && "border-destructive")}
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

export default SliderField;

