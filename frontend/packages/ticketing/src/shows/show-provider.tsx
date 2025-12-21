/**
 * Show Provider
 *
 * Provides configured ShowService to all child components
 * Makes the service available via useShowService hook
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ShowService, type ShowServiceConfig } from "./show-service";

interface ShowContextValue {
  service: ShowService;
}

const ShowContext = createContext<ShowContextValue | null>(null);

export interface ShowProviderProps {
  children: ReactNode;
  config: ShowServiceConfig;
}

export function ShowProvider({
  children,
  config,
}: ShowProviderProps) {
  const service = useMemo(
    () => new ShowService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.shows]
  );

  const value = useMemo<ShowContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <ShowContext.Provider value={value}>
      {children}
    </ShowContext.Provider>
  );
}

export function useShowService(): ShowService {
  const context = useContext(ShowContext);
  if (!context) {
    throw new Error(
      "useShowService must be used within ShowProvider"
    );
  }
  return context.service;
}

