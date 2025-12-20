import { useLocation, useNavigate } from "@tanstack/react-router";
import { EventTypeListContainer, EventTypeProvider } from "@truths/ticketing";
import { api } from "@truths/api";

export function EventTypePage() {
  const navigate = useNavigate();
  const location = useLocation();
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
      <div className="space-y-4">
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

