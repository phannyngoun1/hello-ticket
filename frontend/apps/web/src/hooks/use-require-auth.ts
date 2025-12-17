import { useEffect } from "react";
import { useSession } from "../providers/session-provider";
import { authService } from "../services/auth-service";

/**
 * Hook that checks authentication on mount and shows login dialog if not authenticated.
 * Use this in pages that need authentication.
 */
export function useRequireAuth() {
    const { showSessionExpiredDialog } = useSession();

    useEffect(() => {
        // Check if user has valid token
        const isAuthenticated = authService.isAuthenticated();

        if (!isAuthenticated) {
            // No token found, show login dialog
            showSessionExpiredDialog();
        }
    }, [showSessionExpiredDialog]);
}

