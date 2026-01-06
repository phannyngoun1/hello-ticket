/**
 * Customer Tags Management Dialog
 *
 * Dialog component for managing customer tags using the shared EntityTagsDialog
 *
 * @author Phanny
 */

import { TagService } from "@truths/shared";
import { EntityTagsDialog } from "@truths/custom-ui";
import { Customer } from "../types";

export interface CustomerTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  tagService: TagService;
  onSave: (tags: string[]) => Promise<void>;
  loading?: boolean;
}

export function CustomerTagsDialog({
  open,
  onOpenChange,
  customer,
  tagService,
  onSave,
  loading = false,
}: CustomerTagsDialogProps) {
  return (
    <EntityTagsDialog
      open={open}
      onOpenChange={onOpenChange}
      entityId={customer.id}
      entityName={customer.name || customer.code || ""}
      entityType="customer"
      initialTags={customer.tags}
      tagService={tagService}
      onSave={onSave}
      loading={loading}
    />
  );
}
