import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Moon, Sun, Search, Menu } from "lucide-react";
import { Button } from "@truths/ui";
import { useTheme } from "../../providers/use-theme";
import { LanguageSelector } from "./language-selector";
import { storage } from "@truths/utils";
import { TabManager } from "../tabs/tab-manager";
import { ProfileDropdown } from "./profile-dropdown";
import { MainNavigationMenu } from "./main-navigation-menu";

interface HeaderWithTabsProps {
  onCommandPaletteOpen?: () => void;
}

export function HeaderWithTabs({ onCommandPaletteOpen }: HeaderWithTabsProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  // location not needed here; used within CentralizedNavGrid

  const [tabPosition, setTabPosition] = useState<"separate" | "inline">(() => {
    const saved = storage.get<"separate" | "inline">("tab_position");
    return saved ?? "separate";
  });

  // Listen for tab position changes
  useEffect(() => {
    const handleTabPositionChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setTabPosition(customEvent.detail.position);
    };

    window.addEventListener("tab-position-changed", handleTabPositionChange);
    return () => {
      window.removeEventListener(
        "tab-position-changed",
        handleTabPositionChange
      );
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Detect OS for keyboard shortcut display
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcutKey = isMac ? "⌘" : "Ctrl";

  return (
    <header className="sticky-header w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      {tabPosition === "inline" ? (
        // Inline mode: Single row with tabs integrated with main header elements
        <div className="container flex h-12 items-center justify-between px-4 sm:px-6">
          <div className="flex gap-3 items-center flex-1 min-w-0">
            {/* Logo */}
            <Link to="/" className="flex items-center group flex-shrink-0">
              <div className="relative">
                <span className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                  Hello Ticket
                </span>
                <div className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
              </div>
            </Link>

            <div className="hidden lg:flex flex-shrink-0">
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

            {/* Inline tabs integrated with main header */}
            <div className="flex items-center gap-1.5 max-w-[500px] min-w-0 flex-1">
              <TabManager inline={true} />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
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
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      ) : (
        // Separate mode: Single row layout
        <div className="container flex h-12 items-center justify-between px-4 sm:px-6">
          <div className="flex gap-3 items-center">
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
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      )}
    </header>
  );
}
