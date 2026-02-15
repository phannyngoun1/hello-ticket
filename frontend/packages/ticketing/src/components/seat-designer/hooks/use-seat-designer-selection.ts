import { useState, useMemo, useCallback } from "react";
import type { SeatMarker, SectionMarker } from "../types";

export type UseSeatDesignerSelectionProps = {
    seats: SeatMarker[];
    sectionMarkers: SectionMarker[];
};

export function useSeatDesignerSelection({
    seats,
    sectionMarkers,
}: UseSeatDesignerSelectionProps) {
    const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
    const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);

    const [selectedSeat, setSelectedSeat] = useState<SeatMarker | null>(null);
    const [selectedSectionMarker, setSelectedSectionMarker] = useState<SectionMarker | null>(null);

    const handleSelectionChange = useCallback((
        newSelectedSeatIds: string[],
        newSelectedSectionIds: string[],
        currentSeats: SeatMarker[],
        currentSections: SectionMarker[]
    ) => {
        setSelectedSeatIds(newSelectedSeatIds);
        setSelectedSectionIds(newSelectedSectionIds);

        // Update single selection states based on arrays
        if (newSelectedSeatIds.length === 1) {
            const seat = currentSeats.find(s => s.id === newSelectedSeatIds[0]) || null;
            setSelectedSeat(seat);
        } else {
            setSelectedSeat(null);
        }

        if (newSelectedSectionIds.length === 1) {
            const section = currentSections.find(s => s.id === newSelectedSectionIds[0]) || null;
            setSelectedSectionMarker(section);
        } else {
            setSelectedSectionMarker(null);
        }
    }, []);

    const handleSeatClick = useCallback((seat: SeatMarker, e?: { shiftKey?: boolean; cancelBubble?: boolean }) => {
        if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
        const seatId = seat.id;
        const isShift = e?.shiftKey || false;

        setSelectedSeatIds((prev) => {
            if (isShift) {
                if (prev.includes(seatId)) {
                    const newIds = prev.filter((id) => id !== seatId);
                    handleSelectionChange(newIds, selectedSectionIds, seats, sectionMarkers);
                    return newIds;
                } else {
                    const newIds = [...prev, seatId];
                    handleSelectionChange(newIds, selectedSectionIds, seats, sectionMarkers);
                    return newIds;
                }
            } else {
                const newIds = [seatId];
                handleSelectionChange(newIds, [], seats, sectionMarkers);
                return newIds;
            }
        });
    }, [handleSelectionChange, selectedSectionIds, seats, sectionMarkers]);

    const handleSectionClick = useCallback((section: SectionMarker, e?: { shiftKey?: boolean; cancelBubble?: boolean }) => {
        if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
        const sectionId = section.id;
        const isShift = e?.shiftKey || false;

        setSelectedSectionIds((prev) => {
            if (isShift) {
                if (prev.includes(sectionId)) {
                    const newIds = prev.filter((id) => id !== sectionId);
                    handleSelectionChange(selectedSeatIds, newIds, seats, sectionMarkers);
                    return newIds;
                } else {
                    const newIds = [...prev, sectionId];
                    handleSelectionChange(selectedSeatIds, newIds, seats, sectionMarkers);
                    return newIds;
                }
            } else {
                const newIds = [sectionId];
                handleSelectionChange([], newIds, seats, sectionMarkers);
                return newIds;
            }
        });
    }, [handleSelectionChange, selectedSeatIds, seats, sectionMarkers]);

    const handleDeselect = useCallback(() => {
        setSelectedSeatIds([]);
        setSelectedSectionIds([]);
        setSelectedSeat(null);
        setSelectedSectionMarker(null);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedSeatIds([]);
        setSelectedSectionIds([]);
        setSelectedSeat(null);
        setSelectedSectionMarker(null);
    }, []);

    return {
        selectedSeatIds,
        setSelectedSeatIds, // Exposed for direct manipulation if needed
        selectedSectionIds,
        setSelectedSectionIds, // Exposed for direct manipulation if needed
        selectedSeat,
        setSelectedSeat,
        selectedSectionMarker,
        setSelectedSectionMarker,
        handleSelectionChange,
        handleSeatClick,
        handleSectionClick,
        handleDeselect,
        clearSelection
    };
}
