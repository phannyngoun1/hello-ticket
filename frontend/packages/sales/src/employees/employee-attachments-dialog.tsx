/**
 * Employee Attachments Management Dialog
 *
 * Dialog component for managing employee document attachments using shared EntityAttachmentsDialog
 */

import { AttachmentService, FileUpload } from "@truths/shared";
import { EntityAttachmentsDialog } from "@truths/custom-ui";
import { Employee } from "./types";

export interface EmployeeAttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  attachmentService: AttachmentService;
  onSave?: (attachments: FileUpload[]) => Promise<void>;
  loading?: boolean;
}

export function EmployeeAttachmentsDialog({
  open,
  onOpenChange,
  employee,
  attachmentService,
  onSave,
  loading = false,
}: EmployeeAttachmentsDialogProps) {
  return (
    <EntityAttachmentsDialog
      open={open}
      onOpenChange={onOpenChange}
      entityId={employee.id}
      entityName={employee.name || employee.code || ""}
      entityType="employee"
      attachmentService={attachmentService}
      onSave={onSave}
      loading={loading}
    />
  );
}
