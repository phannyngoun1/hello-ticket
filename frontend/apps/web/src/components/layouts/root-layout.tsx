import { ReactNode, useState, useEffect } from "react";
import { HeaderWithTabs } from "../navigation/header-with-tabs";
import { useCommandPalette } from "@truths/custom-ui";
import { useRestoreScroll } from "../../hooks/use-restore-scroll";
import { TabManager } from "../tabs/tab-manager";
import { storage } from "@truths/utils";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { authService } from "../../services/auth-service";
import { AppCommandPalette } from "../app-command-palette";
import { useAppCommandPalette } from "../../hooks/use-app-command-palette";

interface RootLayoutProps {
  children: ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { open, setOpen } = useCommandPalette(navigate);
  const { dataTypes, navigationItems, quickActions, userId } =
    useAppCommandPalette(open);
  const [tabPosition, setTabPosition] = useState<"separate" | "inline">(() => {
    const saved = storage.get<"separate" | "inline">("tab_position");
    return saved ?? "separate";
  });

  // Check if user must change password and redirect if needed
  useEffect(() => {
    // Don't redirect if already on change-password page
    if (location.pathname === "/change-password") {
      return;
    }

    const mustChangePassword = authService.getMustChangePassword();
    if (mustChangePassword && authService.isAuthenticated()) {
      navigate({ to: "/change-password" });
    }
  }, [location.pathname, navigate]);

  // Set document title
  useEffect(() => {
    document.title = "Hello Ticket";
  }, []);

  // Preserve scroll position when navigating between tasks
  useRestoreScroll();

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

  return (
    <div className="min-h-screen bg-background min-w-[1024px]">
      <div className="print:hidden">
        <HeaderWithTabs onCommandPaletteOpen={() => setOpen(true)} />
        {tabPosition === "separate" && <TabManager />}
      </div>
      <main className="container py-3">{children}</main>
      <AppCommandPalette
        open={open}
        onOpenChange={setOpen}
        dataTypes={dataTypes}
        navigationItems={navigationItems}
        quickActions={quickActions}
        userId={userId}
      />
    </div>
  );
}
