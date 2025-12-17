/**
 * Create User Component
 *
 * Form to create new users with validation.
 */

import React, { useState } from "react";
import { Card } from "@truths/ui";
import { Button } from "@truths/ui";
import { Input } from "@truths/ui";
import { Label } from "@truths/ui";
import { Select } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { AccountComponentMetadata } from "../../registry";
import { CreateUserInput } from "../../types";

export interface CreateUserProps {
  className?: string;
  onSubmit: (data: CreateUserInput) => Promise<void> | void;
  onCancel?: () => void;
  onSuccess?: (userId: string) => void;
  availableRoles?: Array<{ value: string; label: string }>;
  requirePassword?: boolean;
  loading?: boolean;
}

export function CreateUser({
  className,
  onSubmit,
  onCancel,
  onSuccess,
  availableRoles = [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
  ],
  requirePassword = true,
  loading = false,
}: CreateUserProps) {
  const [formData, setFormData] = useState<CreateUserInput>({
    email: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
    baseRole: "user",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateUserInput, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateUserInput, string>> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (requirePassword && !formData.password) {
      newErrors.password = "Password is required";
    } else if (
      requirePassword &&
      formData.password &&
      formData.password.length < 8
    ) {
      newErrors.password = "Password must be at least 8 characters";
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
      await onSubmit(formData);
      onSuccess?.("new-user-id"); // In real implementation, get from API response
    } catch (error) {
      setErrors({ email: "Failed to create user. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateUserInput, value: any) => {
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
          <h3 className="text-lg font-semibold">Create New User</h3>
          <p className="text-sm text-muted-foreground">
            Add a new user to your organization
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
              autoComplete="given-name"
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
              autoComplete="family-name"
            />
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username (Optional)</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="johndoe"
            disabled={isSubmitting || loading}
            autoComplete="username"
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
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        {requirePassword && (
          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting || loading}
              required
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>
        )}

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.baseRole}
            onValueChange={(value) => handleChange("baseRole", value)}
            disabled={isSubmitting || loading}
          >
            {availableRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
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
                Creating...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function createUserMetadata(): AccountComponentMetadata {
  return {
    name: "Create User",
    description: "Form to create new users with validation",
    category: "users",
    tags: ["users", "form", "create", "management"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
