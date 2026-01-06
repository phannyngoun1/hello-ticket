import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { toast } from "@truths/ui";
import {
  OrganizerDetail,
  OrganizerProvider,
  useOrganizer,
  useOrganizerService,
  EditOrganizerDialog,
  useUpdateOrganizer,
} from "@truths/ticketing";
import { api } from "@truths/api";

function OrganizerDetailContent({ id }: { id: string | undefined }) {
  const service = useOrganizerService();
  const {
    data,
    isLoading,
    error,
  } = useOrganizer(service, id ?? null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [organizerToEdit, setOrganizerToEdit] = useState<any>(null);

  const updateMutation = useUpdateOrganizer(service);

  const handleEdit = (organizer: any) => {
    setOrganizerToEdit(organizer);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (organizerId: string, input: any) => {
    try {
      await updateMutation.mutateAsync({ id: organizerId, input });
      toast({ title: "Success", description: "Organizer updated successfully" });
      setEditDialogOpen(false);
      setOrganizerToEdit(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update organizer",
        variant: "destructive",
      });
      throw err;
    }
  };

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
    <>
      <OrganizerDetail
        data={data ?? undefined}
        loading={isLoading}
        error={error as Error | null}
        editable={true}
        onEdit={handleEdit}
      />

      <EditOrganizerDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setOrganizerToEdit(null);
          }
        }}
        onSubmit={handleEditSubmit}
        organizer={organizerToEdit}
      />
    </>
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

