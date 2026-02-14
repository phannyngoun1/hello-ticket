import { useMemo } from "react";
import type { Layout, Section } from "../../../layouts/types";
import type { Seat } from "../../../seats/types";
import type { EventSeat } from "../../types";
import { EventSeatStatus as EventSeatStatusEnum } from "../../types";

export interface SectionStats {
    section: Section;
    totalSeats: number;
    eventSeats: EventSeat[];
    statusCounts: Record<string, number>;
    eventSeatCount: number;
}

export function useSectionStats(
    layout: Layout,
    sections: Section[],
    layoutSeats: Seat[],
    seatStatusMap: Map<string, EventSeat>,
    locationStatusMap: Map<string, EventSeat>,
    sectionNameMap: Map<string, string>,
) {
    return useMemo(() => {
        if (layout.design_mode !== "section-level") return new Map<string, SectionStats>();

        const stats = new Map<string, SectionStats>();

        sections.forEach((section) => {
            // Get all seats in this section
            const sectionSeats = layoutSeats.filter(
                (seat) => seat.section_id === section.id,
            );

            // Get all event seats for this section
            const sectionEventSeats: EventSeat[] = [];
            sectionSeats.forEach((seat) => {
                // Try by seat_id
                if (seat.id && seatStatusMap.has(seat.id)) {
                    sectionEventSeats.push(seatStatusMap.get(seat.id)!);
                } else if (seat.row && seat.seat_number) {
                    // Try by location
                    const sectionName = section.name;
                    const key = `${sectionName}|${seat.row}|${seat.seat_number}`;
                    const eventSeat = locationStatusMap.get(key);
                    if (eventSeat) {
                        sectionEventSeats.push(eventSeat);
                    }
                }
            });

            // Count statuses
            const statusCounts: Record<string, number> = {};

            // Initialize all statuses to 0
            Object.values(EventSeatStatusEnum).forEach((status) => {
                statusCounts[status] = 0;
            });

            sectionEventSeats.forEach((eventSeat) => {
                const status = eventSeat.status;
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });

            stats.set(section.id, {
                section,
                totalSeats: sectionSeats.length,
                eventSeats: sectionEventSeats,
                statusCounts,
                eventSeatCount: sectionEventSeats.length,
            });
        });

        return stats;
    }, [
        layout.design_mode,
        sections,
        layoutSeats,
        seatStatusMap,
        locationStatusMap,
        sectionNameMap,
    ]);
}
