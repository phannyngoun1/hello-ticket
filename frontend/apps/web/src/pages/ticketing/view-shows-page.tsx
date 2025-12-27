import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import {
  ShowDetail,
  ShowProvider,
  OrganizerProvider,
  EventProvider,
  VenueProvider,
  LayoutProvider,
  useShow,
  useShowService,
} from "@truths/ticketing";
import { api } from "@truths/api";

function ShowDetailContent({ id }: { id: string | undefined }) {
  const service = useShowService();
  const {
    data,
    isLoading,
    error,
  } = useShow(service, id ?? null);

  useEffect(() => {
    if (!data) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/ticketing/shows/${id}`,
          title,
          iconName: "Users",
        },
      })
    );
  }, [id, data]);

  return (
    <ShowDetail
      data={data ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
    />
  );
}

export function ViewShowPage() {
  const { id } = useParams({ from: "/ticketing/shows/$id" });

  const serviceConfig = {
    apiClient: api,
    endpoints: {
      shows: "/api/v1/ticketing/shows",
    },
  };

  return (
    <ShowProvider config={serviceConfig}>
      <OrganizerProvider
        config={{
          apiClient: api,
          endpoints: {
            organizers: "/api/v1/ticketing/organizers",
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
          <VenueProvider
            config={{
              apiClient: api,
              endpoints: {
                venues: "/api/v1/ticketing/venues",
              },
            }}
          >
            <LayoutProvider
              config={{
                apiClient: api,
                endpoints: {
                  layouts: "/api/v1/ticketing/layouts",
                },
              }}
            >
              <ShowDetailContent id={id} />
            </LayoutProvider>
          </VenueProvider>
        </EventProvider>
      </OrganizerProvider>
    </ShowProvider>
  );
}

