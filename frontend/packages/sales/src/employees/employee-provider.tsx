/**
 * Employee Provider
 *
 * Provides configured EmployeeService to all child components
 * Makes the service available via useEmployeeService hook
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { EmployeeService, type EmployeeServiceConfig } from "./employee-service";

interface EmployeeContextValue {
  service: EmployeeService;
}

const EmployeeContext = createContext<EmployeeContextValue | null>(null);

export interface EmployeeProviderProps {
  children: ReactNode;
  config: EmployeeServiceConfig;
}

export function EmployeeProvider({
  children,
  config,
}: EmployeeProviderProps) {
  const service = useMemo(
    () => new EmployeeService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.employees]
  );

  const value = useMemo<EmployeeContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployeeService(): EmployeeService {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error(
      "useEmployeeService must be used within EmployeeProvider"
    );
  }
  return context.service;
}

