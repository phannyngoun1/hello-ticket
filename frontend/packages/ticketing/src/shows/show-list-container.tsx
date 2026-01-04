/**
 * Show List Container
 *
 * Integrates the list, dialogs, and service hooks to manage shows.
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type { Show, CreateShowInput, UpdateShowInput, ShowFilter } from "./types";
import { ShowList } from "./show-list";
import { CreateShowDialog } from "./create-show-dialog";
import { EditShowDialog } from "./edit-show-dialog";
import {
  useShows,
  useCreateShow,
  useUpdateShow,
  useDeleteShow,
} from "./use-shows";
import { useShowService } from "./show-provider";
import { useOrganizerService } from "../organizers/organizer-provider";
import { useOrganizers } from "../organizers/use-organizers";

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
  const organizerService = useOrganizerService();

  const [filter, setFilter] = useState<ShowFilter>({});
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50 });
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

  const { data, isLoading, error } = useShows(showService, {
    filter,
    pagination,
  });

  // Fetch all organizers to map organizer_id to organizer name
  const { data: organizersData } = useOrganizers(organizerService, {
    pagination: { page: 1, pageSize: 1000 },
  });

  const createMutation = useCreateShow(showService);
  const updateMutation = useUpdateShow(showService);
  const deleteMutation = useDeleteShow(showService);

  const shows = data?.data ?? [];
  const paginationData = data?.pagination;

  // Map organizer_id to organizer name
  const organizerMap = useMemo(() => {
    const map = new Map<string, string>();
    organizersData?.data?.forEach((org) => {
      map.set(org.id, org.name);
    });
    return map;
  }, [organizersData]);

  // Enrich shows with organizer names
  const showsWithOrganizer = useMemo(() => {
    return shows.map((show) => ({
      ...show,
      organizerName: show.organizer_id ? organizerMap.get(show.organizer_id) : undefined,
    }));
  }, [shows, organizerMap]);

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  const handleEdit = useCallback((show: Show) => {
    setShowToEdit(show);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (show: Show) => {
      try {
        await deleteMutation.mutateAsync(show.id);
        toast({ title: "Success", description: "Show deleted successfully" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete show",
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
    async (input: CreateShowInput) => {
      try {
        await createMutation.mutateAsync(input);
        toast({ title: "Success", description: "Show created successfully" });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to create show",
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
          description: err instanceof Error ? err.message : "Failed to update show",
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
        shows={showsWithOrganizer}
        loading={isLoading}
        error={error as Error | null}
        onShowClick={handleNavigateToShow}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
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

