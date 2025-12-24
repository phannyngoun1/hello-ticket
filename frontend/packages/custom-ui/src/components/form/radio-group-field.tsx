/**
 * Radio Group Field Component
 *
 * Reusable radio group field component that integrates with react-hook-form.
 * Handles single selection from a list of options.
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
import { Field, FieldLabel, FieldError, Label } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

export interface RadioOption {
  /**
   * The value of the radio option
   */
  value: string;

  /**
   * The display label for the option
   */
  label: string;

  /**
   * Whether the option is disabled
   */
  disabled?: boolean;

  /**
   * Description text for the option
   */
  description?: string;
}

export interface RadioGroupFieldProps<
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
   * Label text for the radio group
   */
  label?: string;

  /**
   * Array of radio options
   */
  options: RadioOption[];

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Layout orientation
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal";

  /**
   * Helper text displayed below the radio group
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
 * Radio Group Field Component
 *
 * A reusable radio group field that integrates with react-hook-form.
 * Automatically handles validation errors and displays them.
 */
export function RadioGroupField<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  options,
  required = false,
  disabled = false,
  orientation = "vertical",
  helperText,
  className,
  errorMessage,
  control: controlProp,
}: RadioGroupFieldProps<TFieldValues>) {
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
    <Field data-invalid={hasError} className={cn("space-y-2", className)}>
      {label && (
        <FieldLabel>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FieldLabel>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div
            className={cn(
              "space-y-2",
              orientation === "horizontal" && "flex flex-wrap gap-4"
            )}
            role="radiogroup"
            aria-labelledby={label ? `${name}-label` : undefined}
            aria-invalid={hasError}
            aria-describedby={
              displayError || helperText
                ? `${name}-${displayError ? "error" : "helper"}`
                : undefined
            }
          >
            {options.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-start space-x-2",
                  orientation === "horizontal" && "flex-col items-start"
                )}
              >
                <input
                  type="radio"
                  id={`${name}-${option.value}`}
                  value={option.value}
                  checked={field.value === option.value}
                  onChange={() => field.onChange(option.value)}
                  disabled={disabled || option.disabled}
                  className="mt-1 h-4 w-4 border-primary text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={hasError}
                />
                <div className="space-y-0.5">
                  <Label
                    htmlFor={`${name}-${option.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {option.label}
                  </Label>
                  {option.description && (
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
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

export default RadioGroupField;

