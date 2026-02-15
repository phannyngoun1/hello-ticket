/**
 * Layout Preview Dialog Component
 *
 * Shows a preview of the designed seat layout as it will appear during booking.
 * Displays all seats placed in the designer regardless of actual availability status.
 * Supports drilling down into sections to view section-specific seats.
 */

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@truths/ui";
import { ArrowLeft } from "lucide-react";
import { EventInventoryViewer } from "../event-inventory-viewer";
import type { Layout, Section } from "../../layouts/types";
import type { Seat } from "../../seats/types";
import type { EventSeat } from "../../events/types";

export interface LayoutPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: Layout | null | undefined;
  layoutSeats: Seat[];
  sections: Section[];
  imageUrl?: string;
}

export function LayoutPreviewDialog({
  open,
  onOpenChange,
  layout,
  layoutSeats,
  sections,
  imageUrl,
}: LayoutPreviewDialogProps) {
  const layoutName = layout?.name || "Layout";

  // Section drill-down state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );

  // Reset section selection when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedSectionId(null);
    }
  }, [open]);

  // Get selected section details
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === selectedSectionId),
    [sections, selectedSectionId],
  );

  // Filter seats and sections based on drill-down state
  const displayedSeats = useMemo(() => {
    if (selectedSectionId) {
      // Show only seats from the selected section
      return layoutSeats.filter(
        (seat) => seat.section_id === selectedSectionId,
      );
    }
    return layoutSeats;
  }, [layoutSeats, selectedSectionId]);

  const displayedSections = useMemo(() => {
    if (selectedSectionId) {
      // Show only the selected section when drilled down
      return sections.filter((s) => s.id === selectedSectionId);
    }
    return sections;
  }, [sections, selectedSectionId]);

  // Determine image URL based on drill-down state
  const displayedImageUrl = useMemo(() => {
    if (selectedSection?.image_url) {
      return selectedSection.image_url;
    }
    return imageUrl;
  }, [selectedSection, imageUrl]);

  // Create event seats from layout seats to visualize the layout
  // All seats shown as available since this is just a design preview
  const eventSeats: EventSeat[] = useMemo(
    () =>
      displayedSeats.map(
        (seat) =>
          ({
            id: `preview-${seat.id}`,
            tenant_id: seat.tenant_id,
            event_id: "preview-event",
            seat_id: seat.id,
            section_name: seat.section_name || undefined,
            row_name: seat.row || undefined,
            seat_number: seat.seat_number || undefined,
            status: "AVAILABLE" as const, // Show all designed seats
            ticket_price: 0, // No price in preview
            ticket_number: undefined,
            attributes: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }) as unknown as EventSeat,
      ),
    [displayedSeats],
  );

  // Create status maps for EventInventoryViewer
  const seatStatusMap = useMemo(() => {
    const map = new Map<string, EventSeat>();
    eventSeats.forEach((eventSeat) => {
      if (eventSeat.seat_id) {
        map.set(eventSeat.seat_id, eventSeat);
      }
    });
    return map;
  }, [eventSeats]);

  const locationStatusMap = useMemo(() => {
    const map = new Map<string, EventSeat>();
    eventSeats.forEach((eventSeat) => {
      if (
        eventSeat.section_name &&
        eventSeat.row_name &&
        eventSeat.seat_number
      ) {
        const key = `${eventSeat.section_name}|${eventSeat.row_name}|${eventSeat.seat_number}`;
        map.set(key, eventSeat);
      }
    });
    return map;
  }, [eventSeats]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {selectedSection
                    ? `Section: ${selectedSection.name}`
                    : `Layout Preview - ${layoutName}`}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedSection
                    ? "Click the back button to return to full layout view"
                    : layout?.design_mode === "section-level"
                      ? "Click on a section to view its seats"
                      : "Preview all designed seats as they will appear during booking"}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6 bg-muted/20">
            <div className="h-full relative">
              {selectedSection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSectionId(null)}
                  className="absolute left-4 top-4 h-9 px-3 gap-2 rounded-full bg-background/90 text-foreground border border-border shadow-sm hover:bg-background"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              )}
              {layout ? (
                <EventInventoryViewer
                  data={{
                    layout,
                    layoutSeats: displayedSeats,
                    sections: displayedSections,
                    eventSeats,
                    seatStatusMap,
                    locationStatusMap,
                  }}
                  display={{
                    imageUrl: displayedImageUrl,
                    showLegend: false,
                  }}
                  selection={{
                    selectedSeatIds: new Set(),
                    selectedSectionId,
                    onSelectedSectionIdChange: setSelectedSectionId,
                  }}
                  interaction={{ onSeatClick: () => {} }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No layout data available for preview
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
