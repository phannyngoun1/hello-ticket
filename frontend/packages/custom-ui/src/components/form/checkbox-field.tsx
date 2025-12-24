/**
 * Checkbox Field Component
 *
 * Reusable checkbox field component that integrates with react-hook-form.
 * Handles boolean/checkbox inputs with validation.
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
import { Checkbox, Field, FieldLabel, FieldError } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

export interface CheckboxFieldProps<
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
   * Label text for the checkbox
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
   * Helper text displayed below the checkbox
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
   * Description text shown next to the label
   */
  description?: string;
}

/**
 * Checkbox Field Component
 *
 * A reusable checkbox field that integrates with react-hook-form.
 * Automatically handles validation errors and displays them.
 */
export function CheckboxField<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  required = false,
  disabled = false,
  helperText,
  className,
  errorMessage,
  description,
  control: controlProp,
}: CheckboxFieldProps<TFieldValues>) {
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
      <div className="flex items-start space-x-2">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Checkbox
              id={name}
              checked={field.value || false}
              onCheckedChange={(checked) => {
                field.onChange(checked === true);
              }}
              disabled={disabled}
              aria-invalid={hasError}
              aria-describedby={
                displayError || helperText || description
                  ? `${name}-${displayError ? "error" : helperText ? "helper" : "description"}`
                  : undefined
              }
              className={cn(hasError && "border-destructive")}
            />
          )}
        />
        <div className="space-y-1 leading-none">
          {label && (
            <FieldLabel
              htmlFor={name}
              className="cursor-pointer font-normal"
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FieldLabel>
          )}
          {description && (
            <p
              id={`${name}-description`}
              className="text-sm text-muted-foreground"
            >
              {description}
            </p>
          )}
        </div>
      </div>
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

export default CheckboxField;

