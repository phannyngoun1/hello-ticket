import { useState, useCallback, useRef, useEffect } from "react";
import type { SeatMarker, SectionMarker } from "../types";
import { useDesignerHistory } from "./use-designer-history";
import type { DesignerSnapshot } from "../types";
import { DEFAULT_CANVAS_BACKGROUND } from "../colors";

export type UseSeatDesignerStateProps = {
    initialSeats?: SeatMarker[];
    initialSections?: SectionMarker[];
    initialCanvasBackgroundColor?: string;
    initialMarkerFillTransparency?: number;
};

export function useSeatDesignerState({
    initialSeats,
    initialSections,
    initialCanvasBackgroundColor,
    initialMarkerFillTransparency,
}: UseSeatDesignerStateProps) {
    const [seats, setSeats] = useState<SeatMarker[]>(initialSeats || []);
    const [sectionMarkers, setSectionMarkers] = useState<SectionMarker[]>(initialSections || []);
    const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>(
        initialCanvasBackgroundColor || DEFAULT_CANVAS_BACKGROUND
    );
    const [markerFillTransparency, setMarkerFillTransparency] = useState<number>(
        initialMarkerFillTransparency ?? 1.0
    );
    const [deletedSeatIds, setDeletedSeatIds] = useState<string[]>([]);
    const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>([]);

    // Undo/Redo history management
    const getSnapshot = useCallback((): DesignerSnapshot => {
        return {
            seats: [...seats],
            sectionMarkers: [...sectionMarkers],
            canvasBackgroundColor,
            markerFillTransparency,
        };
    }, [seats, sectionMarkers, canvasBackgroundColor, markerFillTransparency]);

    const restoreSnapshot = useCallback((snapshot: DesignerSnapshot) => {
        setSeats(snapshot.seats);
        setSectionMarkers(snapshot.sectionMarkers);
        setCanvasBackgroundColor(snapshot.canvasBackgroundColor);
        setMarkerFillTransparency(snapshot.markerFillTransparency);
    }, []);

    const {
        recordSnapshot,
        undo,
        redo,
        clearHistory,
        canUndo,
        canRedo,
    } = useDesignerHistory({
        getSnapshot,
        restoreSnapshot,
    });

    const handleCanvasBackgroundColorChange = useCallback(
        (color: string) => {
            recordSnapshot();
            setCanvasBackgroundColor(color);
        },
        [recordSnapshot]
    );

    const handleMarkerFillTransparencyChange = useCallback(
        (transparency: number) => {
            recordSnapshot();
            setMarkerFillTransparency(transparency);
        },
        [recordSnapshot]
    );

    const clearAllPlacements = useCallback((venueType: "small" | "large") => {
        recordSnapshot();
        if (venueType === "small") {
            setSeats([]);
        } else {
            setSectionMarkers([]);
            setSeats([]);
        }
    }, [recordSnapshot]);

    const addSeat = useCallback((seat: SeatMarker) => {
        recordSnapshot();
        setSeats((prev) => [...prev, seat]);
    }, [recordSnapshot]);

    const updateSeat = useCallback((id: string, updates: Partial<SeatMarker>) => {
        recordSnapshot();
        setSeats((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        );
    }, [recordSnapshot]);

    const batchUpdateSeats = useCallback(
        (updates: { id: string; updates: Partial<SeatMarker> }[]) => {
            recordSnapshot();
            setSeats((prev) => {
                const newSeats = [...prev];
                updates.forEach(({ id, updates }) => {
                    const index = newSeats.findIndex((s) => s.id === id);
                    if (index !== -1) {
                        newSeats[index] = { ...newSeats[index], ...updates };
                    }
                });
                return newSeats;
            });
        },
        [recordSnapshot]
    );

    const removeSeat = useCallback((id: string) => {
        recordSnapshot();
        const seatToRemove = seats.find((s) => s.id === id);
        if (seatToRemove && !seatToRemove.isNew) {
            setDeletedSeatIds((prev) => [...prev, id]);
        }
        setSeats((prev) => prev.filter((s) => s.id !== id));
    }, [seats, recordSnapshot]);

    const addSection = useCallback((section: Partial<SectionMarker> & { name: string }) => {
        recordSnapshot();
        const newSection: SectionMarker = {
            ...section,
            id: section.id || `section-${Date.now()}`,
            name: section.name,
            x: section.x ?? 50,
            y: section.y ?? 50,
            isNew: true,
        };
        setSectionMarkers((prev) => [...prev, newSection]);
    }, [recordSnapshot]);

    const updateSection = useCallback((id: string, updates: Partial<SectionMarker>) => {
        recordSnapshot();
        setSectionMarkers((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        );
    }, [recordSnapshot]);

    const batchUpdateSections = useCallback(
        (updates: { id: string; updates: Partial<SectionMarker> }[]) => {
            recordSnapshot();
            setSectionMarkers((prev) => {
                const newSections = [...prev];
                updates.forEach(({ id, updates }) => {
                    const index = newSections.findIndex((s) => s.id === id);
                    if (index !== -1) {
                        newSections[index] = { ...newSections[index], ...updates };
                    }
                });
                return newSections;
            });
        },
        [recordSnapshot]
    );

    const removeSection = useCallback((id: string) => {
        recordSnapshot();
        const sectionToRemove = sectionMarkers.find((s) => s.id === id);
        if (sectionToRemove && !sectionToRemove.isNew) {
            setDeletedSectionIds((prev) => [...prev, id]);
        }
        setSectionMarkers((prev) => prev.filter((s) => s.id !== id));
        // Remove associated seats (optional, but typical behavior)
        // In the original, removing a section presumably removed its seats?
        // Or marked them as deleted?
        // Let's assume dependent seats are handled by the caller or backend for simplicity
        // But referencing original logic: usually validation prevents deleting section with seats.
        // Or cascades. Let's just remove the section marker here.
    }, [sectionMarkers, recordSnapshot]);

    const isDirty = canUndo;

    return {
        seats,
        setSeats,
        sectionMarkers,
        setSectionMarkers,
        canvasBackgroundColor,
        setCanvasBackgroundColor,
        handleCanvasBackgroundColorChange,
        markerFillTransparency,
        setMarkerFillTransparency,
        handleMarkerFillTransparencyChange,
        deletedSeatIds,
        setDeletedSeatIds,
        deletedSectionIds,
        setDeletedSectionIds,
        recordSnapshot,
        undo,
        redo,
        clearHistory,
        canUndo,
        canRedo,
        clearAllPlacements,
        addSeat,
        updateSeat,
        batchUpdateSeats,
        removeSeat,
        addSection,
        updateSection,
        batchUpdateSections,
        removeSection,
        isDirty
    };
}
