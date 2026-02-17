/**
 * Show List Container
 *
 * Integrates the list, dialogs, and service hooks to manage shows.
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type {
  Show,
  CreateShowInput,
  UpdateShowInput,
  ShowFilter,
} from "./types";
import { ShowList } from "./show-list";
import { CreateShowDialog } from "./create-show-dialog";
import { EditShowDialog } from "./edit-show-dialog";
import { useShows, useCreateShow, useUpdateShow } from "./use-shows";
import { useShowService } from "./show-provider";

export interface ShowListContainerProps {
  onNavigateToShow?: (id: string) => void;
  onNavigateToCreate?: () => void;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function ShowListContainer({
  onNavigateToShow,
  onNavigateToCreate,
  autoOpenCreate,
  onCreateDialogClose,
}: ShowListContainerProps) {
  const showService = useShowService();

  const [filter, setFilter] = useState<ShowFilter>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showToEdit, setShowToEdit] = useState<Show | null>(null);
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error, refetch, isFetching } = useShows(
    showService,
    { filter, pagination }
  );

  const createMutation = useCreateShow(showService);
  const updateMutation = useUpdateShow(showService);

  const shows = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

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
    async (input: CreateShowInput) => {
      try {
        await createMutation.mutateAsync(input);
        toast({ title: "Success", description: "Show created successfully" });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to create show",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createMutation, onCreateDialogClose]
  );

  const handleEditSubmit = useCallback(
    async (id: string, input: UpdateShowInput) => {
      try {
        await updateMutation.mutateAsync({ id, input });
        toast({ title: "Success", description: "Show updated successfully" });
        setEditDialogOpen(false);
        setShowToEdit(null);
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to update show",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation]
  );

  const handleNavigateToShow = useCallback(
    (show: Show) => {
      onNavigateToShow?.(show.id);
    },
    [onNavigateToShow]
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
      <ShowList
        shows={shows}
        loading={isLoading}
        error={error as Error | null}
        onShowClick={handleNavigateToShow}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() => refetch()}
        isRefetching={isFetching}
      />

      <CreateShowDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateSubmit}
      />

      <EditShowDialog
        open={editDialogOpen && !!showToEdit}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setShowToEdit(null);
          }
        }}
        onSubmit={handleEditSubmit}
        show={showToEdit}
      />
    </>
  );
}
