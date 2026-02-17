/**
 * View Organizer Page Component
 *
 * Full-featured page for viewing a single organizer.
 * Handles data fetching, edit dialog, tags, attachments, profile photo, and tab title updates.
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@truths/ui";
import { OrganizerDetail } from "./organizer-detail";
import { OrganizerProvider, useOrganizerService } from "./organizer-provider";
import { useOrganizer, useUpdateOrganizer } from "./use-organizers";
import { EditOrganizerDialog } from "./edit-organizer-dialog";
import { OrganizerTagsDialog } from "./organizer-tags-dialog";
import { OrganizerAttachmentsDialog } from "./organizer-attachments-dialog";
import { OrganizerProfilePhotoUpload } from "./organizer-profile-photo-upload";
import { TagService, AttachmentService, type FileUpload } from "@truths/shared";
import type { Organizer } from "./types";
import type { OrganizerServiceConfig } from "./organizer-service";
import type { AttachmentServiceConfig } from "@truths/shared";
import type { ServiceConfig } from "@truths/shared";

export interface ViewOrganizerPageConfig {
  organizer: OrganizerServiceConfig;
  tag: ServiceConfig<{ tags: string }>;
  attachment: AttachmentServiceConfig;
}

export interface ViewOrganizerPageProps {
  organizerId: string;
  config: ViewOrganizerPageConfig;
}

function OrganizerDetailContent({
  organizerId,
  tagService,
  attachmentService,
}: {
  organizerId: string;
  tagService: TagService;
  attachmentService: AttachmentService;
}) {
  const service = useOrganizerService();
  const { data, isLoading, error, refetch } = useOrganizer(
    service,
    organizerId ?? null,
  );

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [organizerToEdit, setOrganizerToEdit] = useState<Organizer | null>(null);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<FileUpload | null>(null);

  const updateMutation = useUpdateOrganizer(service);

  const { data: profilePhotoData, refetch: refetchProfilePhoto } = useQuery({
    queryKey: ["profilePhoto", "organizer", organizerId],
    queryFn: () =>
      organizerId
        ? attachmentService.getProfilePhoto("organizer", organizerId)
        : null,
    enabled: !!organizerId,
    staleTime: 5 * 60 * 1000, // 5 min - matches EntityProfilePhoto, deduplicates
  });

  useEffect(() => {
    setProfilePhoto(profilePhotoData || null);
  }, [profilePhotoData]);

  const { refetch: refetchDocuments } = useQuery({
    queryKey: ["organizer-documents", organizerId],
    queryFn: () =>
      organizerId
        ? attachmentService
            .getAttachmentsForEntity("organizer", organizerId, "document")
            .then((res) => res.items)
        : Promise.resolve([]),
    enabled: !!organizerId,
  });

  const handleEdit = (organizer: Organizer | undefined) => {
    setOrganizerToEdit(organizer ?? null);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (
    id: string,
    input: import("./types").UpdateOrganizerInput,
  ) => {
    try {
      await updateMutation.mutateAsync({ id, input });
      toast({
        title: "Success",
        description: "Organizer updated successfully",
      });
      setEditDialogOpen(false);
      setOrganizerToEdit(null);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update organizer",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleManageTags = () => {
    setTagsDialogOpen(true);
  };

  const handleTagsSave = async (tags: string[]) => {
    if (!data) return;
    try {
      await tagService.manageEntityTags("organizer", data.id, tags);
      await refetch();
      toast({
        title: "Success",
        description: "Tags updated successfully",
      });
      setTagsDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update tags",
        variant: "destructive",
      });
    }
  };

  const handleManageAttachments = () => {
    setAttachmentsDialogOpen(true);
  };

  const handleAttachmentsSave = async (_attachments: FileUpload[]) => {
    await refetchDocuments();
    toast({
      title: "Success",
      description: "Attachments updated successfully",
    });
  };

  const handleProfilePhotoChange = async (photo: FileUpload | null) => {
    setProfilePhoto(photo);
    await refetchProfilePhoto();
  };

  useEffect(() => {
    if (!data) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/ticketing/organizers/${organizerId}`,
          title,
        },
      }),
    );
  }, [organizerId, data]);

  return (
    <>
      <OrganizerDetail
        data={data ?? undefined}
        loading={isLoading}
        error={error as Error | null}
        editable={true}
        onEdit={handleEdit}
        onManageTags={handleManageTags}
        onManageAttachments={handleManageAttachments}
        attachmentService={attachmentService}
        profilePhotoComponent={
          data ? (
            <OrganizerProfilePhotoUpload
              organizer={data}
              attachmentService={attachmentService}
              currentPhoto={profilePhoto}
              onPhotoChange={handleProfilePhotoChange}
            />
          ) : undefined
        }
      />

      <EditOrganizerDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setOrganizerToEdit(null);
        }}
        onSubmit={handleEditSubmit}
        organizer={organizerToEdit}
      />

      {data && (
        <>
          <OrganizerTagsDialog
            open={tagsDialogOpen}
            onOpenChange={setTagsDialogOpen}
            organizer={data}
            tagService={tagService}
            onSave={handleTagsSave}
          />

          <OrganizerAttachmentsDialog
            open={attachmentsDialogOpen}
            onOpenChange={setAttachmentsDialogOpen}
            organizer={data}
            attachmentService={attachmentService}
            onSave={handleAttachmentsSave}
          />
        </>
      )}
    </>
  );
}

export function ViewOrganizerPage({
  organizerId,
  config,
}: ViewOrganizerPageProps) {
  const tagService = useMemo(
    () => new TagService(config.tag),
    [config.tag],
  );
  const attachmentService = useMemo(
    () => new AttachmentService(config.attachment),
    [config.attachment],
  );

  return (
    <OrganizerProvider config={config.organizer}>
      <OrganizerDetailContent
        organizerId={organizerId}
        tagService={tagService}
        attachmentService={attachmentService}
      />
    </OrganizerProvider>
  );
}
