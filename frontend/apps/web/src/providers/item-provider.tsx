/**
 * Global Item Provider
 *
 * Exposes ItemService to the entire application so shared components
 * like the command palette can access inventory APIs.
 */

import { ReactNode, useMemo } from "react";
import { ItemProvider } from "@truths/inventory";
import { api } from "@truths/api";

interface GlobalItemProviderProps {
  children: ReactNode;
}

export function GlobalItemProvider({ children }: GlobalItemProviderProps) {
  const itemServiceConfig = useMemo(
    () => ({
      apiClient: api,
      endpoints: {
        items: "/api/v1/inventory/items",
      },
    }),
    []
  );

  return <ItemProvider config={itemServiceConfig}>{children}</ItemProvider>;
}


