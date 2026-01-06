/**
 * Customer Attachments Management Dialog
 *
 * Dialog component for managing customer document attachments using shared EntityAttachmentsDialog
 *
 * @author Phanny
 */

import { AttachmentService, FileUpload } from "@truths/shared";
import { EntityAttachmentsDialog } from "@truths/custom-ui";
import { Customer } from "../types";

export interface CustomerAttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  attachmentService: AttachmentService;
  onSave?: (attachments: FileUpload[]) => Promise<void>;
  loading?: boolean;
}

export function CustomerAttachmentsDialog({
  open,
  onOpenChange,
  customer,
  attachmentService,
  onSave,
  loading = false,
}: CustomerAttachmentsDialogProps) {
  return (
    <EntityAttachmentsDialog
      open={open}
      onOpenChange={onOpenChange}
      entityId={customer.id}
      entityName={customer.name || customer.code || ""}
      entityType="customer"
      attachmentService={attachmentService}
      onSave={onSave}
      loading={loading}
    />
  );
}
