/**
 * {{EntityName}} Provider
 *
 * React Context provider for {{EntityName}}Service
 * Makes service available to all child components
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { {{EntityName}}Service, type {{EntityName}}ServiceConfig } from "./{{entity-name}}-service";

interface {{EntityName}}ContextValue {
  service: {{EntityName}}Service;
}

const {{EntityName}}Context = createContext<{{EntityName}}ContextValue | null>(null);

export interface {{EntityName}}ProviderProps {
  config: {{EntityName}}ServiceConfig;
  children: ReactNode;
}

export function {{EntityName}}Provider({ children, config }: {{EntityName}}ProviderProps) {
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
