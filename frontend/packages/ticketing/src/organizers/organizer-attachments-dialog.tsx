/**
 * Organizer Attachments Management Dialog
 *
 * Dialog component for managing organizer document attachments using shared EntityAttachmentsDialog
 *
 * @author Phanny
 */

import { AttachmentService, FileUpload } from "@truths/shared";
import { EntityAttachmentsDialog } from "@truths/custom-ui";
import { Organizer } from "./types";

export interface OrganizerAttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizer: Organizer;
  attachmentService: AttachmentService;
  onSave?: (attachments: FileUpload[]) => Promise<void>;
  loading?: boolean;
}

export function OrganizerAttachmentsDialog({
  open,
  onOpenChange,
  organizer,
  attachmentService,
  onSave,
  loading = false,
}: OrganizerAttachmentsDialogProps) {
  return (
    <EntityAttachmentsDialog
      open={open}
      onOpenChange={onOpenChange}
      entityId={organizer.id}
      entityName={organizer.name || organizer.code || ""}
      entityType="organizer"
      attachmentService={attachmentService}
      onSave={onSave}
      loading={loading}
    />
  );
}
