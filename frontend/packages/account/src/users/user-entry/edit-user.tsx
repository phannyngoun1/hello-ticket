/**
 * Edit User Component
 *
 * Form to edit existing user information.
 */

import React, { useState, useEffect } from "react";
import { Card } from "@truths/ui";
import { Button } from "@truths/ui";
import { Input } from "@truths/ui";
import { Label } from "@truths/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { AccountComponentMetadata } from "../../registry";
import { User, UpdateUserInput } from "../../types";

export interface EditUserProps {
  className?: string;
  user: User;
  onSubmit: (userId: string, data: UpdateUserInput) => Promise<void> | void;
  onCancel?: () => void;
  onSuccess?: () => void;
  availableRoles?: Array<{ value: string; label: string }>;
  availableStatuses?: Array<{ value: User["status"]; label: string }>;
  loading?: boolean;
}

export function EditUser({
  className,
  user,
  onSubmit,
  onCancel,
  onSuccess,
  availableRoles = [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
  ],
  availableStatuses = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
    { value: "pending", label: "Pending" },
  ],
  loading = false,
}: EditUserProps) {
  const [formData, setFormData] = useState<UpdateUserInput>({
    email: user.email,
    username: user.username || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    baseRole: user.baseRole || user.role,
    status: user.status,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateUserInput, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      email: user.email,
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      baseRole: user.baseRole || user.role,
      status: user.status,
    });
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateUserInput, string>> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(user.id, formData);
      onSuccess?.();
    } catch (error) {
      setErrors({ email: "Failed to update user. Please try again." });
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

  return (
    <Card className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Edit User</h3>
          <p className="text-sm text-muted-foreground">
            Update user information
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="John"
              disabled={isSubmitting || loading}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Doe"
              disabled={isSubmitting || loading}
            />
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="johndoe"
            disabled={isSubmitting || loading}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@example.com"
            disabled={isSubmitting || loading}
            required
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.baseRole}
              onValueChange={(value) => handleChange("baseRole", value)}
              disabled={isSubmitting || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                handleChange("status", value as User["status"])
              }
              disabled={isSubmitting || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || loading}>
            {isSubmitting || loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function editUserMetadata(): AccountComponentMetadata {
  return {
    name: "Edit User",
    description: "Form to edit existing user information",
    category: "users",
    tags: ["users", "form", "edit", "management"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
