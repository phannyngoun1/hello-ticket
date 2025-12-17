import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Settings, User } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  useToast,
} from "@truths/ui";
import { authService } from "../../services/auth-service";
import { setLoggingOut } from "@truths/api";
import { storage } from "@truths/utils";

interface ProfileDropdownProps {
  className?: string;
}

export function ProfileDropdown({ className }: ProfileDropdownProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
  });

  const handleLogout = async () => {
    // Set logout flag to suppress session expired dialog
    // This ensures we redirect to login page instead of showing dialog
    setLoggingOut(true);

    try {
      // Clear tokens and invalidate on server
      await authService.logout();

      // Clear all React Query cache to prevent showing previous user's data
      queryClient.clear();

      // Clear all command palette recent searches (including user-specific ones)
      if (storage.removeMatching) {
        storage.removeMatching("^command-palette-recent");
      } else {
        storage.remove("command-palette-recent");
      }

      // Show success message
      toast({
        title: t("common.success"),
        description: t("auth.logoutSuccess"),
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
      
      toast({
        title: t("common.success"),
        description: "Logged out locally",
      });
    }

    // Redirect to login page immediately
    // The logout flag will be cleared when user logs in again or page reloads
    navigate({ to: "/login" });
  };

  // Get user initials for avatar
  const getInitials = (): string => {
    if (!user) return "??";

    // Try first_name and last_name first (backend format)
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }

    // Fall back to name field (legacy format)
    if (user.name) {
      const names = user.name.trim().split(/\s+/);
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }

    // Fall back to username
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }

    // Last resort: use email
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return "??";
  };

  // Get display name
  const getDisplayName = (): string => {
    if (!user) return "User";

    // Try first_name and last_name first
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }

    // Fall back to name field
    if (user.name) {
      return user.name;
    }

    // Fall back to username
    if (user.username) {
      return user.username;
    }

    return "User";
  };

  // Get email
  const getEmail = (): string => {
    return user?.email || "user@example.com";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`relative h-8 w-8 rounded-full p-0 hover:bg-accent/50 transition-all duration-200 ${className || ""}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={getDisplayName()} />
            <AvatarFallback className="text-sm font-medium">
              {isLoading ? "..." : getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {isLoading ? "Loading..." : getDisplayName()}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {getEmail()}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>{t("common.profile")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings/profile" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t("common.settings")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("common.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
