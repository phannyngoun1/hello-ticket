/**
 * VenueType Provider
 *
 * React Context provider for VenueTypeService
 * Makes service available to all child components
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {VenueTypeService, type VenueTypeServiceConfig } from "./venue-type-service";

interface VenueTypeContextValue {
  service: VenueTypeService;
}

export const VenueTypeContext = createContext<VenueTypeContextValue | null>(null);

export interface VenueTypeProviderProps {
  config: VenueTypeServiceConfig;
  children: ReactNode;
}

export function VenueTypeProvider({ children, config }: VenueTypeProviderProps) {
  const service = useMemo(
    () => new VenueTypeService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.["venueTypes"]]
  );

  const value = useMemo<VenueTypeContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <VenueTypeContext.Provider value={value}>
      {children}
    </VenueTypeContext.Provider>
  );
}

export function useVenueTypeService(): VenueTypeService {
  const context = useContext(VenueTypeContext);
  if (!context) {
    throw new Error(
      "useVenueTypeService must be used within VenueTypeProvider"
    );
  }
  return context.service;
}
