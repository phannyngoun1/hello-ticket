/**
 * Password Change Component
 *
 * Form to change user password with validation.
 */

import React, { useState } from "react";
import { Card } from "@truths/ui";
import { Button } from "@truths/ui";
import { Input } from "@truths/ui";
import { Label } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { AccountComponentMetadata } from "../registry";
import { ChangePasswordInput } from "../types";

export interface PasswordChangeProps {
  className?: string;
  onSubmit: (data: ChangePasswordInput) => Promise<void> | void;
  onCancel?: () => void;
  onSuccess?: () => void;
  requireOldPassword?: boolean;
  loading?: boolean;
  minPasswordLength?: number;
}

export function PasswordChange({
  className,
  onSubmit,
  onCancel,
  onSuccess,
  requireOldPassword = true,
  loading = false,
  minPasswordLength = 8,
}: PasswordChangeProps) {
  const [formData, setFormData] = useState<ChangePasswordInput>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ChangePasswordInput, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ChangePasswordInput, string>> = {};

    if (requireOldPassword && !formData.oldPassword) {
      newErrors.oldPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < minPasswordLength) {
      newErrors.newPassword = `Password must be at least ${minPasswordLength} characters`;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (requireOldPassword && formData.oldPassword === formData.newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
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
      onSuccess?.();
      // Clear form on success
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setErrors({
        oldPassword: "Failed to change password. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ChangePasswordInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getPasswordStrength = (
    password: string
  ): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= minPasswordLength) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ];

    return {
      strength,
      label: labels[strength] || "Very Weak",
      color: colors[strength] || "bg-red-500",
    };
  };

  const passwordStrength = formData.newPassword
    ? getPasswordStrength(formData.newPassword)
    : null;

  return (
    <Card className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Change Password</h3>
          <p className="text-sm text-muted-foreground">
            Update your password to keep your account secure
          </p>
        </div>

        {/* Current Password */}
        {requireOldPassword && (
          <div className="space-y-2">
            <Label htmlFor="oldPassword">
              Current Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="oldPassword"
              type={showPasswords ? "text" : "password"}
              value={formData.oldPassword}
              onChange={(e) => handleChange("oldPassword", e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting || loading}
              required
              autoComplete="current-password"
            />
            {errors.oldPassword && (
              <p className="text-sm text-destructive">{errors.oldPassword}</p>
            )}
          </div>
        )}

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">
            New Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="newPassword"
            type={showPasswords ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) => handleChange("newPassword", e.target.value)}
            placeholder="••••••••"
            disabled={isSubmitting || loading}
            required
            autoComplete="new-password"
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword}</p>
          )}

          {/* Password Strength Indicator */}
          {passwordStrength && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      i < passwordStrength.strength
                        ? passwordStrength.color
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength:{" "}
                <span className="font-medium">{passwordStrength.label}</span>
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Password must be at least {minPasswordLength} characters long
          </p>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm New Password <span className="text-destructive">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type={showPasswords ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            placeholder="••••••••"
            disabled={isSubmitting || loading}
            required
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Show Password Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showPasswords"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            title="Show passwords"
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="showPasswords" className="text-sm font-normal">
            Show passwords
          </Label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
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
                Changing Password...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function passwordChangeMetadata(): AccountComponentMetadata {
  return {
    name: "Password Change",
    description: "Form to change user password with validation",
    category: "profile",
    tags: ["profile", "password", "security", "form"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
