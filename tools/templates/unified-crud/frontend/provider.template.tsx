/**
 * {{EntityName}} Provider
 *
 * Provides configured {{EntityName}}Service to all child components
 * Makes the service available via use{{EntityName}}Service hook
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { {{EntityName}}Service, type {{EntityName}}ServiceConfig } from "./{{EntityNameLower}}-service";

interface {{EntityName}}ContextValue {
  service: {{EntityName}}Service;
}

const {{EntityName}}Context = createContext<{{EntityName}}ContextValue | null>(null);

export interface {{EntityName}}ProviderProps {
  children: ReactNode;
  config: {{EntityName}}ServiceConfig;
}

export function {{EntityName}}Provider({
  children,
  config,
}: {{EntityName}}ProviderProps) {
  const service = useMemo(
    () => new {{EntityName}}Service(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.{{entityPlural}}]
  );

  const value = useMemo<{{EntityName}}ContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <{{EntityName}}Context.Provider value={value}>
      {children}
    </{{EntityName}}Context.Provider>
  );
}

export function use{{EntityName}}Service(): {{EntityName}}Service {
  const context = useContext({{EntityName}}Context);
  if (!context) {
    throw new Error(
      "use{{EntityName}}Service must be used within {{EntityName}}Provider"
    );
  }
  return context.service;
}

