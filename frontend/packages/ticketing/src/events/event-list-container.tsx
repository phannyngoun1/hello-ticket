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
import { EventDetailSheet } from "./event-detail-sheet";
import { useEventService } from "./event-provider";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useEvent,
} from "./use-events";

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
  onNavigateToInventory?: (eventId: string) => void;
  onNavigateToVenue?: (venueId: string) => void;
}

export function EventListContainer({
  showId,
  className,
  onNavigateToEvent,
  onNavigateToInventory,
  onNavigateToVenue,
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
    [createMutation],
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
    [updateMutation],
  );

  const handleDelete = useCallback(
    async (event: Event) => {
      await deleteMutation.mutateAsync(event.id);
    },
    [deleteMutation],
  );

  const handleStatusChange = useCallback(
    async (event: Event, newStatus: EventStatus) => {
      await updateMutation.mutateAsync({
        id: event.id,
        input: { status: newStatus },
      });
    },
    [updateMutation],
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
    [onNavigateToEvent],
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

  const handleManageInventory = useCallback(
    (event: Event) => {
      if (onNavigateToInventory) {
        onNavigateToInventory(event.id);
      } else {
        // Fallback to window.location if no callback provided
        window.location.href = `/ticketing/events/${event.id}/inventory`;
      }
    },
    [onNavigateToInventory],
  );

  const handleVenueClick = useCallback(
    (venueId: string) => {
      if (onNavigateToVenue) {
        onNavigateToVenue(venueId);
      } else {
        // Fallback to window.location if no callback provided
        window.location.href = `/ticketing/venues/${venueId}`;
      }
    },
    [onNavigateToVenue],
  );

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
        onManageInventory={handleManageInventory}
        onStatusChange={handleStatusChange}
        onEventClick={handleEventClick}
        onVenueClick={handleVenueClick}
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
      <EventDetailSheet
        open={detailSheetOpen}
        onOpenChange={handleDetailSheetClose}
        data={eventDetail || undefined}
        loading={isLoadingDetail}
        error={detailError as Error | null}
      />
    </div>
  );
}
