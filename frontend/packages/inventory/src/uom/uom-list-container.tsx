/**
 * UoM List Container
 *
 * Container component that integrates UoMList with data fetching and mutations
 * Uses the UoMService and hooks to handle all operations
 *
 * @author Phanny
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { UoMList } from "./uom-list";
import { CreateUoMDialog } from "./create-uom-dialog";
import { EditUoMDialog } from "./edit-uom-dialog";
import { useUoMService } from "./uom-provider";
import { useUoM, useDeleteUoM, useCreateUoM, useUpdateUoM } from "./use-uom";
import { useToast } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import type {
  UnitOfMeasure,
  CreateUnitOfMeasureInput,
  UpdateUnitOfMeasureInput,
} from "../types";
import type { Pagination } from "@truths/shared";

export interface UoMListContainerProps {
  /** When true, opens the create dialog on mount or when toggled on */
  autoOpenCreate?: boolean;
  /** Called when the create dialog is closed (cancel/close after open) */
  onCreateDialogClose?: () => void;
  /** Navigation function to navigate to create route */
  onNavigateToCreate?: () => void;
  /** Navigation function to navigate to a UoM detail route */
  onNavigateToUoM?: (id: string) => void;
}

export function UoMListContainer({
  autoOpenCreate = false,
  onCreateDialogClose,
  onNavigateToUoM,
}: UoMListContainerProps) {
  const service = useUoMService();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [uomToEdit, setUomToEdit] = useState<UnitOfMeasure | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [uomToDelete, setUomToDelete] = useState<UnitOfMeasure | null>(null);

  // Fetch UoM with filters and pagination
  const {
    data: uomResponse,
    isLoading,
    error,
  } = useUoM(service, {
    search: globalSearch || undefined,
    pagination,
  });
  const uomList = uomResponse?.data || [];
  const serverPagination = uomResponse?.pagination;

  // Delete mutation
  const deleteMutation = useDeleteUoM(service);

  // Create mutation
  const createMutation = useCreateUoM(service);

  // Update mutation
  const updateMutation = useUpdateUoM(service);

  const handleDelete = useCallback((uom: UnitOfMeasure) => {
    setUomToDelete(uom);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!uomToDelete) return;

    try {
      await deleteMutation.mutateAsync(uomToDelete.id);
      toast({
        title: t("common.success"),
        description: t("pages.settings.inventory.uom.deleted"),
      });
      setDeleteConfirmOpen(false);
      setUomToDelete(null);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive",
      });
    }
  }, [uomToDelete, deleteMutation, toast, t]);

  const handleEdit = useCallback((uom: UnitOfMeasure) => {
    setUomToEdit(uom);
    setIsEditDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    // Open dialog directly on click
    setIsCreateDialogOpen(true);
  }, []);

  // Open the create dialog when requested by parent (e.g., via URL param)
  useEffect(() => {
    if (autoOpenCreate && !isCreateDialogOpen) {
      setIsCreateDialogOpen(true);
    }
  }, [autoOpenCreate, isCreateDialogOpen]);

  const handleCreateUoM = useCallback(
    async (uomData: CreateUnitOfMeasureInput) => {
      try {
        await createMutation.mutateAsync(uomData);
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.inventory.uom.created",
            "Unit of measure created successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.inventory.uom.createError",
            "Failed to create unit of measure"
          ),
          variant: "destructive",
        });
        throw error; // Re-throw to let the dialog handle it
      }
    },
    [createMutation, toast, t]
  );

  const handleUpdateUoM = useCallback(
    async (id: string, uomData: UpdateUnitOfMeasureInput) => {
      try {
        await updateMutation.mutateAsync({ id, input: uomData });
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.inventory.uom.updated",
            "Unit of measure updated successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.inventory.uom.updateError",
            "Failed to update unit of measure"
          ),
          variant: "destructive",
        });
        throw error; // Re-throw to let the dialog handle it
      }
    },
    [updateMutation, toast, t]
  );

  const handleSearch = useCallback((query: string) => {
    setGlobalSearch(query);
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  return (
    <>
      <UoMList
        data={uomList}
        loading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={handleSearch}
      />

      <CreateUoMDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateUoM}
        loading={createMutation.isPending}
        error={createMutation.error}
      />

      <EditUoMDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setUomToEdit(null);
          }
        }}
        uom={uomToEdit}
        onSubmit={handleUpdateUoM}
        loading={updateMutation.isPending}
        error={updateMutation.error}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setUomToDelete(null);
          }
        }}
        title={t(
          "pages.settings.inventory.uom.confirmDeleteTitle",
          "Delete UOM"
        )}
        description={
          uomToDelete
            ? t("pages.settings.inventory.uom.confirmDelete", {
                code: uomToDelete.code,
              })
            : ""
        }
        confirmAction={{
          label: t("common.delete", "Delete"),
          variant: "destructive",
          onClick: confirmDelete,
          loading: deleteMutation.isPending,
          disabled: deleteMutation.isPending,
        }}
        cancelAction={{
          label: t("common.cancel", "Cancel"),
          variant: "outline",
          disabled: deleteMutation.isPending,
        }}
      />
    </>
  );
}
