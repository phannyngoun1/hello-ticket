/**
 * Venue Provider
 *
 * Provides configured VenueService to all child components
 * Makes the service available via useVenueService hook
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { VenueService, type VenueServiceConfig } from "./venue-service";

interface VenueContextValue {
  service: VenueService;
}

const VenueContext = createContext<VenueContextValue | null>(null);

export interface VenueProviderProps {
  children: ReactNode;
  config: VenueServiceConfig;
}

export function VenueProvider({
  children,
  config,
}: VenueProviderProps) {
  const service = useMemo(
    () => new VenueService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.venues]
  );

  const value = useMemo<VenueContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenueService(): VenueService {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error(
      "useVenueService must be used within VenueProvider"
    );
  }
  return context.service;
}

