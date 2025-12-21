/**
 * Booking Provider
 *
 * Provides configured BookingService to all child components
 * Makes the service available via useBookingService hook
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { BookingService, type BookingServiceConfig } from "./booking-service";

interface BookingContextValue {
  service: BookingService;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export interface BookingProviderProps {
  children: ReactNode;
  config: BookingServiceConfig;
}

export function BookingProvider({
  children,
  config,
}: BookingProviderProps) {
  const service = useMemo(
    () => new BookingService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.bookings]
  );

  const value = useMemo<BookingContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingService(): BookingService {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error(
      "useBookingService must be used within BookingProvider"
    );
  }
  return context.service;
}

