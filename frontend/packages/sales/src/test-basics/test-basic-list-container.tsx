/**
 * TestBasic List Container
 *
 * Container component that integrates TestBasicList with data fetching and mutations
 * Uses the TestBasicService and hooks to handle all operations
 *
 * @author Phanny
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {TestBasicList } from "./test-basic-list";
import { CreateTestBasicDialog } from "./create-test-basic-dialog";
import { EditTestBasicDialog } from "./edit-test-basic-dialog";
import { useTestBasicService } from "./test-basic-provider";
import { useTestBasic, useDeleteTestBasic, useCreateTestBasic, useUpdateTestBasic} from "./use-test-basics";
import { useToast } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import type {TestBasic,
  CreateTestBasicInput,
  UpdateTestBasicInput,
} from "./types";
import type { Pagination } from "@truths/shared";

export interface TestBasicListContainerProps {
  /** When true, opens the create dialog on mount or when toggled on */
  autoOpenCreate?: boolean;
  /** Called when the create dialog is closed (cancel/close after open) */
  onCreateDialogClose?: () => void;
  /** Navigation function to navigate to create route */
  onNavigateToCreate?: () => void;
  /** Navigation function to navigate to a test-basic detail route */
  onNavigateToTestBasic?: (id: string) => void;
}

export function TestBasicListContainer({
  autoOpenCreate = false,
  onCreateDialogClose,
  onNavigateToTestBasic,
}: TestBasicListContainerProps) {
  const service = useTestBasicService();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tbToEdit, setTestBasicToEdit] = useState<TestBasic | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tbToDelete, setTestBasicToDelete] = useState<TestBasic | null>(null);

  // Fetch TestBasic with filters and pagination
  const {
    data: tbResponse,
    isLoading,
  } = useTestBasic(service, {
    search: globalSearch || undefined,
    pagination,
  });
  const tbList = tbResponse?.data || [];

  // Delete mutation
  const deleteMutation = useDeleteTestBasic(service);

  // Create mutation
  const createMutation = useCreateTestBasic(service);

  // Update mutation
  const updateMutation = useUpdateTestBasic(service);

  const handleDelete = useCallback((tb: TestBasic) => {
    setTestBasicToDelete(tb);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!tbToDelete) return;

    try {
      await deleteMutation.mutateAsync(tbToDelete.id);
      toast({
        title: t("common.success"),
        description: t("pages.settings.sales.tb.deleted"),
      });
      setDeleteConfirmOpen(false);
      setTestBasicToDelete(null);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive",
      });
    }}, [tbToDelete, deleteMutation, toast, t]);

  const handleEdit = useCallback((tb: TestBasic) => {
    setTestBasicToEdit(tb);
    setIsEditDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  useEffect(() => {
    if (autoOpenCreate && !isCreateDialogOpen) {
      setIsCreateDialogOpen(true);
    }}, [autoOpenCreate, isCreateDialogOpen]);

  const handleCreateTestBasic = useCallback(
    async (tbData: CreateTestBasicInput) => {
      try {
        await createMutation.mutateAsync(tbData);
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.sales.tb.created",
            "TestBasic created successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.sales.tb.createError",
            "Failed to create test-basic"
          ),
          variant: "destructive",
        });
        throw error;
      }},
    [createMutation, toast, t]
  );

  const handleUpdateTestBasic = useCallback(
    async (id: string, tbData: UpdateTestBasicInput) => {
      try {
        await updateMutation.mutateAsync({ id, input: tbData });
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.sales.tb.updated",
            "TestBasic updated successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.sales.tb.updateError",
            "Failed to update test-basic"
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
      <TestBasicList
        data={tbList}
        loading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={handleSearch}
      />

      <CreateTestBasicDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }}}
        onSubmit={handleCreateTestBasic}
        loading={createMutation.isPending}
        error={createMutation.error}
      />

      <EditTestBasicDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setTestBasicToEdit(null);
          }}}
        tb={tbToEdit}
        onSubmit={handleUpdateTestBasic}
        loading={updateMutation.isPending}
        error={updateMutation.error}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            setTestBasicToDelete(null);
          }}}
        title={t(
          "pages.settings.sales.tb.confirmDeleteTitle",
          "Delete TestBasic"
        )}
        description={tbToDelete
            ? t("pages.settings.sales.tb.confirmDelete", {
                name: tbToDelete.name || tbToDelete.id,
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
