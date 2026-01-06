/**
 * Employee Tags Management Dialog
 *
 * Dialog component for managing employee tags using the shared EntityTagsDialog
 */

import { TagService } from "@truths/shared";
import { EntityTagsDialog } from "@truths/custom-ui";
import { Employee } from "./types";

export interface EmployeeTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  tagService: TagService;
  onSave: (tags: string[]) => Promise<void>;
  loading?: boolean;
}

export function EmployeeTagsDialog({
  open,
  onOpenChange,
  employee,
  tagService,
  onSave,
  loading = false,
}: EmployeeTagsDialogProps) {
  return (
    <EntityTagsDialog
      open={open}
      onOpenChange={onOpenChange}
      entityId={employee.id}
      entityName={employee.name || employee.code || ""}
      entityType="employee"
      initialTags={employee.tags}
      tagService={tagService}
      onSave={onSave}
      loading={loading}
    />
  );
}
