/**
 * Organizer Provider
 *
 * Provides configured OrganizerService to all child components
 * Makes the service available via useOrganizerService hook
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { OrganizerService, type OrganizerServiceConfig } from "./organizer-service";

interface OrganizerContextValue {
  service: OrganizerService;
}

const OrganizerContext = createContext<OrganizerContextValue | null>(null);

export interface OrganizerProviderProps {
  children: ReactNode;
  config: OrganizerServiceConfig;
}

export function OrganizerProvider({
  children,
  config,
}: OrganizerProviderProps) {
  const service = useMemo(
    () => new OrganizerService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.organizers]
  );

  const value = useMemo<OrganizerContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <OrganizerContext.Provider value={value}>
      {children}
    </OrganizerContext.Provider>
  );
}

export function useOrganizerService(): OrganizerService {
  const context = useContext(OrganizerContext);
  if (!context) {
    throw new Error(
      "useOrganizerService must be used within OrganizerProvider"
    );
  }
  return context.service;
}

