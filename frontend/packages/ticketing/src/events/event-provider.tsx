/**
 * Event Provider
 *
 * Provides configured EventService to all child components
 * Makes the service available via useEventService hook
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { EventService, type EventServiceConfig } from "./event-service";

interface EventContextValue {
  service: EventService;
}

const EventContext = createContext<EventContextValue | null>(null);

export interface EventProviderProps {
  children: ReactNode;
  config: EventServiceConfig;
}

export function EventProvider({
  children,
  config,
}: EventProviderProps) {
  const service = useMemo(
    () => new EventService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.events]
  );

  const value = useMemo<EventContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventService(): EventService {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error(
      "useEventService must be used within EventProvider"
    );
  }
  return context.service;
}

