import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useQueryClient } from "@tanstack/react-query";
import { setLoggingOut } from "@truths/api";
import { Moon, Sun, Search, Menu, User, LogOut, Settings } from "lucide-react";
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
import { useTheme } from "../../providers/use-theme";
import { LanguageSelector } from "./language-selector";
import { authService } from "../../services/auth-service";
import { storage } from "@truths/utils";
import { MainNavigationMenu } from "./main-navigation-menu";

interface HeaderProps {
  onCommandPaletteOpen?: () => void;
}

export function Header({ onCommandPaletteOpen }: HeaderProps) {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  // location hook not needed in parent after centralization
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Legacy tab position state removed from header; managed by tabs module

  // Tabs position listener removed; handled within tabs module

  const toggleTheme = () => {
    // If theme is "system", switch to the opposite of the resolved theme
    // Otherwise, toggle between dark and light
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

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

  // Detect OS for keyboard shortcut display
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcutKey = isMac ? "⌘" : "Ctrl";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center group">
            <div className="relative">
              <span className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                Hello Ticket
              </span>
              <div className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </div>
          </Link>
          <div className="hidden lg:flex">
            <MainNavigationMenu />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => onCommandPaletteOpen?.()}
            aria-label="Open quick navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Command Palette Trigger */}
          <Button
            variant="outline"
            className="relative h-8 w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 sm:pr-8 md:w-32 lg:w-40 border-border/50 hover:border-border min-w-[80px]"
            onClick={onCommandPaletteOpen}
          >
            <Search className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline-flex truncate">Search...</span>
            <span className="inline-flex sm:hidden">Search</span>
            <kbd className="pointer-events-none absolute right-1 top-1 hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-[9px]">{shortcutKey}</span>K
            </kbd>
          </Button>

          <LanguageSelector />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-accent/50 transition-all duration-200"
            onClick={toggleTheme}
            aria-label={t("theme.toggle")}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full p-0 hover:bg-accent/50 transition-all duration-200"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="text-sm font-medium">
                    JD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@example.com
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
        </div>
      </div>
    </header>
  );
}
