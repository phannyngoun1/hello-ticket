/**
 * Event List Container Component
 *
 * Container component that manages event list state and operations.
 * Handles pagination, filtering, and CRUD operations.
 */

import { useState, useCallback } from "react";
import { EventList } from "./event-list";
import { CreateEventDialog } from "./create-event-dialog";
import { EditEventDialog } from "./edit-event-dialog";
import { EventDetail } from "./event-detail";
import { useEventService } from "./event-provider";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useEvent,
} from "./use-events";
import { Sheet, SheetContent } from "@truths/ui";
import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
  EventStatus,
} from "./types";

export interface EventListContainerProps {
  showId: string;
  className?: string;
  onNavigateToEvent?: (eventId: string) => void;
  onNavigateToCreate?: () => void;
}

export function EventListContainer({
  showId,
  className,
  onNavigateToEvent,
  onNavigateToCreate,
}: EventListContainerProps) {
  const service = useEventService();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data, isLoading, error } = useEvents(service, {
    filter: {
      show_id: showId,
      search: search || undefined,
    },
    pagination: {
      page,
      pageSize,
      total: 0,
      totalPages: 0,
    },
  });

  const createMutation = useCreateEvent(service);
  const updateMutation = useUpdateEvent(service);
  const deleteMutation = useDeleteEvent(service);

  const handleCreate = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(
    async (input: CreateEventInput) => {
      await createMutation.mutateAsync(input);
      setCreateDialogOpen(false);
    },
    [createMutation]
  );

  const handleEdit = useCallback((event: Event) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  }, []);

  const handleEditSubmit = useCallback(
    async (id: string, input: UpdateEventInput) => {
      await updateMutation.mutateAsync({ id, input });
      setEditDialogOpen(false);
      setSelectedEvent(null);
    },
    [updateMutation]
  );

  const handleDelete = useCallback(
    async (event: Event) => {
      await deleteMutation.mutateAsync(event.id);
    },
    [deleteMutation]
  );

  const handleStatusChange = useCallback(
    async (event: Event, newStatus: EventStatus) => {
      await updateMutation.mutateAsync({
        id: event.id,
        input: { status: newStatus },
      });
    },
    [updateMutation]
  );

  const handleEventClick = useCallback(
    (event: Event) => {
      // Open detail sheet instead of navigating
      setSelectedEventId(event.id);
      setDetailSheetOpen(true);

      // Also call the navigation callback if provided (for backward compatibility)
      if (onNavigateToEvent) {
        onNavigateToEvent(event.id);
      }
    },
    [onNavigateToEvent]
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1); // Reset to first page when search changes
  }, []);

  const handleCreateDialogClose = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedEvent(null);
  }, []);

  const handleDetailSheetClose = useCallback(() => {
    setDetailSheetOpen(false);
    setSelectedEventId(null);
  }, []);

  // Fetch event detail when sheet is open
  const {
    data: eventDetail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useEvent(service, selectedEventId);

  return (
    <div className={className}>
      <EventList
        events={data?.data || []}
        loading={isLoading}
        error={error as Error | null}
        pagination={data?.pagination}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onEventClick={handleEventClick}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isDeleting={deleteMutation.isPending}
      />

      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={handleCreateDialogClose}
        onSubmit={handleCreateSubmit}
        showId={showId}
      />

      {selectedEvent && (
        <EditEventDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
          onSubmit={handleEditSubmit}
          event={selectedEvent}
        />
      )}

      {/* Event Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={handleDetailSheetClose}>
        <SheetContent
          side="right"
          className="w-[600px] sm:w-[740px] sm:max-w-[740px] flex flex-col p-0"
          style={{ width: "600px", maxWidth: "740px" }}
        >
          <div className="flex-1 overflow-y-auto p-6">
            <EventDetail
              data={eventDetail || undefined}
              loading={isLoadingDetail}
              error={detailError as Error | null}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
