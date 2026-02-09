import { useLocation, useNavigate } from "@tanstack/react-router";
import { EventTypeListContainer, EventTypeProvider } from "@truths/ticketing";
import { api } from "@truths/api";
import { useDensityStyles } from "@truths/utils";
import { cn } from "@truths/ui/lib/utils";

export function EventTypePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const density = useDensityStyles();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <EventTypeProvider
      config={{
        apiClient: api,
        endpoints: {
          eventTypes: "/api/v1/ticketing/event-types",
        },
      }}
    >
      <div className={cn("space-y-4", density.spacingFormSection)}>
        <EventTypeListContainer
          autoOpenCreate={autoOpenCreate}
          onCreateDialogClose={() =>
            navigate({ to: "/settings/ticketing/event-types", search: {}})
          }
        />
      </div>
    </EventTypeProvider>
  );
}

