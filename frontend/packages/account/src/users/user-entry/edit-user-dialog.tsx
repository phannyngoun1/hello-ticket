/**
 * Edit User Dialog Component
 *
 * Dialog for editing existing user information
 *
 * @author Phanny
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@truths/ui";
import { Button } from "@truths/ui";
import { Input } from "@truths/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@truths/ui";
import { Label, cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { AccountComponentMetadata } from "../../registry";
import { User, UpdateUserInput } from "../../types";

export interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSubmit: (userId: string, data: UpdateUserInput) => Promise<void>;
  loading?: boolean;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  loading = false,
}: EditUserDialogProps) {
  const density = useDensityStyles();
  const [formData, setFormData] = useState<UpdateUserInput>({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    baseRole: user.baseRole || user.role,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateUserInput, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when user changes
  React.useEffect(() => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      baseRole: user.baseRole || user.role,
    });
    setErrors({});
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateUserInput, string>> = {};
    // No validation needed for first/last name
    setErrors(newErrors);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(user.id, formData);
      onOpenChange(false);
    } catch (error) {
      setErrors({ firstName: "Failed to update user. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof UpdateUserInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      // Reset form on close
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        baseRole: user.baseRole || user.role,
      });
      setErrors({});
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[600px]",
          density.paddingContainer,
          density.gapButtonGroup
        )}
      >
        <DialogHeader className={density.spacingFormItem}>
          <DialogTitle className={cn(density.textSizeLabel, "font-semibold")}>
            Edit User
          </DialogTitle>
          <DialogDescription
            className={cn(density.textSizeSmall, "text-muted-foreground")}
          >
            Update user information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className={cn("space-y-4 py-4")}>
            <div className={cn("grid gap-4 md:grid-cols-2", density.gapForm)}>
              {/* First Name */}
              <div className={density.spacingFormItem}>
                <Label
                  htmlFor="firstName"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="John"
                  disabled={isSubmitting || loading}
                  className={cn(density.inputHeight, density.textSize)}
                />
              </div>

              {/* Last Name */}
              <div className={density.spacingFormItem}>
                <Label
                  htmlFor="lastName"
                  className={cn(density.textSizeLabel, "font-medium")}
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Doe"
                  disabled={isSubmitting || loading}
                  className={cn(density.inputHeight, density.textSize)}
                />
              </div>
            </div>

            {/* Base Role (System) */}
            <div className={density.spacingFormItem}>
              <Label
                htmlFor="baseRole"
                className={cn(density.textSizeLabel, "font-medium")}
              >
                Base role (system)
              </Label>
              <Select
                value={formData.baseRole}
                onValueChange={(value) => handleChange("baseRole", value)}
                disabled={isSubmitting || loading}
              >
                <SelectTrigger
                  className={cn(density.inputHeight, density.textSize)}
                >
                  <SelectValue placeholder="Select a base role" />
                </SelectTrigger>
                <SelectContent className={density.textSize}>
                  <SelectItem value="admin" className={density.textSize}>
                    Admin
                  </SelectItem>
                  <SelectItem value="manager" className={density.textSize}>
                    Manager
                  </SelectItem>
                  <SelectItem value="user" className={density.textSize}>
                    User
                  </SelectItem>
                  <SelectItem value="guest" className={density.textSize}>
                    Guest
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className={density.gapButtonGroup}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || loading}
              className={cn(
                density.buttonHeightSmall,
                "px-3",
                density.textSizeSmall,
                "font-medium"
              )}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className={cn(
                density.buttonHeightSmall,
                "px-3",
                density.textSizeSmall,
                "font-medium"
              )}
            >
              {isSubmitting || loading ? (
                <>
                  <div
                    className={cn(
                      "mr-2",
                      density.iconSize,
                      "animate-spin rounded-full border-2 border-background border-t-transparent"
                    )}
                  />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function editUserDialogMetadata(): AccountComponentMetadata {
  return {
    name: "Edit User Dialog",
    description: "Dialog for editing existing user information",
    category: "users",
    tags: ["users", "edit", "dialog", "form"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
