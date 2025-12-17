/**
 * Create User Dialog Component
 *
 * Full-screen dialog for creating new users with form validation
 *
 * @author Phanny
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@truths/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import { FormItem, FormLabel, FormControl, FormMessage } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { useDensityStyles } from "@truths/utils";
import { ApiError } from "@truths/api";
import { AccountComponentMetadata } from "../../registry";
import { CreateUserInput } from "../../types";

export interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserInput) => Promise<void>;
  loading?: boolean;
  error?: Error | null;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
}

const initialFormData: FormData = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  username: "",
  role: "user",
};

const roleOptions = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "guest", label: "Guest" },
];

export function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  error = null,
}: CreateUserDialogProps) {
  const density = useDensityStyles();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>(
    {}
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formKey, setFormKey] = useState(0); // Add key for force re-render
  const [localError, setLocalError] = useState<Error | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Sync error from props
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  /**
   * Parse API error response to extract detailed error information
   */
  const parseApiError = useCallback(
    (
      error: unknown
    ): {
      message: string;
      fieldErrors: Partial<Record<keyof FormData, string>>;
    } => {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      let errorMessage =
        "Failed to create user. Please check the form and try again.";

      if (error instanceof ApiError) {
        // Use the parsed message from ApiError
        errorMessage = error.message || errorMessage;

        // Field name mapping from backend to frontend
        const fieldMap: Record<string, keyof FormData> = {
          email: "email",
          password: "password",
          first_name: "firstName",
          lastName: "lastName",
          last_name: "lastName",
          firstName: "firstName",
          username: "username",
          role: "role",
          confirmPassword: "confirmPassword",
        };

        // Try to extract field-specific errors from the error response
        // For 422 validation errors, try to parse the raw error response
        if (error.status === 422 || error.status === 400) {
          try {
            // Try to access the raw error data if available
            // ApiError stores the raw message in its construction
            // We need to try parsing it as JSON to get the detail array
            let errorData: any = null;

            // Try to parse the message as JSON (it might be the full response)
            try {
              errorData = JSON.parse(error.message);
            } catch {
              // If message is not JSON, try to get it from error.toString or other sources
              // Check if there's a way to access raw response
              const errorString = error.toString();
              if (
                errorString.includes('"detail"') ||
                errorString.includes("'detail'")
              ) {
                try {
                  // Try to extract JSON from the string representation
                  const jsonMatch = errorString.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    errorData = JSON.parse(jsonMatch[0]);
                  }
                } catch {
                  // Ignore parsing errors
                }
              }
            }

            // If we have errorData, try to extract field-specific errors
            if (errorData) {
              // Check for Pydantic validation errors format: [{ "loc": ["field"], "msg": "...", "type": "..." }]
              if (errorData.detail && Array.isArray(errorData.detail)) {
                errorData.detail.forEach((err: any) => {
                  if (err.loc && Array.isArray(err.loc) && err.loc.length > 0) {
                    const fieldName = err.loc[err.loc.length - 1] as string;
                    const formField = fieldMap[fieldName];
                    if (formField && err.msg) {
                      // Format the error message to be user-friendly
                      let formattedMsg = err.msg;
                      if (err.type) {
                        // Add context based on error type
                        if (err.type.includes("value_error")) {
                          formattedMsg = `Invalid value: ${err.msg}`;
                        }
                      }
                      fieldErrors[formField] = formattedMsg;
                    }
                  }
                });
              }
              // Also check for error.details (from ValidationError)
              else if (
                errorData.details &&
                typeof errorData.details === "object"
              ) {
                Object.keys(errorData.details).forEach((key) => {
                  const formField = fieldMap[key];
                  if (formField) {
                    const detail = errorData.details[key];
                    fieldErrors[formField] =
                      typeof detail === "string"
                        ? detail
                        : JSON.stringify(detail);
                  }
                });
              }
            }
          } catch (parseError) {
            // If parsing fails, fall back to pattern matching
            console.debug("Failed to parse error details:", parseError);
          }
        }

        // Check for common error patterns in the message and map to fields
        const lowerMessage = errorMessage.toLowerCase();

        if (
          errorMessage.includes("Invalid email format") ||
          errorMessage.includes("invalid email")
        ) {
          fieldErrors.email =
            "The email address format is invalid. Please check and try again.";
          errorMessage =
            "Invalid email format. Please correct the email address.";
        } else if (lowerMessage.includes("email") && !fieldErrors.email) {
          // Generic email error - try to extract a more specific message
          if (
            lowerMessage.includes("already exists") ||
            lowerMessage.includes("duplicate")
          ) {
            fieldErrors.email =
              "This email address is already in use. Please use a different email.";
            errorMessage = "Email address already exists.";
          } else {
            fieldErrors.email = errorMessage;
          }
        }

        if (lowerMessage.includes("password") && !fieldErrors.password) {
          if (
            lowerMessage.includes("too short") ||
            lowerMessage.includes("minimum")
          ) {
            fieldErrors.password =
              "Password must be at least 8 characters long.";
          } else if (
            lowerMessage.includes("weak") ||
            lowerMessage.includes("strength")
          ) {
            fieldErrors.password =
              "Password does not meet security requirements.";
          } else {
            fieldErrors.password = errorMessage;
          }
        }

        if (lowerMessage.includes("username") && !fieldErrors.username) {
          if (
            lowerMessage.includes("already exists") ||
            lowerMessage.includes("duplicate")
          ) {
            fieldErrors.username =
              "This username is already taken. Please choose a different username.";
            errorMessage = "Username already exists.";
          } else {
            fieldErrors.username = errorMessage;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      return { message: errorMessage, fieldErrors };
    },
    []
  );

  const handleConfirmSubmit = async () => {
    try {
      const createUserData: CreateUserInput = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim() || undefined,
        role: formData.role,
      };

      await onSubmit(createUserData);

      // Reset form on success, keep dialog open for next record
      setFormData(initialFormData);
      setValidationErrors({});
      setLocalError(null);
      setShowConfirmDialog(false);
      setFormKey((prev) => prev + 1);
    } catch (error) {
      // Parse and display detailed error information
      const { message, fieldErrors } = parseApiError(error);

      // Set field-specific validation errors
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors(fieldErrors);
      }

      // Set general error message
      setLocalError(new Error(message));

      // Close confirmation dialog but keep main dialog open so user can fix errors
      setShowConfirmDialog(false);

      // Log for debugging
      console.error("Error creating user:", error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear error message when user starts typing
    if (localError) {
      setLocalError(null);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setValidationErrors({});
    onOpenChange(false);
  };

  const handleClear = () => {
    // Reset to initial values
    setFormData({ ...initialFormData });
    setValidationErrors({});
    setLocalError(null); // Clear the error
    // Force re-render by incrementing the key
    setFormKey((prev) => prev + 1);
  };

  // Focus the first field when dialog opens and after clearing
  useEffect(() => {
    if (open) {
      // Use rAF to ensure element is mounted before focusing
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
      });
    }
  }, [open, formKey]);

  // Handle Escape key - close confirmation dialog if open, otherwise let FullScreenDialog handle it
  // Note: This is only called when confirmation dialog is open (we check inside)
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (showConfirmDialog) {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirmDialog(false);
      }
      // If confirmation dialog is not open, we shouldn't reach here,
      // but if we do, let the event propagate (though FullScreenDialog already prevented default)
    },
    [showConfirmDialog]
  );

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title="Create User"
        maxWidth="500px"
        loading={loading}
        showClearButton
        onClear={handleClear}
        formSelector={formRef}
        onSubmit={handleSubmit}
        onEscape={showConfirmDialog ? handleEscape : undefined}
        autoClearShortcut={true}
        showCancelButton
        onCancel={handleClose}
        showSubmitButton
      >
        <form
          ref={formRef}
          key={formKey}
          onSubmit={handleSubmit}
          className={cn(density.spacingFormSection, "w-full")}
        >
          {/* Enterprise Form Grid */}
          <div
            className={cn(
              "bg-background border border-border rounded-lg shadow-sm mt-12",
              density.paddingForm
            )}
          >
            <div className={cn("grid grid-cols-1", density.gapForm)}>
              <FormItem className={density.spacingFormItem}>
                <FormLabel
                  htmlFor="firstName"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  First Name *
                </FormLabel>
                <FormControl>
                  <Input
                    id="firstName"
                    ref={firstInputRef}
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.firstName && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder="First name"
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>
                  {validationErrors.firstName}
                </FormMessage>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel
                  htmlFor="lastName"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  Last Name *
                </FormLabel>
                <FormControl>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.lastName && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder="Last name"
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>
                  {validationErrors.lastName}
                </FormMessage>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel
                  htmlFor="email"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  Email Address *
                </FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.email && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder="email@example.com"
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>
                  {validationErrors.email}
                </FormMessage>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel
                  htmlFor="username"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  Username (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.username && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder="username"
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>
                  {validationErrors.username}
                </FormMessage>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel
                  htmlFor="role"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  Role *
                </FormLabel>
                <FormControl>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                    disabled={loading}
                  >
                    <SelectTrigger
                      className={cn(density.inputHeight, density.textSize)}
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className={density.textSize}>
                      {roleOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className={density.textSize}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel
                  htmlFor="password"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  Password *
                </FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.password && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder="Password"
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>
                  {validationErrors.password}
                </FormMessage>
              </FormItem>

              <FormItem className={density.spacingFormItem}>
                <FormLabel
                  htmlFor="confirmPassword"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  Confirm Password *
                </FormLabel>
                <FormControl>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.confirmPassword && "border-destructive"
                    )}
                    disabled={loading}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage className={density.textSizeSmall}>
                  {validationErrors.confirmPassword}
                </FormMessage>
              </FormItem>
            </div>
          </div>

          {localError && (
            <div
              className={cn(
                "rounded-md bg-destructive/10 border border-destructive/20",
                density.paddingContainer,
                density.textSizeSmall,
                "text-destructive mt-4"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-destructive mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Error:</span>
                    <span>{localError.message || "Failed to create user"}</span>
                  </div>
                  {localError.message && (
                    <div className="text-xs text-destructive/80 mt-1">
                      Please review the fields highlighted in red and correct
                      any errors before trying again.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </FullScreenDialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          setShowConfirmDialog(open);
          // Prevent ESC from closing FullScreenDialog when confirmation dialog closes
          if (!open) {
            // Small delay to ensure event propagation is handled
            setTimeout(() => {
              // Focus back to the form to prevent FullScreenDialog from receiving ESC
              firstInputRef.current?.focus();
            }, 0);
          }
        }}
        title="Confirm User Creation"
        description={
          <>
            <p className="mb-3 text-xs">
              Are you sure you want to create a new user with the following
              information?
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">Name:</span>
                <span className="text-foreground">
                  {formData.firstName} {formData.lastName}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  Email:
                </span>
                <span className="text-foreground">{formData.email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground">Role:</span>
                <span className="text-foreground capitalize">
                  {formData.role}
                </span>
              </div>
            </div>
          </>
        }
        confirmAction={{
          label: loading ? "Creating..." : "Confirm & Create",
          onClick: handleConfirmSubmit,
          loading: loading,
          disabled: loading,
        }}
        cancelAction={{
          label: "Cancel",
          variant: "outline",
          disabled: loading,
        }}
      />
    </>
  );
}

export function createUserDialogMetadata(): AccountComponentMetadata {
  return {
    name: "Create User Dialog",
    description:
      "Full-screen dialog for creating new users with form validation",
    category: "users",
    tags: ["users", "create", "dialog", "form", "validation", "fullscreen"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
