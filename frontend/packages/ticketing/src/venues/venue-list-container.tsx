/**
 * Venue List Container
 *
 * Integrates the list, dialogs, and service hooks to manage venues.
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type { Venue, CreateVenueInput, UpdateVenueInput, VenueFilter } from "./types";
import { VenueList } from "./venue-list";
import { CreateVenueDialog } from "./create-venue-dialog";
import { EditVenueDialog } from "./edit-venue-dialog";
import {
  useVenues,
  useCreateVenue,
  useUpdateVenue,
  useDeleteVenue,
} from "./use-venues";
import { useVenueService } from "./venue-provider";

export interface VenueListContainerProps {
  onNavigateToVenue?: (id: string) => void;
  onNavigateToCreate?: () => void;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function VenueListContainer({
  onNavigateToVenue,
  onNavigateToCreate,
  autoOpenCreate,
  onCreateDialogClose,
}: VenueListContainerProps) {
  const venueService = useVenueService();

  const [filter, setFilter] = useState<VenueFilter>({});
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [venueToEdit, setVenueToEdit] = useState<Venue | null>(null);
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error, refetch, isFetching } = useVenues(
    venueService,
    { filter, pagination }
  );

  const createMutation = useCreateVenue(venueService);
  const updateMutation = useUpdateVenue(venueService);
  const deleteMutation = useDeleteVenue(venueService);

  const venues = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  const handleEdit = useCallback((venue: Venue) => {
    setVenueToEdit(venue);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (venue: Venue) => {
      try {
        await deleteMutation.mutateAsync(venue.id);
        toast({ title: "Success", description: "Venue deleted successfully" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete venue",
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
    async (input: CreateVenueInput) => {
      try {
        await createMutation.mutateAsync(input);
        toast({ title: "Success", description: "Venue created successfully" });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to create venue",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createMutation, onCreateDialogClose]
  );

  const handleEditSubmit = useCallback(
    async (id: string, input: UpdateVenueInput) => {
      try {
        await updateMutation.mutateAsync({ id, input });
        toast({ title: "Success", description: "Venue updated successfully" });
        setEditDialogOpen(false);
        setVenueToEdit(null);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update venue",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation]
  );

  const handleNavigateToVenue = useCallback(
    (venue: Venue) => {
      onNavigateToVenue?.(venue.id);
    },
    [onNavigateToVenue]
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
      <VenueList
        venues={venues}
        loading={isLoading}
        error={error as Error | null}
        onVenueClick={handleNavigateToVenue}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() => refetch()}
        isRefetching={isFetching}
      />

      <CreateVenueDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateSubmit}
      />

      <EditVenueDialog
        open={editDialogOpen && !!venueToEdit}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setVenueToEdit(null);
          }
        }}
        onSubmit={handleEditSubmit}
        venue={venueToEdit}
      />
    </>
  );
}

