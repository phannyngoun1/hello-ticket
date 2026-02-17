/**
 * View Venue Page Component
 *
 * Full-featured page for viewing a single venue.
 * Handles data fetching, providers, edit dialog, profile photo, and tab title updates.
 * Supports nested routes via children (e.g. Outlet for seat designer).
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { VenueDetail } from "./venue-detail";
import { VenueProvider, useVenueService } from "./venue-provider";
import { useVenue, useUpdateVenue } from "./use-venues";
import { EditVenueDialog } from "./edit-venue-dialog";
import { VenueProfilePhotoUpload } from "./venue-profile-photo-upload";
import { VenueTypeProvider } from "../venue-types/venue-type-provider";
import { LayoutProvider } from "../layouts/layout-provider";
import { AttachmentService } from "@truths/shared";
import { toast } from "@truths/ui";
import type { UpdateVenueInput } from "./types";
import type { VenueServiceConfig } from "./venue-service";
import type { VenueTypeServiceConfig } from "../venue-types/venue-type-service";
import type { LayoutServiceConfig } from "../layouts/layout-service";
import type { AttachmentServiceConfig } from "@truths/shared";

export interface ViewVenuePageConfig {
  venue: VenueServiceConfig;
  venueType: VenueTypeServiceConfig;
  layout: LayoutServiceConfig;
  attachment: AttachmentServiceConfig;
}

export interface ViewVenuePageProps {
  venueId: string;
  config: ViewVenuePageConfig;
  /** When on designer route, pass Outlet as children. Otherwise omit. */
  children?: ReactNode;
  /** Callback for seat designer navigation. Pass from useNavigate. */
  onNavigateToSeatDesigner?: (venueId: string, layoutId: string) => void;
}

function VenueDetailContent({
  venueId,
  attachmentService,
  onNavigateToSeatDesigner,
}: {
  venueId: string;
  attachmentService: AttachmentService;
  onNavigateToSeatDesigner?: (venueId: string, layoutId: string) => void;
}) {
  const service = useVenueService();
  const { data, isLoading, error, refetch, isFetching } = useVenue(
    service,
    venueId ?? null
  );
  const updateMutation = useUpdateVenue(service);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!data) return;
    const title = data.name || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/ticketing/venues/${venueId}`,
          title,
        },
      }),
    );
  }, [venueId, data]);

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleUpdateVenue = async (
    id: string,
    input: UpdateVenueInput,
  ) => {
    try {
      await updateMutation.mutateAsync({ id, input });
      toast({
        title: "Success",
        description: "Venue updated successfully",
      });
      setEditDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update venue",
        variant: "destructive",
      });
      throw err;
    }
  };

  return (
    <>
      <VenueDetail
        data={data ?? undefined}
        loading={isLoading}
        error={error as Error | null}
        editable={true}
        onEdit={handleEdit}
        onNavigateToSeatDesigner={onNavigateToSeatDesigner}
        onRefresh={() => refetch()}
        isRefetching={isFetching}
        profilePhotoComponent={
          data ? (
            <VenueProfilePhotoUpload
              venue={data}
              attachmentService={attachmentService}
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

export function ViewVenuePage({
  venueId,
  config,
  children,
  onNavigateToSeatDesigner,
}: ViewVenuePageProps) {
  const attachmentService = useMemo(
    () => new AttachmentService(config.attachment),
    [config.attachment],
  );

  // When children provided (e.g. Outlet for designer route), render them
  if (children) {
    return (
      <VenueProvider config={config.venue}>
        <VenueTypeProvider config={config.venueType}>
          <LayoutProvider config={config.layout}>
            {children}
          </LayoutProvider>
        </VenueTypeProvider>
      </VenueProvider>
    );
  }

  return (
    <VenueProvider config={config.venue}>
      <VenueTypeProvider config={config.venueType}>
        <LayoutProvider config={config.layout}>
          <VenueDetailContent
            venueId={venueId}
            attachmentService={attachmentService}
            onNavigateToSeatDesigner={onNavigateToSeatDesigner}
          />
        </LayoutProvider>
      </VenueTypeProvider>
    </VenueProvider>
  );
}
