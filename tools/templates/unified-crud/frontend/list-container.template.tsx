/**
 * {{EntityName}} List Container
 *
 * Integrates the list, dialogs, and service hooks to manage {{entity-plural}}.
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type { {{EntityName}}, Create{{EntityName}}Input, Update{{EntityName}}Input, {{EntityName}}Filter } from "./types";
import { {{EntityName}}List } from "./{{entity-name}}-list";
import { Create{{EntityName}}Dialog } from "./create-{{entity-name}}-dialog";
import { Edit{{EntityName}}Dialog } from "./edit-{{entity-name}}-dialog";
import {
  use{{EntityPlural}},
  useCreate{{EntityName}},
  useUpdate{{EntityName}},
  useDelete{{EntityName}},
} from "./use-{{entity-plural}}";
import { use{{EntityName}}Service } from "./{{entity-name}}-provider";

export interface {{EntityName}}ListContainerProps {
  onNavigateTo{{EntityName}}?: (id: string) => void;
  onNavigateToCreate?: () => void;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function {{EntityName}}ListContainer({
  onNavigateTo{{EntityName}},
  onNavigateToCreate,
  autoOpenCreate,
  onCreateDialogClose,
}: {{EntityName}}ListContainerProps) {
  const {{entityName}}Service = use{{EntityName}}Service();

  const [filter, setFilter] = useState<{{EntityName}}Filter>({});
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [{{entityName}}ToEdit, set{{EntityName}}ToEdit] = useState<{{EntityName}} | null>(null);
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error } = use{{EntityPlural}}({{entityName}}Service, {
    filter,
    pagination,
  });

  const createMutation = useCreate{{EntityName}}({{entityName}}Service);
  const updateMutation = useUpdate{{EntityName}}({{entityName}}Service);
  const deleteMutation = useDelete{{EntityName}}({{entityName}}Service);

  const {{entityPlural}} = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  const handleEdit = useCallback(({{entityName}}: {{EntityName}}) => {
    set{{EntityName}}ToEdit({{entityName}});
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async ({{entityName}}: {{EntityName}}) => {
      try {
        await deleteMutation.mutateAsync({{entityName}}.id);
        toast({ title: "Success", description: "{{EntityName}} deleted successfully" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete {{entity-name}}",
          variant: "destructive",
        });
      }
    },
    [deleteMutation]
  );

  const handleSearch = useCallback((query: string) => {
    setFilter((prev) => ({ ...prev, search: query || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize });
  }, []);

  const handleCreateSubmit = useCallback(
    async (input: Create{{EntityName}}Input) => {
      try {
        await createMutation.mutateAsync(input);
        toast({ title: "Success", description: "{{EntityName}} created successfully" });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to create {{entity-name}}",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createMutation, onCreateDialogClose]
  );

  const handleEditSubmit = useCallback(
    async (id: string, input: Update{{EntityName}}Input) => {
      try {
        await updateMutation.mutateAsync({ id, input });
        toast({ title: "Success", description: "{{EntityName}} updated successfully" });
        setEditDialogOpen(false);
        set{{EntityName}}ToEdit(null);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update {{entity-name}}",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation]
  );

  const handleNavigateTo{{EntityName}} = useCallback(
    ({{entityName}}: {{EntityName}}) => {
      onNavigateTo{{EntityName}}?.({{entityName}}.id);
    },
    [onNavigateTo{{EntityName}}]
  );

  const serverPagination = useMemo(() => {
    if (!paginationData) return undefined;
    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: paginationData.total,
      totalPages: paginationData.totalPages,
    };
  }, [pagination, paginationData]);

  return (
    <>
      <{{EntityName}}List
        {{entityPlural}}={{{entityPlural}}}
        loading={isLoading}
        error={error as Error | null}
        on{{EntityName}}Click={handleNavigateTo{{EntityName}}}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <Create{{EntityName}}Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateSubmit}
      />

      <Edit{{EntityName}}Dialog
        open={editDialogOpen && !!{{entityName}}ToEdit}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            set{{EntityName}}ToEdit(null);
          }
        }}
        onSubmit={handleEditSubmit}
        {{entityName}}={{{entityName}}ToEdit}
      />
    </>
  );
}

