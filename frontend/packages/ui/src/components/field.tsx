import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../lib/utils";

/**
 * Field - Container for form fields with label, description, and error handling
 */
const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    "data-invalid"?: boolean;
  }
>(({ className, "data-invalid": dataInvalid, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-invalid={dataInvalid}
      className={cn("space-y-2", className)}
      {...props}
    />
  );
});
Field.displayName = "Field";

/**
 * FieldGroup - Groups multiple fields together
 */
const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-4", className)}
      {...props}
    />
  );
});
FieldGroup.displayName = "FieldGroup";

/**
 * FieldLabel - Label for form fields
 */
const FieldLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});
FieldLabel.displayName = "FieldLabel";

/**
 * FieldDescription - Helper text for form fields
 */
const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FieldDescription.displayName = "FieldDescription";

/**
 * FieldError - Error message display for form fields
 */
interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  errors?: Array<{ message?: string } | string>;
}

const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, errors, children, ...props }, ref) => {
    if (!errors && !children) {
      return null;
    }

    const errorMessages = errors
      ? errors.map((error) =>
          typeof error === "string" ? error : error?.message || ""
        )
      : [];

    if (errorMessages.length === 0 && !children) {
      return null;
    }

    return (
      <p
        ref={ref}
        className={cn("text-sm font-medium text-destructive", className)}
        {...props}
      >
        {children || errorMessages.join(", ")}
      </p>
    );
  }
);
FieldError.displayName = "FieldError";

export { Field, FieldGroup, FieldLabel, FieldDescription, FieldError };

