/**
 * File Input Field Component
 *
 * Reusable file input field component that integrates with react-hook-form.
 * Handles file uploads with validation.
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
import { Input, Field, FieldLabel, FieldError, Button } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Upload } from "lucide-react";
import { useRef } from "react";

export interface FileInputFieldProps<
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
   * Accepted file types (e.g., "image/*", ".pdf", "image/png,image/jpeg")
   */
  accept?: string;

  /**
   * Whether to allow multiple files
   */
  multiple?: boolean;

  /**
   * Maximum file size in bytes
   */
  maxSize?: number;

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
   * Custom button text
   */
  buttonText?: string;
}

/**
 * File Input Field Component
 *
 * A reusable file input field that integrates with react-hook-form.
 * Automatically handles validation errors and displays them.
 * The value is stored as a FileList or File object.
 */
export function FileInputField<
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  label,
  placeholder = "Choose a file...",
  required = false,
  disabled = false,
  accept,
  multiple = false,
  maxSize,
  helperText,
  className,
  errorMessage,
  buttonText = "Browse",
  control: controlProp,
}: FileInputFieldProps<TFieldValues>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        render={({ field: { onChange, value, ...field } }) => (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                {...field}
                ref={fileInputRef}
                id={name}
                type="file"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    // Validate file size if maxSize is provided
                    if (maxSize) {
                      const invalidFiles = Array.from(files).filter(
                        (file) => file.size > maxSize
                      );
                      if (invalidFiles.length > 0) {
                        // You might want to show an error here
                        return;
                      }
                    }
                    onChange(multiple ? files : files[0] || null);
                  } else {
                    onChange(null);
                  }
                }}
                className="hidden"
                aria-invalid={hasError}
                aria-describedby={
                  displayError || helperText
                    ? `${name}-${displayError ? "error" : "helper"}`
                    : undefined
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className={cn(hasError && "border-destructive")}
              >
                <Upload className="mr-2 h-4 w-4" />
                {buttonText}
              </Button>
              {value && (
                <span className="text-sm text-muted-foreground">
                  {multiple
                    ? `${(value as FileList).length} file(s) selected`
                    : (value as File).name}
                </span>
              )}
            </div>
            {!value && placeholder && (
              <p className="text-sm text-muted-foreground">{placeholder}</p>
            )}
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

export default FileInputField;

