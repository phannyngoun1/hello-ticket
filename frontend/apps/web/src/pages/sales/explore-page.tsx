/**
 * Sales Explore Page
 * 
 * Browse and book available and upcoming shows with their events
 */

import { api } from "@truths/api";
import { 
  EventProvider, 
  ShowProvider,
} from "@truths/ticketing";
import { ExploreList } from "@truths/sales";

// Wrapper component with providers
export function ExplorePageWithProvider() {
  return (
    <ShowProvider
      config={{
        apiClient: api,
        endpoints: {
          shows: "/api/v1/ticketing/shows",
        },
      }}
    >
      <EventProvider
        config={{
          apiClient: api,
          endpoints: {
            events: "/api/v1/ticketing/events",
          },
        }}
      >
        <ExploreList />
      </EventProvider>
    </ShowProvider>
  );
}
