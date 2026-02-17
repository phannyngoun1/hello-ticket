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
import {
  useOrganizers,
  useCreateOrganizer,
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
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error, refetch, isFetching } = useOrganizers(
    organizerService,
    { filter, pagination }
  );

  const createMutation = useCreateOrganizer(organizerService);

  const organizers = data?.data ?? [];
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
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() => refetch()}
        isRefetching={isFetching}
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

    </>
  );
}

