import { EventInventoryViewer } from "@truths/ticketing/events/event-inventory-viewer";
import { EventSeatList } from "@truths/ticketing/events/event-seat-list";
import type { EventSeat } from "@truths/ticketing/events/types";
import type { Layout, Section } from "@truths/ticketing/layouts/types";
import type { Seat } from "@truths/ticketing/seats/types";
import { BookingTicket } from "../types";

export interface LayoutWithSeats {
  layout: Layout;
  seats: Seat[];
  sections: Section[];
}

interface BookingSeatSelectionProps {
  selectedEventId: string | null;
  seatViewMode: "visualization" | "list";
  layoutWithSeats: LayoutWithSeats | null | undefined;
  eventSeats: EventSeat[];
  seatStatusMap: Map<string, EventSeat>;
  locationStatusMap: Map<string, EventSeat>;
  onSeatClick: (seat: any) => void;
  selectedTickets: BookingTicket[];
  selectedSectionId: string | null;
  onSelectedSectionIdChange: (id: string | null) => void;
  onListSeatSelect: (eventSeat: EventSeat, checked: boolean) => void;
  onAddSeatsToBooking: (seatIds: string[]) => void;
}

export function BookingSeatSelection({
  selectedEventId,
  seatViewMode,
  layoutWithSeats,
  eventSeats,
  seatStatusMap,
  locationStatusMap,
  onSeatClick,
  selectedTickets,
  selectedSectionId,
  onSelectedSectionIdChange,
  onListSeatSelect,
  onAddSeatsToBooking,
}: BookingSeatSelectionProps) {
  return (
    <div className="pr-1 flex-1">
      {!selectedEventId ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a show and event to view seats
        </div>
      ) : seatViewMode === "visualization" ? (
        layoutWithSeats ? (
          <div className="h-full overflow-hidden">
            <EventInventoryViewer
              layout={layoutWithSeats.layout}
              layoutSeats={layoutWithSeats.seats}
              sections={layoutWithSeats.sections}
              eventSeats={eventSeats}
              seatStatusMap={seatStatusMap}
              locationStatusMap={locationStatusMap}
              imageUrl={layoutWithSeats.layout.image_url}
              onSeatClick={onSeatClick}
              selectedSeatIds={
                new Set(
                  selectedTickets
                    .map((t) => {
                      // Find the seat ID from layout seats
                      if (t.sectionName && t.rowName && t.seatNumber) {
                        const seat = layoutWithSeats.seats.find(
                          (s) =>
                            s.section_name === t.sectionName &&
                            s.row === t.rowName &&
                            s.seat_number === t.seatNumber
                        );
                        return seat?.id;
                      }
                      return t.seatId;
                    })
                    .filter(Boolean) as string[]
                )
              }
              selectedSectionId={selectedSectionId}
              onSelectedSectionIdChange={onSelectedSectionIdChange}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No layout available for this event
          </div>
        )
      ) : (
        <div className="h-full overflow-y-auto p-4">
          <EventSeatList
            eventSeats={eventSeats}
            onSeatSelect={onListSeatSelect}
            selectedSeatIds={undefined}
            showSelection={true}
            onAddToBooking={onAddSeatsToBooking}
            showAddToBooking={true}
            bookedSeatIds={new Set(selectedTickets.map((t) => t.eventSeatId))}
          />
        </div>
      )}
    </div>
  );
}
