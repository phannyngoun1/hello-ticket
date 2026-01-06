import React, { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { toast } from "@truths/ui";
import {
  OrganizerDetail,
  OrganizerProvider,
  useOrganizer,
  useOrganizerService,
  EditOrganizerDialog,
  OrganizerTagsDialog,
  OrganizerAttachmentsDialog,
  OrganizerProfilePhotoUpload,
  useUpdateOrganizer,
} from "@truths/ticketing";
import { api } from "@truths/api";
import { TagService, AttachmentService, FileUpload } from "@truths/shared";
import { useQuery } from "@tanstack/react-query";

function OrganizerDetailContent({ id }: { id: string | undefined }) {
  const service = useOrganizerService();
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useOrganizer(service, id ?? null);

  // Debug: log the raw organizer data
  React.useEffect(() => {
    console.log("DEBUG: Raw organizer data from API:", data);
    if (data?.tags) {
      console.log("DEBUG: Organizer has tags:", data.tags);
    } else {
      console.log("DEBUG: Organizer has no tags or tags is undefined");
    }
  }, [data]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [organizerToEdit, setOrganizerToEdit] = useState<any>(null);
  
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<FileUpload | null>(null);

  const updateMutation = useUpdateOrganizer(service);

  const tagService = new TagService({
    apiClient: api,
    endpoints: {
      tags: "/api/v1/shared/tags",
    },
  });
  
  const attachmentService = new AttachmentService({ 
    apiClient: api, 
    endpoints: {
      attachments: "/api/v1/shared/attachments",
      entityAttachments: "/api/v1/shared/attachments/entity",
      profilePhoto: "/api/v1/shared/attachments/entity",
    },
  });

  // Load profile photo
  const { data: profilePhotoData, refetch: refetchProfilePhoto } = useQuery({
    queryKey: ["profilePhoto", id, "organizer"],
    queryFn: () =>
      id
        ? attachmentService.getProfilePhoto("organizer", id)
        : null,
    enabled: !!id,
  });

  useEffect(() => {
    setProfilePhoto(profilePhotoData || null);
  }, [profilePhotoData]);

  // Load documents
  const { data: documents, isLoading: loadingDocuments, refetch: refetchDocuments } = useQuery({
    queryKey: ["organizer-documents", id],
    queryFn: () => 
      id 
        ? attachmentService.getAttachmentsForEntity("organizer", id, "document").then(res => res.items)
        : Promise.resolve([]),
    enabled: !!id,
  });

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


  const handleManageTags = (_organizer: any) => {
    setTagsDialogOpen(true);
  };

  const handleTagsSave = async (tags: string[]) => {
    if (!data) return;
    try {
      console.log("Saving tags for organizer", data.id, ":", tags);
      await tagService.manageEntityTags("organizer", data.id, tags);
      console.log("Tags saved, refetching...");
      await refetch();
      console.log("Refetch complete, new data tags:", data?.tags);
      toast({
        title: "Success",
        description: "Tags updated successfully",
      });
      setTagsDialogOpen(false);
    } catch (err) {
      console.error("Failed to save tags:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update tags",
        variant: "destructive",
      });
    }
  };

  const handleManageAttachments = (_organizer: any) => {
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
          if (!open) {
            setOrganizerToEdit(null);
          }
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

