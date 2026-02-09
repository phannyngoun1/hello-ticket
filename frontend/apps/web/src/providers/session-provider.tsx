import { useState, useCallback, useEffect, useRef } from "react";
import { SessionExpiredDialog } from "../components/auth/session-expired-dialog";
import { SessionWarningDialog } from "../components/auth/session-warning-dialog";
import { setGlobalSessionExpiredHandler, setGlobalForbiddenErrorHandler } from "@truths/api";
import { SessionContext } from "./session-context";
import { SessionProviderProps } from "./session.types";
import { createSessionMonitor, getSessionMonitor, SessionMonitor } from "../services/session-monitor";
import { authService } from "../services/auth-service";
import { userPreferences, storage } from "@truths/utils";
import { toast } from "@truths/ui";

export function SessionProvider({ children }: SessionProviderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [timeUntilExpiration, setTimeUntilExpiration] = useState(0);
  const monitorRef = useRef<SessionMonitor | null>(null);

  const showSessionExpiredDialog = useCallback(() => {
    // Check if there was a previous login by checking for last_username
    // If no previous login, redirect to login page instead of showing dialog
    const lastUsername = storage.get<string>("last_username");
    if (!lastUsername) {
      // No previous login - redirect to login page
      // Use window.location.href for reliable redirect outside React Router context
      window.location.href = "/login";
      return;
    }
    // Previous login exists - show session expired dialog
    setIsDialogOpen(true);
  }, []);

  const hideSessionExpiredDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  // Register the global handlers with API client
  useEffect(() => {
    setGlobalSessionExpiredHandler(showSessionExpiredDialog);
    
    // Register handler for 403 Forbidden errors
    setGlobalForbiddenErrorHandler((message: string) => {
      toast({
        title: "Access Denied",
        description: message || "You don't have permission to perform this action.",
        variant: "destructive",
      });
    });
    
    return () => {
      setGlobalSessionExpiredHandler(null);
      setGlobalForbiddenErrorHandler(null);
    };
  }, [showSessionExpiredDialog]);

  // Initialize proactive session monitoring
  useEffect(() => {
    // Check authentication state periodically and start/stop monitor accordingly
    const checkAuthAndStartMonitor = () => {
      const isAuthenticated = authService.isAuthenticated();
      
      // If not authenticated and monitor is running, stop it
      if (!isAuthenticated) {
        if (monitorRef.current) {
          monitorRef.current.stop();
          monitorRef.current = null;
        }
        return;
      }

      // If authenticated but monitor not running, start it
      if (isAuthenticated && !monitorRef.current) {
        // Initialize user preferences from backend when authenticated
        userPreferences.initialize().catch(error => {
          console.warn('Failed to initialize user preferences:', error);
        });

        const monitor = createSessionMonitor(
          {
            warningThresholdSeconds: 300, // 5 minutes
            keepaliveIntervalSeconds: 600, // 10 minutes
            minActivityBeforeKeepaliveSeconds: 30, // 30 seconds
            checkIntervalSeconds: 30, // Check every 30 seconds
            enableKeepalive: true,
            enableVisibilityCheck: true,
          },
          {
            onWarning: (timeUntilExpirationMs) => {
              setTimeUntilExpiration(timeUntilExpirationMs);
              setIsWarningDialogOpen(true);
            },
            onExpired: () => {
              setIsWarningDialogOpen(false); // Close warning if open
              showSessionExpiredDialog();
            },
            onRefreshed: () => {
              // Close warning dialog when refreshed
              setIsWarningDialogOpen(false);
            },
          }
        );

        monitorRef.current = monitor;
        monitor.start();
      }
    };

    // Check immediately
    checkAuthAndStartMonitor();

    // Check periodically (every 5 seconds) for auth state changes
    // This handles cases where user logs in/out outside of this component
    const authCheckInterval = setInterval(checkAuthAndStartMonitor, 5000);

    // Cleanup on unmount
    return () => {
      if (monitorRef.current) {
        monitorRef.current.stop();
        monitorRef.current = null;
      }
      clearInterval(authCheckInterval);
    };
  }, [showSessionExpiredDialog]);

  // Handle refresh from warning dialog
  const handleRefreshSession = useCallback(async () => {
    const monitor = getSessionMonitor();
    if (monitor) {
      await monitor.refreshSession();
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{
        showSessionExpiredDialog,
        hideSessionExpiredDialog,
        isSessionDialogOpen: isDialogOpen,
      }}
    >
      {children}
      <SessionExpiredDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
      <SessionWarningDialog
        open={isWarningDialogOpen}
        onOpenChange={setIsWarningDialogOpen}
        timeUntilExpiration={timeUntilExpiration}
        onRefresh={handleRefreshSession}
      />
    </SessionContext.Provider>
  );
}

// Re-export for backward compatibility
// eslint-disable-next-line react-refresh/only-export-components
export { useSession } from "./use-session";
