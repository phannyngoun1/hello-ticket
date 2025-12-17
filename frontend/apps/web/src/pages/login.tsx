import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { setLoggingOut } from "@truths/api";
import { storage } from "@truths/utils";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, useToast } from "@truths/ui";
import { PasswordInput, InputWithIcon, FormFieldWrapper, ErrorAlert } from "@truths/custom-ui";
import {
  Lock,
  User,
  CheckCircle,
  Home,
  LogOut,
} from "lucide-react";
import { authService, AuthenticationError } from "../services/auth-service";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  // password toggle is handled by PasswordInput
  const [isAlreadyAuthenticated, setIsAlreadyAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    general?: string;
  }>({});

  // Check if user is already authenticated
  useEffect(() => {
    const isAuth = authService.isAuthenticated();
    setIsAlreadyAuthenticated(isAuth);
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.username.trim()) {
      newErrors.username = t("pages.login.errors.usernameRequired");
    }

    if (!formData.password) {
      newErrors.password = t("pages.login.errors.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("pages.login.errors.passwordTooShort");
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
      // CRITICAL SECURITY: Clear all cached data before login
      // This prevents previous user's data from being accessible to new user
      queryClient.clear();
      queryClient.removeQueries();

      // Clear all user-specific cached data from localStorage (with safety check)
      if (storage && typeof storage.remove === "function") {
        storage.remove("REACT_QUERY_OFFLINE_CACHE"); // React Query persisted cache
        storage.remove("app_tabs"); // Tabs navigation state
        storage.remove("scroll_positions"); // Scroll positions

        // Clear all command palette recent searches (including user-specific ones)
        if (storage.removeMatching) {
          storage.removeMatching("^command-palette-recent");
        } else {
          storage.remove("command-palette-recent");
        }
      } else {
        console.warn(
          "Storage utility not available, cache may not be fully cleared"
        );
      }

      const response = await authService.login(formData);

      toast({
        title: t("pages.login.success"),
        description: t("pages.login.successDescription"),
      });

      // Invalidate all queries to ensure fresh data for new user
      await queryClient.invalidateQueries();

      // Check if user must change password
      if (response.must_change_password) {
        // Store flag and redirect to change-password
        authService.setMustChangePassword(true);
        navigate({ to: "/change-password" });
        return;
      }

      // Redirect to dashboard
      navigate({ to: "/dashboard" });
    } catch (error) {
      // Handle specific authentication error types
      if (error instanceof AuthenticationError) {
        let errorMessage = "";
        let toastTitle = t("pages.login.error");
        let toastDescription = "";

        switch (error.type) {
          case "locked": {
            // Format the locked until date
            let lockedMessage = "Your account has been locked.";
            if (error.lockedUntil) {
              try {
                const lockedDate = new Date(error.lockedUntil);
                const formattedDate = new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(lockedDate);
                lockedMessage = `Your account has been locked until ${formattedDate}.`;
              } catch {
                lockedMessage = `Your account has been locked. ${error.lockedUntil}`;
              }
            }
            errorMessage = lockedMessage;
            toastTitle = "Account Locked";
            toastDescription =
              lockedMessage +
              " Please contact your administrator or try again later.";
            break;
          }

          case "inactive":
            errorMessage = "Your account is inactive.";
            toastTitle = "Account Inactive";
            toastDescription =
              "Your account has been deactivated. Please contact your administrator to reactivate your account.";
            break;

          case "invalid_credentials":
          default:
            errorMessage = t("pages.login.errors.invalidCredentials");
            toastTitle = t("pages.login.error");
            toastDescription =
              "The username or password you entered is incorrect. Please try again.";
            break;
        }

        setErrors({
          general: errorMessage,
        });

        toast({
          title: toastTitle,
          description: toastDescription,
          variant: "destructive",
        });
      } else {
        // Handle generic errors
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";

        setErrors({
          general: t("pages.login.errors.invalidCredentials"),
        });

        toast({
          title: t("pages.login.error"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: "username" | "password", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogout = async () => {
    // Set logout flag to suppress session expired dialog
    // This ensures we redirect to login page instead of showing dialog
    setLoggingOut(true);

    try {
      await authService.logout();
      // Clear React Query cache to prevent showing previous user's data
      queryClient.clear();

      // Clear all command palette recent searches (including user-specific ones)
      if (storage.removeMatching) {
        storage.removeMatching("^command-palette-recent");
      } else {
        storage.remove("command-palette-recent");
      }

      setIsAlreadyAuthenticated(false);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      // Even if server logout fails, we're logged out locally
      // Still clear cache to prevent stale data
      queryClient.clear();

      // Clear all command palette recent searches even on error
      if (storage.removeMatching) {
        storage.removeMatching("^command-palette-recent");
      } else {
        storage.remove("command-palette-recent");
      }

      setIsAlreadyAuthenticated(false);
      toast({
        title: "Logged Out",
        description: "You have been logged out locally.",
      });
    }

    // Note: We're already on login page, so no navigation needed
    // Just clear the logout flag when user logs in again
  };

  const handleGoHome = () => {
    navigate({ to: "/" });
  };

  // If already authenticated, show "Already Logged In" message
  if (isAlreadyAuthenticated) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl">Already Logged In</CardTitle>
          <CardDescription className="text-base">
            You are currently logged in to your account. Would you like to
            continue to the home page or logout?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleGoHome} className="w-full" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Go to Home Page
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout & Login as Different User
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">
          {t("pages.login.title")}
        </CardTitle>
        <CardDescription>{t("pages.login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && <ErrorAlert message={errors.general} />}

          {/* Username/Email Field */}
          <FormFieldWrapper
            label={t("pages.login.usernameLabel")}
            htmlFor="username"
            error={errors.username}
          >
            <InputWithIcon
              id="username"
              type="text"
              placeholder={t("pages.login.usernamePlaceholder")}
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              error={Boolean(errors.username)}
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </FormFieldWrapper>

          {/* Password Field */}
          <FormFieldWrapper
            label={t("pages.login.passwordLabel")}
            htmlFor="password"
            error={errors.password}
          >
            <PasswordInput
              id="password"
              placeholder={t("pages.login.passwordPlaceholder")}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              error={Boolean(errors.password)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </FormFieldWrapper>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() =>
                toast({
                  title: "Feature Coming Soon",
                  description:
                    "Password reset functionality will be available soon.",
                })
              }
            >
              {t("pages.login.forgotPassword")}
            </button>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("pages.login.loggingIn") : t("pages.login.submit")}
          </Button>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-muted-foreground">
            {t("pages.login.noAccount")}{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() =>
                toast({
                  title: "Feature Coming Soon",
                  description: "Sign up functionality will be available soon.",
                })
              }
            >
              {t("pages.login.signUp")}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
