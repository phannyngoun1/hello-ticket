import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import {
  OrganizerDetail,
  OrganizerProvider,
  useOrganizer,
  useOrganizerService,
} from "@truths/ticketing";
import { api } from "@truths/api";

function OrganizerDetailContent({ id }: { id: string | undefined }) {
  const service = useOrganizerService();
  const {
    data,
    isLoading,
    error,
  } = useOrganizer(service, id ?? null);

  useEffect(() => {
    if (!data) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/ticketing/organizers/${id}`,
          title,
          iconName: "Users",
        },
      })
    );
  }, [id, data]);

  return (
    <OrganizerDetail
      data={data ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
    />
  );
}

export function ViewOrganizerPage() {
  const { id } = useParams({ from: "/ticketing/organizers/$id" });

  const serviceConfig = {
    apiClient: api,
    endpoints: {
      organizers: "/api/v1/ticketing/organizers",
    },
  };

  return (
    <OrganizerProvider config={serviceConfig}>
      <OrganizerDetailContent id={id} />
    </OrganizerProvider>
  );
}

