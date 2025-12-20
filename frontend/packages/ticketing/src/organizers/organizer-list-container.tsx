/**
 * Organizer List Container
 *
 * Integrates the list, dialogs, and service hooks to manage organizers.
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type { Organizer, CreateOrganizerInput, UpdateOrganizerInput, OrganizerFilter } from "./types";
import { OrganizerList } from "./organizer-list";
import { CreateOrganizerDialog } from "./create-organizer-dialog";
import { EditOrganizerDialog } from "./edit-organizer-dialog";
import {
  useOrganizers,
  useCreateOrganizer,
  useUpdateOrganizer,
  useDeleteOrganizer,
} from "./use-organizers";
import { useOrganizerService } from "./organizer-provider";

export interface OrganizerListContainerProps {
  onNavigateToOrganizer?: (id: string) => void;
  onNavigateToCreate?: () => void;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function OrganizerListContainer({
  onNavigateToOrganizer,
  onNavigateToCreate,
  autoOpenCreate,
  onCreateDialogClose,
}: OrganizerListContainerProps) {
  const organizerService = useOrganizerService();

  const [filter, setFilter] = useState<OrganizerFilter>({});
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [organizerToEdit, setOrganizerToEdit] = useState<Organizer | null>(null);
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error } = useOrganizers(organizerService, {
    filter,
    pagination,
  });

  const createMutation = useCreateOrganizer(organizerService);
  const updateMutation = useUpdateOrganizer(organizerService);
  const deleteMutation = useDeleteOrganizer(organizerService);

  const organizers = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  const handleEdit = useCallback((organizer: Organizer) => {
    setOrganizerToEdit(organizer);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (organizer: Organizer) => {
      try {
        await deleteMutation.mutateAsync(organizer.id);
        toast({ title: "Success", description: "Organizer deleted successfully" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete organizer",
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
    async (input: CreateOrganizerInput) => {
      try {
        await createMutation.mutateAsync(input);
        toast({ title: "Success", description: "Organizer created successfully" });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to create organizer",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createMutation, onCreateDialogClose]
  );

  const handleEditSubmit = useCallback(
    async (id: string, input: UpdateOrganizerInput) => {
      try {
        await updateMutation.mutateAsync({ id, input });
        toast({ title: "Success", description: "Organizer updated successfully" });
        setEditDialogOpen(false);
        setOrganizerToEdit(null);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update organizer",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation]
  );

  const handleNavigateToOrganizer = useCallback(
    (organizer: Organizer) => {
      onNavigateToOrganizer?.(organizer.id);
    },
    [onNavigateToOrganizer]
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
      <OrganizerList
        organizers={organizers}
        loading={isLoading}
        error={error as Error | null}
        onOrganizerClick={handleNavigateToOrganizer}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <CreateOrganizerDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateSubmit}
      />

      <EditOrganizerDialog
        open={editDialogOpen && !!organizerToEdit}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setOrganizerToEdit(null);
          }
        }}
        onSubmit={handleEditSubmit}
        organizer={organizerToEdit}
      />
    </>
  );
}

