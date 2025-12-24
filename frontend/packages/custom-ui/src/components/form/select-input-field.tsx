/**
 * Select Input Field Component
 *
 * Reusable select/dropdown field component that integrates with react-hook-form.
 * Supports single selection with searchable options.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Field,
  FieldLabel,
  FieldError,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

export interface SelectOption {
  /**
   * The value of the option
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
}

export interface SelectInputFieldProps<
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
   * Placeholder text when no option is selected
   */
  placeholder?: string;

  /**
   * Array of select options
   */
  options: SelectOption[];

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the field is disabled
   */
  disabled?: boolean;

  /**
   * Helper text displayed below the select
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
   * Whether to allow clearing the selection (shows "None" option)
   */
  allowClear?: boolean;

  /**
   * Label for the clear option (when allowClear is true)
   * @default "None"
   */
  clearLabel?: string;
}

/**
 * Select Input Field Component
 *
 * A reusable select/dropdown field that integrates with react-hook-form.
 * Automatically handles validation errors and displays them.
 */
export function SelectInputField<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  placeholder = "Select an option",
  options,
  required = false,
  disabled = false,
  helperText,
  className,
  errorMessage,
  allowClear = false,
  clearLabel = "None",
  control: controlProp,
}: SelectInputFieldProps<TFieldValues>) {
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
          <Select
            value={field.value || ""}
            onValueChange={(value) => {
              // Handle clear option
              if (allowClear && value === "__clear__") {
                field.onChange(undefined);
              } else {
                field.onChange(value);
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id={name}
              className={cn(hasError && "border-destructive", className)}
              aria-invalid={hasError}
              aria-describedby={
                displayError || helperText
                  ? `${name}-${displayError ? "error" : "helper"}`
                  : undefined
              }
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {allowClear && (
                <SelectItem value="__clear__">{clearLabel}</SelectItem>
              )}
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

export default SelectInputField;

