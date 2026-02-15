import {
  useParams,
  useNavigate,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import { ViewVenuePage as ViewVenuePageComponent } from "@truths/ticketing";
import { useRequireAuth } from "../../hooks/use-require-auth";
import { api } from "@truths/api";

export function ViewVenuePage() {
  useRequireAuth();

  const { id } = useParams({ from: "/ticketing/venues/$id" });
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();

  const isDesignerRoute = id
    ? matchRoute({
        to: "/ticketing/venues/$id/seats/designer",
        params: { id },
      })
    : false;

  if (!id) {
    return <div className="p-4">Invalid venue ID</div>;
  }

  const config = {
    venue: {
      apiClient: api,
      endpoints: { venues: "/api/v1/ticketing/venues" },
    },
    venueType: {
      apiClient: api,
      endpoints: { venueTypes: "/api/v1/ticketing/venue-types" },
    },
    layout: {
      apiClient: api,
      endpoints: { layouts: "/api/v1/ticketing/layouts" },
    },
    attachment: {
      apiClient: api,
      endpoints: {
        attachments: "/api/v1/shared/attachments",
        entityAttachments: "/api/v1/shared/attachments/entity",
        profilePhoto: "/api/v1/shared/attachments/entity",
      },
    },
  };

  return (
    <ViewVenuePageComponent
      venueId={id}
      config={config}
      onNavigateToSeatDesigner={(venueId, layoutId) => {
        navigate({
          to: "/ticketing/venues/$id/seats/designer",
          params: { id: venueId },
          search: { layoutId },
        });
      }}
    >
      {isDesignerRoute ? <Outlet /> : undefined}
    </ViewVenuePageComponent>
  );
}
