import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@truths/ui";
import { User as UserIcon, Mail, Shield, Building2 } from "lucide-react";
import { authService } from "../services/auth-service";
import { useRequireAuth } from "../hooks/use-require-auth";

export function ProfilePage() {
  const { t } = useTranslation();

  // Check authentication on mount
  useRequireAuth();

  // Fetch current user data (shared cache)
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 2 * 60 * 1000, // 2 min
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pages.profile.title")}
          </h1>
          <p className="text-muted-foreground">{t("pages.profile.loading")}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pages.profile.title")}
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              {t("pages.profile.error")}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format role for display
  const formatRole = (role: string) => {
    if (!role) return "";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  // Get user's full name
  const getUserName = () => {
    if (!user) return "";
    // Check if user has name field
    if ("name" in user && user.name) {
      return user.name;
    }
    // Otherwise construct from first_name and last_name
    const firstName = ("first_name" in user ? user.first_name : "") || "";
    const lastName = ("last_name" in user ? user.last_name : "") || "";
    return `${firstName} ${lastName}`.trim() || user.username || user.email;
  };

  const userName = getUserName();
  const userRole = user.role || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("pages.profile.title")}
        </h1>
        <p className="text-muted-foreground">{t("pages.profile.subtitle")}</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className="text-2xl">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{userName}</CardTitle>
              <CardDescription className="text-base">
                @{user.username}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="h-fit">
              {formatRole(userRole)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Information Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t("pages.profile.contactInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("pages.profile.email")}
              </label>
              <p className="text-base">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("pages.profile.username")}
              </label>
              <p className="text-base">@{user.username}</p>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("pages.profile.accountInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("pages.profile.userId")}
              </label>
              <p className="font-mono text-sm">
                {user.id || user.sub || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("pages.profile.role")}
              </label>
              <p className="text-base">{formatRole(userRole)}</p>
            </div>
            {user.tenant_id && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  {t("pages.profile.tenantId")}
                </label>
                <p className="font-mono text-sm">{user.tenant_id}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {t("pages.profile.additionalInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("pages.profile.displayName")}
              </label>
              <p className="text-base">{userName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("pages.profile.accountStatus")}
              </label>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-base">{t("pages.profile.active")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
