/**
 * Global User Provider
 *
 * Provides UserService to the entire application
 * This allows components like CommandPalette to access user services
 */

import { UserProvider } from "@truths/account";
import { api } from "@truths/api";
import { API_CONFIG } from "@truths/config";
import { ReactNode, useMemo } from "react";

interface GlobalUserProviderProps {
  children: ReactNode;
}

export function GlobalUserProvider({ children }: GlobalUserProviderProps) {
  const userServiceConfig = useMemo(
    () => ({
      apiClient: api,
      endpoints: {
        users: API_CONFIG.ENDPOINTS.USERS.FETCH,
      },
    }),
    []
  );

  return <UserProvider config={userServiceConfig}>{children}</UserProvider>;
}
