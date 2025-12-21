/**
 * Layout Provider
 *
 * Provides LayoutService instance to child components via React Context
 */

import React, { createContext, useContext, useMemo } from "react";
import { LayoutService, LayoutServiceConfig } from "./layout-service";
import { api } from "@truths/api";

// Export LayoutService type for use in props
export type { LayoutService };

interface LayoutProviderProps {
  children: React.ReactNode;
  config?: Partial<LayoutServiceConfig>;
}

const LayoutServiceContext = createContext<LayoutService | null>(null);

export function LayoutProvider({ children, config }: LayoutProviderProps) {
  const service = useMemo(() => {
    const defaultConfig: LayoutServiceConfig = {
      apiClient: api,
      endpoints: {
        layouts: "/api/v1/ticketing/layouts",
      },
    };

    const mergedConfig = { ...defaultConfig, ...config };
    return new LayoutService(mergedConfig);
  }, [config]);

  return (
    <LayoutServiceContext.Provider value={service}>
      {children}
    </LayoutServiceContext.Provider>
  );
}

export function useLayoutService(): LayoutService {
  const service = useContext(LayoutServiceContext);
  if (!service) {
    throw new Error("useLayoutService must be used within LayoutProvider");
  }
  return service;
}
