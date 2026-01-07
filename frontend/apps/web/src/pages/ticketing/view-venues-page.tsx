import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import {
  VenueDetail,
  VenueProvider,
  VenueTypeProvider,
  LayoutProvider,
  useVenue,
  useVenueService,
  EditVenueDialog,
  useUpdateVenue,
  VenueProfilePhotoUpload,
} from "@truths/ticketing";
import { api } from "@truths/api";
import { AttachmentService } from "@truths/shared";
import { toast } from "@truths/ui";
import type { UpdateVenueInput } from "@truths/ticketing";

function VenueDetailContent({ id }: { id: string | undefined }) {
  const navigate = useNavigate();
  const service = useVenueService();
  const { data, isLoading, error } = useVenue(service, id ?? null);
  const updateMutation = useUpdateVenue(service);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const matchRoute = useMatchRoute();

  // Check if we're on the designer child route
  const isDesignerRoute = matchRoute({
    to: "/ticketing/venues/$id/seats/designer",
    params: { id },
  });

  useEffect(() => {
    if (!data || isDesignerRoute) return;
    const title = data.name || data.id;
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

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleUpdateVenue = async (venueId: string, input: UpdateVenueInput) => {
    try {
      await updateMutation.mutateAsync({ id: venueId, input });
      toast({
        title: "Success",
        description: "Venue updated successfully",
      });
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update venue",
        variant: "destructive",
      });
      throw error;
    }
  };

  // If we're on the designer route, render the outlet instead of VenueDetail
  if (isDesignerRoute) {
    return <Outlet />;
  }

  return (
    <>
      <VenueDetail
        data={data ?? undefined}
        loading={isLoading}
        error={error as Error | null}
        editable={true}
        onEdit={handleEdit}
        onNavigateToSeatDesigner={(venueId, layoutId) => {
          navigate({
            to: "/ticketing/venues/$id/seats/designer",
            params: { id: venueId },
            search: { layoutId },
          });
        }}
        profilePhotoComponent={
          data ? (
            <VenueProfilePhotoUpload
              venue={data}
              attachmentService={
                new AttachmentService({
                  apiClient: api,
                  endpoints: {
                    attachments: "/api/v1/shared/attachments",
                    entityAttachments: "/api/v1/shared/attachments/entity",
                    profilePhoto: "/api/v1/shared/attachments/entity",
                  },
                })
              }
            />
          ) : undefined
        }
      />
      {data && (
        <EditVenueDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleUpdateVenue}
          venue={data}
        />
      )}
    </>
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

  const layoutServiceConfig = {
    apiClient: api,
    endpoints: {
      layouts: "/api/v1/ticketing/layouts",
    },
  };

  return (
    <VenueProvider config={serviceConfig}>
      <VenueTypeProvider
        config={{
          apiClient: api,
          endpoints: {
            venueTypes: "/api/v1/ticketing/venue-types",
          },
        }}
      >
        <LayoutProvider config={layoutServiceConfig}>
          <VenueDetailContent id={id} />
        </LayoutProvider>
      </VenueTypeProvider>
    </VenueProvider>
  );
}
