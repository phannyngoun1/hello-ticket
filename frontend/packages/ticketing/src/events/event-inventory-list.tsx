import { Card } from "@truths/ui";
import { useEventService } from "./event-provider";
import {
  useEvent,
  useEventSeats,
  useDeleteEventSeats,
  useCreateTicketsFromSeats,
} from "./use-events";
import { EventSeatList } from "./event-seat-list";

export interface EventInventoryListProps {
  eventId: string;
  className?: string;
}

export function EventInventoryList({
  eventId,
  className,
}: EventInventoryListProps) {
  const eventService = useEventService();

  // Fetch event data
  const {
    data: event,
    isLoading: eventLoading,
    error: eventError,
  } = useEvent(eventService, eventId);

  // Fetch event seats
  const {
    data: eventSeatsData,
    isLoading: seatsLoading,
    refetch: refetchSeats,
  } = useEventSeats(eventService, eventId, { skip: 0, limit: 1000 });

  const deleteSeatsMutation = useDeleteEventSeats(eventService);
  const createTicketsMutation = useCreateTicketsFromSeats(eventService);

  const eventSeats = eventSeatsData?.data || [];

  const handleDeleteSeats = async (seatIds: string[]) => {
    if (!event?.id || seatIds.length === 0) return;
    try {
      await deleteSeatsMutation.mutateAsync({ eventId: event.id, seatIds });
      await refetchSeats();
    } catch (err) {
      console.error("Failed to delete seats:", err);
      throw err;
    }
  };

  const handleCreateTickets = async (
    seatIds: string[],
    ticketPrice: number
  ) => {
    if (!event?.id || seatIds.length === 0) return;
    try {
      await createTicketsMutation.mutateAsync({
        eventId: event.id,
        seatIds,
        ticketPrice,
      });
      await refetchSeats();
    } catch (err) {
      console.error("Failed to create tickets:", err);
      throw err;
    }
  };

  if (eventLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading event...</div>
        </div>
      </Card>
    );
  }

  if (eventError) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">
            Error loading event: {eventError.message}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <EventSeatList
          eventSeats={eventSeats}
          isLoading={seatsLoading}
          onDelete={handleDeleteSeats}
          onCreateTickets={handleCreateTickets}
          onRefresh={refetchSeats}
        />
      </div>
    </Card>
  );
}
