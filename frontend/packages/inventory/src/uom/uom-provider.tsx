/**
 * UoM Provider
 *
 * React Context provider for UoMService
 * Makes service available to all child components
 *
 * @author Phanny
 */

import { createContext, useContext, useMemo } from "react";
import { api } from "@truths/api";
import { UoMService, type UoMServiceConfig } from "./uom-service";

const UoMServiceContext = createContext<UoMService | null>(null);

export interface UoMProviderProps {
  config?: UoMServiceConfig;
  children: React.ReactNode;
}

export function UoMProvider({
  config,
  children,
}: UoMProviderProps) {
  const service = useMemo(() => {
    if (config) {
      return new UoMService(config);
    }
    // Default configuration
    return new UoMService({
      apiClient: api,
      endpoints: {
        uom: "/api/v1/inventory/units-of-measure",
      },
    });
  }, [config]);

  return (
    <UoMServiceContext.Provider value={service}>
      {children}
    </UoMServiceContext.Provider>
  );
}

export function useUoMService(): UoMService {
  const service = useContext(UoMServiceContext);
  if (!service) {
    throw new Error(
      "useUoMService must be used within UoMProvider"
    );
  }
  return service;
}

