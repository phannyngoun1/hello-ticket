/**
 * Organizer Tags Management Dialog
 *
 * Dialog component for managing organizer tags using shared EntityTagsDialog
 *
 * @author Phanny
 */

import { TagService } from "@truths/shared";
import { EntityTagsDialog } from "@truths/custom-ui";
import { Organizer } from "./types";

export interface OrganizerTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizer: Organizer;
  tagService: TagService;
  onSave: (tags: string[]) => Promise<void>;
  loading?: boolean;
}

export function OrganizerTagsDialog({
  open,
  onOpenChange,
  organizer,
  tagService,
  onSave,
  loading = false,
}: OrganizerTagsDialogProps) {
  return (
    <EntityTagsDialog
      open={open}
      onOpenChange={onOpenChange}
      entityId={organizer.id}
      entityName={organizer.name || organizer.code || ""}
      entityType="organizer"
      initialTags={organizer.tags}
      tagService={tagService}
      onSave={onSave}
      loading={loading}
    />
  );
}
