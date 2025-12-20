import { useEffect } from "react";
import {
  useParams,
  useNavigate,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import {
  VenueDetail,
  VenueProvider,
  useVenue,
  useVenueService,
} from "@truths/ticketing";
import { api } from "@truths/api";

function VenueDetailContent({ id }: { id: string | undefined }) {
  const navigate = useNavigate();
  const service = useVenueService();
  const { data, isLoading, error } = useVenue(service, id ?? null);
  const matchRoute = useMatchRoute();

  // Check if we're on the designer child route
  const isDesignerRoute = matchRoute({
    to: "/ticketing/venues/$id/seats/designer",
    params: { id },
  });

  useEffect(() => {
    if (!data || isDesignerRoute) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/ticketing/venues/${id}`,
          title,
          iconName: "Users",
        },
      })
    );
  }, [id, data, isDesignerRoute]);

  // If we're on the designer route, render the outlet instead of VenueDetail
  if (isDesignerRoute) {
    return <Outlet />;
  }

  return (
    <VenueDetail
      data={data ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
      onNavigateToSeatDesigner={(venueId) => {
        navigate({
          to: "/ticketing/venues/$id/seats/designer",
          params: { id: venueId },
        });
      }}
    />
  );
}

export function ViewVenuePage() {
  const { id } = useParams({ from: "/ticketing/venues/$id" });

  const serviceConfig = {
    apiClient: api,
    endpoints: {
      venues: "/api/v1/ticketing/venues",
    },
  };

  return (
    <VenueProvider config={serviceConfig}>
      <VenueDetailContent id={id} />
    </VenueProvider>
  );
}
