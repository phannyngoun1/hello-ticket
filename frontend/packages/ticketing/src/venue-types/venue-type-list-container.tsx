/**
 * VenueType List Container
 *
 * Container component that integrates VenueTypeList with data fetching and mutations
 * Uses the VenueTypeService and hooks to handle all operations
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {VenueTypeList } from "./venue-type-list";
import { CreateVenueTypeDialog } from "./create-venue-type-dialog";
import { EditVenueTypeDialog } from "./edit-venue-type-dialog";
import { useVenueTypeService } from "./venue-type-provider";
import { useVenueType, useDeleteVenueType, useCreateVenueType, useUpdateVenueType} from "./use-venue-types";
import { useToast } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import type {VenueType,
  CreateVenueTypeInput,
  UpdateVenueTypeInput,
} from "./types";
import type { Pagination } from "@truths/shared";

export interface VenueTypeListContainerProps {
  /** When true, opens the create dialog on mount or when toggled on */
  autoOpenCreate?: boolean;
  /** Called when the create dialog is closed (cancel/close after open) */
  onCreateDialogClose?: () => void;
  /** Navigation function to navigate to create route */
  onNavigateToCreate?: () => void;
  /** Navigation function to navigate to a venue-type detail route */
  onNavigateToVenueType?: (id: string) => void;
}

export function VenueTypeListContainer({
  autoOpenCreate = false,
  onCreateDialogClose,
  onNavigateToVenueType,
}: VenueTypeListContainerProps) {
  const service = useVenueTypeService();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [vtToEdit, setVenueTypeToEdit] = useState<VenueType | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vtToDelete, setVenueTypeToDelete] = useState<VenueType | null>(null);

  // Fetch VenueType with filters and pagination
  const {
    data: vtResponse,
    isLoading,
  } = useVenueType(service, {
    search: globalSearch || undefined,
    pagination,
  });
  const vtList = vtResponse?.data || [];

  // Delete mutation
  const deleteMutation = useDeleteVenueType(service);

  // Create mutation
  const createMutation = useCreateVenueType(service);

  // Update mutation
  const updateMutation = useUpdateVenueType(service);

  const handleDelete = useCallback((vt: VenueType) => {
    setVenueTypeToDelete(vt);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!vtToDelete) return;

    try {
      await deleteMutation.mutateAsync(vtToDelete.id);
      toast({
        title: t("common.success"),
        description: t("pages.settings.ticketing.vt.deleted"),
      });
      setDeleteConfirmOpen(false);
      setVenueTypeToDelete(null);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive",
      });
    }}, [vtToDelete, deleteMutation, toast, t]);

  const handleEdit = useCallback((vt: VenueType) => {
    setVenueTypeToEdit(vt);
    setIsEditDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  useEffect(() => {
    if (autoOpenCreate && !isCreateDialogOpen) {
      setIsCreateDialogOpen(true);
    }}, [autoOpenCreate, isCreateDialogOpen]);

  const handleCreateVenueType = useCallback(
    async (vtData: CreateVenueTypeInput) => {
      try {
        await createMutation.mutateAsync(vtData);
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.ticketing.vt.created",
            "VenueType created successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.ticketing.vt.createError",
            "Failed to create venue-type"
          ),
          variant: "destructive",
        });
        throw error;
      }},
    [createMutation, toast, t]
  );

  const handleUpdateVenueType = useCallback(
    async (id: string, vtData: UpdateVenueTypeInput) => {
      try {
        await updateMutation.mutateAsync({ id, input: vtData });
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.ticketing.vt.updated",
            "VenueType updated successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.ticketing.vt.updateError",
            "Failed to update venue-type"
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
      <VenueTypeList
        data={vtList}
        loading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={handleSearch}
      />

      <CreateVenueTypeDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }}}
        onSubmit={handleCreateVenueType}
        loading={createMutation.isPending}
        error={createMutation.error}
      />

      <EditVenueTypeDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setVenueTypeToEdit(null);
          }}}
        vt={vtToEdit}
        onSubmit={handleUpdateVenueType}
        loading={updateMutation.isPending}
        error={updateMutation.error}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setVenueTypeToDelete(null);
          }}}
        title={t(
          "pages.settings.ticketing.vt.confirmDeleteTitle",
          "Delete VenueType"
        )}
        description={vtToDelete
            ? t("pages.settings.ticketing.vt.confirmDelete", {
                defaultValue: `Are you sure you want to delete "${vtToDelete.name || vtToDelete.id}"? This action cannot be undone.`,
                name: vtToDelete.name || vtToDelete.id,
              })
            : ""
        }
        confirmText="delete"
        confirmTextLabel={t("common.typeToConfirm", "Type 'delete' to confirm")}
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
