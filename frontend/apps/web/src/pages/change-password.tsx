import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  useToast,
} from "@truths/ui";
import { Eye, EyeOff, Lock, AlertCircle, KeyRound } from "lucide-react";
import { authService } from "../services/auth-service";
import { useDensityStyles } from "@truths/utils";
import { cn } from "@truths/ui";

export function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const density = useDensityStyles();

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });

      // Clear the flag
      authService.clearMustChangePassword();

      toast({
        title: "Password Changed",
        description: "Your password has been successfully changed.",
      });

      // Redirect to home
      navigate({ to: "/" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to change password";

      setErrors({
        general: errorMessage,
      });

      toast({
        title: "Password Change Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className={cn(density.spacingFormItem, "text-center")}>
        <div className={cn("flex justify-center", density.gapFormItem)}>
          <div className={cn("rounded-full bg-primary/10 flex items-center justify-center", density.iconSize === "h-4 w-4" ? "h-10 w-10" : "h-12 w-12")}>
            <KeyRound className={cn("text-primary", density.iconSize === "h-4 w-4" ? "h-5 w-5" : "h-6 w-6")} />
          </div>
        </div>
        <CardTitle className={cn("font-bold", density.textSize === "text-sm" ? "text-xl" : "text-2xl")}>
          Change Your Password
        </CardTitle>
        <CardDescription className={density.textSizeSmall}>
          For security reasons, please change your password before continuing.
        </CardDescription>
      </CardHeader>
      <CardContent className={density.paddingContainer}>
        <form onSubmit={handleSubmit} className={density.spacingFormSection}>
          {/* General Error */}
          {errors.general && (
            <div className={cn("flex items-center gap-2 text-destructive bg-destructive/10 rounded-md", density.paddingCell, density.textSizeSmall)}>
              <AlertCircle className={density.iconSizeSmall} />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div className={density.spacingFormItem}>
            <Label htmlFor="current-password" className={density.textSizeLabel}>Current Password</Label>
            <div className="relative">
              <Lock className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground", density.iconSizeSmall)} />
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={formData.currentPassword}
                onChange={(e) =>
                  handleInputChange("currentPassword", e.target.value)
                }
                className={cn("pl-10 pr-10", density.inputHeight, density.textSize, errors.currentPassword ? "border-destructive" : "")}
                disabled={isLoading}
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className={cn("absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors")}
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeOff className={density.iconSizeSmall} />
                ) : (
                  <Eye className={density.iconSizeSmall} />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className={cn("text-destructive", density.textSizeSmall)}>
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div className={density.spacingFormItem}>
            <Label htmlFor="new-password" className={density.textSizeLabel}>New Password</Label>
            <div className="relative">
              <Lock className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground", density.iconSizeSmall)} />
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={formData.newPassword}
                onChange={(e) =>
                  handleInputChange("newPassword", e.target.value)
                }
                className={cn("pl-10 pr-10", density.inputHeight, density.textSize, errors.newPassword ? "border-destructive" : "")}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={cn("absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors")}
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className={density.iconSizeSmall} />
                ) : (
                  <Eye className={density.iconSizeSmall} />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className={cn("text-destructive", density.textSizeSmall)}>{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className={density.spacingFormItem}>
            <Label htmlFor="confirm-password" className={density.textSizeLabel}>Confirm New Password</Label>
            <div className="relative">
              <Lock className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground", density.iconSizeSmall)} />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                className={cn("pl-10 pr-10", density.inputHeight, density.textSize, errors.confirmPassword ? "border-destructive" : "")}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={cn("absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors")}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className={density.iconSizeSmall} />
                ) : (
                  <Eye className={density.iconSizeSmall} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className={cn("text-destructive", density.textSizeSmall)}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className={cn("w-full flex items-center gap-1.5", density.buttonHeightSmall, density.paddingCell, density.textSizeSmall)} disabled={isLoading}>
            <KeyRound className={density.iconSizeSmall} />
            <span>{isLoading ? "Changing Password..." : "Change Password"}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
