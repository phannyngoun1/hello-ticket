import { useState, useCallback, useEffect } from "react";
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

    // Sync selected markers when underlying data changes (e.g. after name edit)
    // or when selection changes (e.g. rect/multi-select) - preserve multi-select by clearing
    // single-selection state when count !== 1
    useEffect(() => {
        if (selectedSeatIds.length === 1) {
            const seat = seats.find((s) => s.id === selectedSeatIds[0]) ?? null;
            setSelectedSeat(seat);
        } else {
            setSelectedSeat(null);
        }
        if (selectedSectionIds.length === 1) {
            const section = sectionMarkers.find((s) => s.id === selectedSectionIds[0]) ?? null;
            setSelectedSectionMarker(section);
        } else {
            setSelectedSectionMarker(null);
        }
    }, [seats, sectionMarkers, selectedSeatIds, selectedSectionIds]);

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

    // Update only derived state (selectedSeat, selectedSectionMarker) - used from inside
    // setState callbacks to avoid nested setState which corrupts shift+select
    const updateDerivedSelection = useCallback((
        newSeatIds: string[],
        newSectionIds: string[],
    ) => {
        if (newSeatIds.length === 1) {
            const seat = seats.find((s) => s.id === newSeatIds[0]) ?? null;
            setSelectedSeat(seat);
        } else {
            setSelectedSeat(null);
        }
        if (newSectionIds.length === 1) {
            const section = sectionMarkers.find((s) => s.id === newSectionIds[0]) ?? null;
            setSelectedSectionMarker(section);
        } else {
            setSelectedSectionMarker(null);
        }
    }, [seats, sectionMarkers]);

    const handleSeatClick = useCallback((seat: SeatMarker, e?: { shiftKey?: boolean; cancelBubble?: boolean }) => {
        if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
        const seatId = seat.id;
        const isShift = e?.shiftKey || false;

        setSelectedSeatIds((prev) => {
            let newIds: string[];
            if (isShift) {
                if (prev.includes(seatId)) {
                    newIds = prev.filter((id) => id !== seatId);
                } else {
                    newIds = [...prev, seatId];
                }
            } else {
                newIds = [seatId];
            }
            updateDerivedSelection(newIds, isShift ? selectedSectionIds : []);
            return newIds;
        });
        if (!isShift) {
            setSelectedSectionIds([]);
        }
    }, [updateDerivedSelection, selectedSectionIds]);

    const handleSectionClick = useCallback((section: SectionMarker, e?: { shiftKey?: boolean; cancelBubble?: boolean }) => {
        if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
        const sectionId = section.id;
        const isShift = e?.shiftKey || false;

        setSelectedSectionIds((prev) => {
            let newIds: string[];
            if (isShift) {
                if (prev.includes(sectionId)) {
                    newIds = prev.filter((id) => id !== sectionId);
                } else {
                    newIds = [...prev, sectionId];
                }
            } else {
                newIds = [sectionId];
            }
            updateDerivedSelection(isShift ? selectedSeatIds : [], newIds);
            return newIds;
        });
        if (!isShift) {
            setSelectedSeatIds([]);
        }
    }, [updateDerivedSelection, selectedSeatIds]);

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
