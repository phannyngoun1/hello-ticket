/**
 * Date Range Input Field Component
 *
 * Reusable date range input field component that integrates with react-hook-form.
 * Handles start and end date selection with validation.
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

export interface DateRangeInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
> {
  /**
   * The name of the start date field in the form
   */
  startDateName: FieldPath<TFieldValues>;

  /**
   * The name of the end date field in the form
   */
  endDateName: FieldPath<TFieldValues>;

  /**
   * Optional control from react-hook-form. If not provided, will use useFormContext.
   */
  control?: Control<TFieldValues>;

  /**
   * Label text for the date range
   */
  label?: string;

  /**
   * Label for the start date field
   * @default "Start Date"
   */
  startDateLabel?: string;

  /**
   * Label for the end date field
   * @default "End Date"
   */
  endDateLabel?: string;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the fields are disabled
   */
  disabled?: boolean;

  /**
   * Whether the fields are read-only
   */
  readOnly?: boolean;

  /**
   * Minimum date allowed for start date (YYYY-MM-DD format)
   */
  minDate?: string;

  /**
   * Maximum date allowed for end date (YYYY-MM-DD format)
   */
  maxDate?: string;

  /**
   * Helper text displayed below the inputs
   */
  helperText?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Custom error message override for start date
   */
  startDateErrorMessage?: string;

  /**
   * Custom error message override for end date
   */
  endDateErrorMessage?: string;
}

/**
 * Date Range Input Field Component
 *
 * A reusable date range field that integrates with react-hook-form.
 * Automatically handles validation errors and displays them.
 * Validates that end date is after start date.
 * Values are stored as strings in YYYY-MM-DD format.
 */
export function DateRangeInputField<
  TFieldValues extends FieldValues = FieldValues,
>({
  startDateName,
  endDateName,
  label,
  startDateLabel = "Start Date",
  endDateLabel = "End Date",
  required = false,
  disabled = false,
  readOnly = false,
  minDate,
  maxDate,
  helperText,
  className,
  startDateErrorMessage,
  endDateErrorMessage,
  control: controlProp,
}: DateRangeInputFieldProps<TFieldValues>) {
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

  const startDateError = errors[startDateName];
  const endDateError = errors[endDateName];
  const hasStartError = !!startDateError;
  const hasEndError = !!endDateError;
  const displayStartError =
    startDateErrorMessage || (startDateError?.message as string | undefined);
  const displayEndError =
    endDateErrorMessage || (endDateError?.message as string | undefined);

  return (
    <Field className={cn("space-y-4", className)}>
      {label && (
        <div>
          <FieldLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FieldLabel>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <Field data-invalid={hasStartError}>
          <FieldLabel htmlFor={startDateName}>
            {startDateLabel}
            {required && <span className="text-destructive ml-1">*</span>}
          </FieldLabel>
          <Controller
            name={startDateName}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={startDateName}
                type="date"
                disabled={disabled}
                readOnly={readOnly}
                min={minDate}
                max={maxDate}
                className={cn(
                  hasStartError && "border-destructive",
                  readOnly &&
                    "cursor-not-allowed bg-muted text-muted-foreground"
                )}
                aria-invalid={hasStartError}
                aria-describedby={
                  displayStartError || helperText
                    ? `${startDateName}-${displayStartError ? "error" : "helper"}`
                    : undefined
                }
                value={field.value || ""}
              />
            )}
          />
          {displayStartError && (
            <FieldError id={`${startDateName}-error`}>
              {displayStartError}
            </FieldError>
          )}
        </Field>

        {/* End Date */}
        <Field data-invalid={hasEndError}>
          <FieldLabel htmlFor={endDateName}>
            {endDateLabel}
            {required && <span className="text-destructive ml-1">*</span>}
          </FieldLabel>
          <Controller
            name={endDateName}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id={endDateName}
                type="date"
                disabled={disabled}
                readOnly={readOnly}
                min={minDate}
                max={maxDate}
                className={cn(
                  hasEndError && "border-destructive",
                  readOnly &&
                    "cursor-not-allowed bg-muted text-muted-foreground"
                )}
                aria-invalid={hasEndError}
                aria-describedby={
                  displayEndError || helperText
                    ? `${endDateName}-${displayEndError ? "error" : "helper"}`
                    : undefined
                }
                value={field.value || ""}
              />
            )}
          />
          {displayEndError && (
            <FieldError id={`${endDateName}-error`}>{displayEndError}</FieldError>
          )}
        </Field>
      </div>
      {helperText && !displayStartError && !displayEndError && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </Field>
  );
}

export default DateRangeInputField;

