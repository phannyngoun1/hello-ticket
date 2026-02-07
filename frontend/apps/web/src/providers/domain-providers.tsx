import { ReactNode } from "react";
import { GlobalUserProvider } from "./user-provider";
import { GlobalCustomerProvider } from "./customer-provider";
import {
  EmployeeProvider,
  BookingProvider,
} from "@truths/sales";
import {
  VenueProvider,
  ShowProvider,
  OrganizerProvider,
} from "@truths/ticketing";
import { api } from "@truths/api";

interface DomainProvidersProps {
  children: ReactNode;
}

export function DomainProviders({ children }: DomainProvidersProps) {
  return (
    <GlobalUserProvider>
      <GlobalCustomerProvider>
        <EmployeeProvider
          config={{
            apiClient: api,
            endpoints: { employees: "/api/v1/sales/employees" },
          }}
        >
          <BookingProvider
            config={{
              apiClient: api,
              endpoints: { bookings: "/api/v1/sales/bookings" },
            }}
          >
            <VenueProvider
              config={{
                apiClient: api,
                endpoints: { venues: "/api/v1/ticketing/venues" },
              }}
            >
              <ShowProvider
                config={{
                  apiClient: api,
                  endpoints: { shows: "/api/v1/ticketing/shows" },
                }}
              >
                <OrganizerProvider
                  config={{
                    apiClient: api,
                    endpoints: { organizers: "/api/v1/ticketing/organizers" },
                  }}
                >
                  {children}
                </OrganizerProvider>
              </ShowProvider>
            </VenueProvider>
          </BookingProvider>
        </EmployeeProvider>
      </GlobalCustomerProvider>
    </GlobalUserProvider>
  );
}
