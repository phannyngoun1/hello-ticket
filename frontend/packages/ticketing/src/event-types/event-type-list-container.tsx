/**
 * EventType List Container
 *
 * Container component that integrates EventTypeList with data fetching and mutations
 * Uses the EventTypeService and hooks to handle all operations
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {EventTypeList } from "./event-type-list";
import { CreateEventTypeDialog } from "./create-event-type-dialog";
import { EditEventTypeDialog } from "./edit-event-type-dialog";
import { useEventTypeService } from "./event-type-provider";
import { useEventType, useDeleteEventType, useCreateEventType, useUpdateEventType} from "./use-event-types";
import { useToast } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import type {EventType,
  CreateEventTypeInput,
  UpdateEventTypeInput,
} from "./types";
import type { Pagination } from "@truths/shared";

export interface EventTypeListContainerProps {
  /** When true, opens the create dialog on mount or when toggled on */
  autoOpenCreate?: boolean;
  /** Called when the create dialog is closed (cancel/close after open) */
  onCreateDialogClose?: () => void;
  /** Navigation function to navigate to create route */
  onNavigateToCreate?: () => void;
  /** Navigation function to navigate to a event-type detail route */
  onNavigateToEventType?: (id: string) => void;
}

export function EventTypeListContainer({
  autoOpenCreate = false,
  onCreateDialogClose,
  onNavigateToEventType,
}: EventTypeListContainerProps) {
  const service = useEventTypeService();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [etToEdit, setEventTypeToEdit] = useState<EventType | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [etToDelete, setEventTypeToDelete] = useState<EventType | null>(null);

  // Fetch EventType with filters and pagination
  const {
    data: etResponse,
    isLoading,
  } = useEventType(service, {
    search: globalSearch || undefined,
    pagination,
  });
  const etList = etResponse?.data || [];

  // Delete mutation
  const deleteMutation = useDeleteEventType(service);

  // Create mutation
  const createMutation = useCreateEventType(service);

  // Update mutation
  const updateMutation = useUpdateEventType(service);

  const handleDelete = useCallback((et: EventType) => {
    setEventTypeToDelete(et);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!etToDelete) return;

    try {
      await deleteMutation.mutateAsync(etToDelete.id);
      toast({
        title: t("common.success"),
        description: t("pages.settings.ticketing.et.deleted"),
      });
      setDeleteConfirmOpen(false);
      setEventTypeToDelete(null);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive",
      });
    }}, [etToDelete, deleteMutation, toast, t]);

  const handleEdit = useCallback((et: EventType) => {
    setEventTypeToEdit(et);
    setIsEditDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  useEffect(() => {
    if (autoOpenCreate && !isCreateDialogOpen) {
      setIsCreateDialogOpen(true);
    }}, [autoOpenCreate, isCreateDialogOpen]);

  const handleCreateEventType = useCallback(
    async (etData: CreateEventTypeInput) => {
      try {
        await createMutation.mutateAsync(etData);
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.ticketing.et.created",
            "EventType created successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.ticketing.et.createError",
            "Failed to create event-type"
          ),
          variant: "destructive",
        });
        throw error;
      }},
    [createMutation, toast, t]
  );

  const handleUpdateEventType = useCallback(
    async (id: string, etData: UpdateEventTypeInput) => {
      try {
        await updateMutation.mutateAsync({ id, input: etData });
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.ticketing.et.updated",
            "EventType updated successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.ticketing.et.updateError",
            "Failed to update event-type"
          ),
          variant: "destructive",
        });
        throw error;
      }},
    [updateMutation, toast, t]
  );

  const handleSearch = useCallback((query: string) => {
    setGlobalSearch(query);
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  return (
    <>
      <EventTypeList
        data={etList}
        loading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={handleSearch}
      />

      <CreateEventTypeDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }}}
        onSubmit={handleCreateEventType}
        loading={createMutation.isPending}
        error={createMutation.error}
      />

      <EditEventTypeDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEventTypeToEdit(null);
          }}}
        et={etToEdit}
        onSubmit={handleUpdateEventType}
        loading={updateMutation.isPending}
        error={updateMutation.error}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setEventTypeToDelete(null);
          }}}
        title={t(
          "pages.settings.ticketing.et.confirmDeleteTitle",
          "Delete EventType"
        )}
        description={etToDelete
            ? t("pages.settings.ticketing.et.confirmDelete", {
                name: etToDelete.name || etToDelete.id,
              })
            : ""
        }
        confirmAction={{label: t("common.delete", "Delete"),
            variant: "destructive",
            onClick: confirmDelete,
            loading: deleteMutation.isPending,
            disabled: deleteMutation.isPending,
        }}
        cancelAction={{label: t("common.cancel", "Cancel"),
            variant: "outline",
            disabled: deleteMutation.isPending,
        }}
      />
    </>
  );
}
