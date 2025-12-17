/**
 * {{EntityName}} List Container
 *
 * Container component that integrates {{EntityName}}List with data fetching and mutations
 * Uses the {{EntityName}}Service and hooks to handle all operations
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { {{EntityName}}List } from "./{{entity-name}}-list";
import { Create{{EntityName}}Dialog } from "./create-{{entity-name}}-dialog";
import { Edit{{EntityName}}Dialog } from "./edit-{{entity-name}}-dialog";
import { use{{EntityName}}Service } from "./{{entity-name}}-provider";
import { use{{EntityName}}, useDelete{{EntityName}}, useCreate{{EntityName}}, useUpdate{{EntityName}}} from "./use-{{entity-plural}}";
import { useToast } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import type {
  {{EntityName}},
  Create{{EntityName}}Input,
  Update{{EntityName}}Input,
} from "./types";
import type { Pagination } from "@truths/shared";

export interface {{EntityName}}ListContainerProps {
  /** When true, opens the create dialog on mount or when toggled on */
  autoOpenCreate?: boolean;
  /** Called when the create dialog is closed (cancel/close after open) */
  onCreateDialogClose?: () => void;
  /** Navigation function to navigate to create route */
  onNavigateToCreate?: () => void;
  /** Navigation function to navigate to a {{entity-name}} detail route */
  onNavigateTo{{EntityName}}?: (id: string) => void;
}

export function {{EntityName}}ListContainer({
  autoOpenCreate = false,
  onCreateDialogClose,
  onNavigateTo{{EntityName}},
}: {{EntityName}}ListContainerProps) {
  const service = use{{EntityName}}Service();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [{{entityVar}}ToEdit, set{{EntityName}}ToEdit] = useState<{{EntityName}} | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [{{entityVar}}ToDelete, set{{EntityName}}ToDelete] = useState<{{EntityName}} | null>(null);

  // Fetch {{EntityName}} with filters and pagination
  const {
    data: {{entityVar}}Response,
    isLoading,
  } = use{{EntityName}}(service, {
    search: globalSearch || undefined,
    pagination,
  });
  const {{entityVar}}List = {{entityVar}}Response?.data || [];

  // Delete mutation
  const deleteMutation = useDelete{{EntityName}}(service);

  // Create mutation
  const createMutation = useCreate{{EntityName}}(service);

  // Update mutation
  const updateMutation = useUpdate{{EntityName}}(service);

  const handleDelete = useCallback(({{entityVar}}: {{EntityName}}) => {
    set{{EntityName}}ToDelete({{entityVar}});
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!{{entityVar}}ToDelete) return;

    try {
      await deleteMutation.mutateAsync({{entityVar}}ToDelete.id);
      toast({
        title: t("common.success"),
        description: t("pages.settings.{{packageName}}.{{entityVar}}.deleted"),
      });
      setDeleteConfirmOpen(false);
      set{{EntityName}}ToDelete(null);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.errorOccurred"),
        variant: "destructive",
      });
    }
  }, [{{entityVar}}ToDelete, deleteMutation, toast, t]);

  const handleEdit = useCallback(({{entityVar}}: {{EntityName}}) => {
    set{{EntityName}}ToEdit({{entityVar}});
    setIsEditDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  useEffect(() => {
    if (autoOpenCreate && !isCreateDialogOpen) {
      setIsCreateDialogOpen(true);
    }
  }, [autoOpenCreate, isCreateDialogOpen]);

  const handleCreate{{EntityName}} = useCallback(
    async ({{entityVar}}Data: Create{{EntityName}}Input) => {
      try {
        await createMutation.mutateAsync({{entityVar}}Data);
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.{{packageName}}.{{entityVar}}.created",
            "{{EntityName}} created successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.{{packageName}}.{{entityVar}}.createError",
            "Failed to create {{entity-name}}"
          ),
          variant: "destructive",
        });
        throw error;
      }
    },
    [createMutation, toast, t]
  );

  const handleUpdate{{EntityName}} = useCallback(
    async (id: string, {{entityVar}}Data: Update{{EntityName}}Input) => {
      try {
        await updateMutation.mutateAsync({ id, input: {{entityVar}}Data });
        toast({
          title: t("common.success", "Success"),
          description: t(
            "pages.settings.{{packageName}}.{{entityVar}}.updated",
            "{{EntityName}} updated successfully"
          ),
        });
      } catch (error) {
        toast({
          title: t("common.error", "Error"),
          description: t(
            "pages.settings.{{packageName}}.{{entityVar}}.updateError",
            "Failed to update {{entity-name}}"
          ),
          variant: "destructive",
        });
        throw error;
      }
    },
    [updateMutation, toast, t]
  );

  const handleSearch = useCallback((query: string) => {
    setGlobalSearch(query);
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  return (
    <>
      <{{EntityName}}List
        data={{{entityVar}}List}
        loading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={handleSearch}
      />

      <Create{{EntityName}}Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreate{{EntityName}}}
        loading={createMutation.isPending}
        error={createMutation.error}
      />

      <Edit{{EntityName}}Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            set{{EntityName}}ToEdit(null);
          }
        }}
        {{entityVar}}={{{entityVar}}ToEdit}
        onSubmit={handleUpdate{{EntityName}}}
        loading={updateMutation.isPending}
        error={updateMutation.error}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            set{{EntityName}}ToDelete(null);
          }
        }}
        title={t(
          "pages.settings.{{packageName}}.{{entityVar}}.confirmDeleteTitle",
          "Delete {{EntityName}}"
        )}
        description={
          {{entityVar}}ToDelete
            ? t("pages.settings.{{packageName}}.{{entityVar}}.confirmDelete", {
                name: {{entityVar}}ToDelete.name || {{entityVar}}ToDelete.id,
              })
            : ""
        }
        confirmAction={
          {
            label: t("common.delete", "Delete"),
            variant: "destructive",
            onClick: confirmDelete,
            loading: deleteMutation.isPending,
            disabled: deleteMutation.isPending,
          }
        }
        cancelAction={
          {
            label: t("common.cancel", "Cancel"),
            variant: "outline",
            disabled: deleteMutation.isPending,
          }
        }
      />
    </>
  );
}

