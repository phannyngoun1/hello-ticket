import { useEffect, useState, useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import {
  EmployeeDetail,
  EmployeeProvider,
  useEmployee,
  useEmployeeService,
  EditEmployeeDialog,
  useUpdateEmployee,
  EmployeeTagsDialog,
  EmployeeAttachmentsDialog,
  EmployeeProfilePhotoUpload,
} from "@truths/sales";
import type { UpdateEmployeeInput } from "@truths/sales";
import { api } from "@truths/api";
import { TagService, AttachmentService } from "@truths/shared";

function EmployeeDetailContent({ id }: { id: string | undefined }) {
  const service = useEmployeeService();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  
  const updateMutation = useUpdateEmployee(service);
  const { data, isLoading, error, refetch } = useEmployee(service, id ?? null);

  // Initialize services
  const tagService = useMemo(
    () =>
      new TagService({
        apiClient: api,
        endpoints: {
          tags: "/api/v1/shared/tags",
          entityTags: "/api/v1/shared/tags/entity",
        },
      }),
    []
  );

  const attachmentService = useMemo(
    () =>
      new AttachmentService({
        apiClient: api,
        endpoints: {
          attachments: "/api/v1/shared/attachments",
          entityAttachments: "/api/v1/shared/attachments/entity",
          profilePhoto: "/api/v1/shared/attachments/entity",
        },
      }),
    []
  );

  useEffect(() => {
    if (!data) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/sales/employees/${id}`,
          title,
          iconName: "Users",
        },
      })
    );
  }, [id, data]);

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (
    employeeId: string,
    input: UpdateEmployeeInput
  ) => {
    try {
      await updateMutation.mutateAsync({ id: employeeId, input });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const handleSaveTags = async () => {
    if (data) {
      // Optimistic update or refetch
      await refetch();
      setTagsDialogOpen(false);
    }
  };

  const handleSaveAttachments = async () => {
      // Just refetch to get updated list in detail view if needed, 
      // but usually the dialog handles uploads itself and we just close it
      // The local document list in EmployeeDetail will fetch on its own when tab is active
      setAttachmentsDialogOpen(false);
  };

  const handlePhotoChange = () => {
    // Determine if we need to update local state or just refetch
     // Ideally we update the data.user.profile_photo_url if that structure exists, 
     // but 'Employee' type might not have photo URL field explicitly in 'data'. 
     // Employee might have a linked user or we just added photo ability. 
     // If the Employee model doesn't have a photo URL field, we rely on the component dealing with it?
     // Actually EmployeeDetail doesn't show photo unless we pass it or it's in data. 
     // We are passing `profilePhotoComponent` which manages its own preview state. 
     // But we should probably refetch to ensure consistency if other parts use it.
    refetch();
  };

  if (!id) return null;

  return (
    <>
      <EmployeeDetail
        data={data ?? undefined}
        loading={isLoading}
        error={error as Error | null}
        editable={true}
        onEdit={handleEdit}
        attachmentService={attachmentService}
        onManageTags={() => setTagsDialogOpen(true)}
        onManageAttachments={() => setAttachmentsDialogOpen(true)}
        profilePhotoComponent={
          data ? (
            <EmployeeProfilePhotoUpload
              employee={data}
              attachmentService={attachmentService}
              // We need to pass current photo if available. 
              // Assuming we can fetch it or derive it. 
              // For now we might not have it in 'data' if backend doesn't return it on Employee object.
              // But let's assume `data.profile_photo` or similar if it existed.
              // Since we don't have it in type, we might pass null and let component fetch?
              // The component uses `currentPhoto` prop. 
              // Without it, it might show initial logic.
              // Let's check Employee type again. It doesn't have profile_picture. 
              // So we might need to fetch it separately or rely on it being fetched.
              // However, ProfilePhotoUpload usually takes a FileUpload object (url, id).
              // If Employee doesn't have it, we might need to rely on the side effect of upload.
              // Or maybe we should add profile_photo to Employee type if backend supports it.
              // For now, passing undefined.
              currentPhoto={null} 
              onPhotoChange={handlePhotoChange}
            />
          ) : undefined
        }
      />

      <EditEmployeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditSubmit}
        employee={data ?? null}
      />

      {data && (
        <>
          <EmployeeTagsDialog
            open={tagsDialogOpen}
            onOpenChange={setTagsDialogOpen}
            employee={data}
            tagService={tagService}
            onSave={handleSaveTags}
          />
          <EmployeeAttachmentsDialog
             open={attachmentsDialogOpen}
             onOpenChange={setAttachmentsDialogOpen}
             employee={data}
             attachmentService={attachmentService}
             onSave={handleSaveAttachments}
          />
        </>
      )}
    </>
  );
}

export function ViewEmployeePage() {
  const { id } = useParams({ from: "/sales/employees/$id" });

  const serviceConfig = useMemo(() => ({
    apiClient: api,
    endpoints: {
      employees: "/api/v1/sales/employees",
    },
  }), []);

  return (
    <EmployeeProvider config={serviceConfig}>
      <EmployeeDetailContent id={id} />
    </EmployeeProvider>
  );
}
