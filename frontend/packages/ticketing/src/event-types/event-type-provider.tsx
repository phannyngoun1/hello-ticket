/**
 * EventType Provider
 *
 * React Context provider for EventTypeService
 * Makes service available to all child components
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {EventTypeService, type EventTypeServiceConfig } from "./event-type-service";

interface EventTypeContextValue {
  service: EventTypeService;
}

const EventTypeContext = createContext<EventTypeContextValue | null>(null);

export interface EventTypeProviderProps {
  config: EventTypeServiceConfig;
  children: ReactNode;
}

export function EventTypeProvider({ children, config }: EventTypeProviderProps) {
  const service = useMemo(
    () => new EventTypeService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.["eventTypes"]]
  );

  const value = useMemo<EventTypeContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <EventTypeContext.Provider value={value}>
      {children}
    </EventTypeContext.Provider>
  );
}

export function useEventTypeService(): EventTypeService {
  const context = useContext(EventTypeContext);
  if (!context) {
    throw new Error(
      "useEventTypeService must be used within EventTypeProvider"
    );
  }
  return context.service;
}
