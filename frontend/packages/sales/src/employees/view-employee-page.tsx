/**
 * View Employee Page Component
 *
 * Full-featured page for viewing a single employee.
 * Handles data fetching, edit dialog, tags, attachments, profile photo, and tab title updates.
 * Must be used within EmployeeProvider (e.g. from domain providers).
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "@truths/ui";
import { EmployeeDetail } from "./employee-detail";
import { useEmployee, useUpdateEmployee } from "./use-employees";
import { useEmployeeService } from "./employee-provider";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { EmployeeTagsDialog } from "./employee-tags-dialog";
import { EmployeeAttachmentsDialog } from "./employee-attachments-dialog";
import { EmployeeProfilePhotoUpload } from "./employee-profile-photo-upload";
import type { UpdateEmployeeInput } from "./types";
import { TagService, AttachmentService, type FileUpload } from "@truths/shared";
import type { ServiceConfig } from "@truths/shared";
import type { AttachmentServiceConfig } from "@truths/shared";

export interface ViewEmployeePageConfig {
  tag: ServiceConfig<{ tags: string }>;
  attachment: AttachmentServiceConfig;
}

export interface ViewEmployeePageProps {
  employeeId: string;
  config: ViewEmployeePageConfig;
}

function EmployeeDetailContent({
  employeeId,
  tagService,
  attachmentService,
}: {
  employeeId: string;
  tagService: TagService;
  attachmentService: AttachmentService;
}) {
  const service = useEmployeeService();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);

  const updateMutation = useUpdateEmployee(service);
  const { data, isLoading, error, refetch } = useEmployee(
    service,
    employeeId ?? null,
  );

  useEffect(() => {
    if (!data) return;
    const title = data.code || data.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/sales/employees/${employeeId}`,
          title,
        },
      }),
    );
  }, [employeeId, data]);

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (
    id: string,
    input: UpdateEmployeeInput,
  ) => {
    try {
      await updateMutation.mutateAsync({ id, input });
      toast({ title: "Success", description: "Employee updated successfully" });
      setEditDialogOpen(false);
    } catch (error) {
      throw error;
    }
  };

  const handleSaveTags = async (tags: string[]) => {
    if (!data) return;
    try {
      await tagService.manageEntityTags("employee", data.id, tags);
      await refetch();
      toast({ title: "Success", description: "Tags updated successfully" });
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

  const handleSaveAttachments = async (_attachments: FileUpload[]) => {
    setAttachmentsDialogOpen(false);
  };

  const handlePhotoChange = useCallback(() => {
    refetch();
  }, [refetch]);

  if (!employeeId) return null;

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

export function ViewEmployeePage({
  employeeId,
  config,
}: ViewEmployeePageProps) {
  const tagService = useMemo(
    () => new TagService(config.tag),
    [config.tag],
  );
  const attachmentService = useMemo(
    () => new AttachmentService(config.attachment),
    [config.attachment],
  );

  return (
    <EmployeeDetailContent
      employeeId={employeeId}
      tagService={tagService}
      attachmentService={attachmentService}
    />
  );
}
