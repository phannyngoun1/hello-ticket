import { useLocation, useNavigate } from "@tanstack/react-router";
import { VenueTypeListContainer, VenueTypeProvider } from "@truths/ticketing";
import { api } from "@truths/api";
import { useDensityStyles } from "@truths/utils";
import { cn } from "@truths/ui/lib/utils";

export function VenueTypePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const density = useDensityStyles();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <VenueTypeProvider
      config={{
        apiClient: api,
        endpoints: {
          venueTypes: "/api/v1/ticketing/venue-types",
        },
      }}
    >
      <div className={cn("space-y-4", density.spacingFormSection)}>
        <VenueTypeListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/settings/ticketing/venue-types", search: {}})
          }
        />
      </div>
    </VenueTypeProvider>
  );
}

