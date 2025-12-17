/**
 * CustomerType List Container
 *
 * Container component that integrates CustomerTypeList with data fetching and mutations
 * Uses the CustomerTypeService and hooks to handle all operations
 *
 * @author Phanny
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {CustomerTypeList } from "./customer-type-list";
import { CreateCustomerTypeDialog } from "./create-customer-type-dialog";
import { EditCustomerTypeDialog } from "./edit-customer-type-dialog";
import { useCustomerTypeService } from "./customer-type-provider";
import { useCustomerType, useDeleteCustomerType, useCreateCustomerType, useUpdateCustomerType} from "./use-customer-types";
import { useToast } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import type {CustomerType,
  CreateCustomerTypeInput,
  UpdateCustomerTypeInput,
} from "./types";
import type { Pagination } from "@truths/shared";

export interface CustomerTypeListContainerProps {
  /** When true, opens the create dialog on mount or when toggled on */
  autoOpenCreate?: boolean;
  /** Called when the create dialog is closed (cancel/close after open) */
  onCreateDialogClose?: () => void;
  /** Navigation function to navigate to create route */
  onNavigateToCreate?: () => void;
  /** Navigation function to navigate to a customer-type detail route */
  onNavigateToCustomerType?: (id: string) => void;
}

export function CustomerTypeListContainer({
  autoOpenCreate = false,
  onCreateDialogClose,
  onNavigateToCustomerType,
}: CustomerTypeListContainerProps) {
  const service = useCustomerTypeService();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [ctToEdit, setCustomerTypeToEdit] = useState<CustomerType | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ctToDelete, setCustomerTypeToDelete] = useState<CustomerType | null>(null);

  // Fetch CustomerType with filters and pagination
  const {
    data: ctResponse,
    isLoading,
  } = useCustomerType(service, {
    search: globalSearch || undefined,
    pagination,
  });
  const ctList = ctResponse?.data || [];

  // Delete mutation
  const deleteMutation = useDeleteCustomerType(service);

  // Create mutation
  const createMutation = useCreateCustomerType(service);

  // Update mutation
  const updateMutation = useUpdateCustomerType(service);

  const handleDelete = useCallback((ct: CustomerType) => {
    setCustomerTypeToDelete(ct);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!ctToDelete) return;

    try {
      await deleteMutation.mutateAsync(ctToDelete.id);
      toast({
        title: t("common.success"),
        description: t("pages.settings.sales.ct.deleted"),
      });
      setDeleteConfirmOpen(false);
      setCustomerTypeToDelete(null);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive",
      });
    }}, [ctToDelete, deleteMutation, toast, t]);

  const handleEdit = useCallback((ct: CustomerType) => {
    setCustomerTypeToEdit(ct);
    setIsEditDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  useEffect(() => {
    if (autoOpenCreate && !isCreateDialogOpen) {
      setIsCreateDialogOpen(true);
    }}, [autoOpenCreate, isCreateDialogOpen]);

  const handleCreateCustomerType = useCallback(
    async (ctData: CreateCustomerTypeInput) => {
      try {
        await createMutation.mutateAsync(ctData);
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.sales.ct.created",
            "CustomerType created successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.sales.ct.createError",
            "Failed to create customer-type"
          ),
          variant: "destructive",
        });
        throw error;
      }},
    [createMutation, toast, t]
  );

  const handleUpdateCustomerType = useCallback(
    async (id: string, ctData: UpdateCustomerTypeInput) => {
      try {
        await updateMutation.mutateAsync({ id, input: ctData });
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.sales.ct.updated",
            "CustomerType updated successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.sales.ct.updateError",
            "Failed to update customer-type"
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
      <CustomerTypeList
        data={ctList}
        loading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={handleSearch}
      />

      <CreateCustomerTypeDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }}}
        onSubmit={handleCreateCustomerType}
        loading={createMutation.isPending}
        error={createMutation.error}
      />

      <EditCustomerTypeDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setCustomerTypeToEdit(null);
          }}}
        ct={ctToEdit}
        onSubmit={handleUpdateCustomerType}
        loading={updateMutation.isPending}
        error={updateMutation.error}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setCustomerTypeToDelete(null);
          }}}
        title={t(
          "pages.settings.sales.ct.confirmDeleteTitle",
          "Delete CustomerType"
        )}
        description={ctToDelete
            ? t("pages.settings.sales.ct.confirmDelete", {
                name: ctToDelete.name || ctToDelete.id,
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
