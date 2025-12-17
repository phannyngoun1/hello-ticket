import { ReactNode, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@truths/ui";
import { ShieldAlert, LogIn } from "lucide-react";
import { authService } from "../../services/auth-service";
import { AuthLayout } from "../layouts/auth-layout";
import { RootLayout } from "../layouts/root-layout";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectToLogin?: boolean;
  useLayout?: boolean;
}

export function ProtectedRoute({
  children,
  redirectToLogin = false,
  useLayout = true,
}: ProtectedRouteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    // Auto-redirect to login if redirectToLogin is true
    if (!isAuthenticated && redirectToLogin) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, redirectToLogin, navigate]);

  if (!isAuthenticated) {
    // Show authentication required page with AuthLayout
    return (
      <AuthLayout>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {t("auth.authenticationRequired")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("auth.authenticationRequiredMessage")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full" size="lg">
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                {t("common.login")}
              </Link>
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => {
                  // For now, just show a message since signup isn't implemented yet
                  alert(t("auth.signupComingSoon"));
                }}
              >
                {t("auth.signUp")}
              </button>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  // User is authenticated - wrap with RootLayout if useLayout is true
  if (useLayout) {
    return <RootLayout>{children}</RootLayout>;
  }

  return <>{children}</>;
}
