/**
 * Data loading and syncing for Seat Designer.
 * Handles loading seats and sections from API or initial props, and syncing to local state.
 */

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { seatService } from "../../seat-service";
import { sectionService } from "../../../sections/section-service";
import { SeatType } from "../../types";
import type { SectionMarker, SeatMarker } from "../types";
import { PlacementShapeType, type PlacementShape } from "../types";

export interface UseDesignerDataParams {
  layoutId: string;
  designMode: "seat-level" | "section-level";
  initialSeats?: Array<{
    id: string;
    section_id: string;
    section_name?: string;
    row: string;
    seat_number: string;
    seat_type: string;
    x_coordinate?: number | null;
    y_coordinate?: number | null;
    shape?: string | null;
  }>;
  initialSections?: Array<{
    id: string;
    name: string;
    x_coordinate?: number | null;
    y_coordinate?: number | null;
    file_id?: string | null;
    image_url?: string | null;
    canvas_background_color?: string | null;
    marker_fill_transparency?: number | null;
    shape?: string | null;
  }>;
  setSeats: React.Dispatch<React.SetStateAction<SeatMarker[]>>;
  setSectionMarkers: React.Dispatch<React.SetStateAction<SectionMarker[]>>;
}

function parseSeatShape(shapeJson: string | null | undefined): PlacementShape | undefined {
  if (!shapeJson) return undefined;
  try {
    const parsed = JSON.parse(shapeJson);
    if (parsed && typeof parsed === "object" && parsed.type) {
      return { ...parsed, type: parsed.type as PlacementShapeType };
    }
  } catch (e) {
    console.error("Failed to parse seat shape:", e);
  }
  return undefined;
}

function parseSectionShape(shapeJson: string | null | undefined): PlacementShape | undefined {
  if (!shapeJson) return undefined;
  try {
    const parsed = JSON.parse(shapeJson);
    if (parsed && typeof parsed === "object" && parsed.type) {
      return { ...parsed, type: parsed.type as PlacementShapeType };
    }
  } catch (e) {
    console.error("Failed to parse section shape:", e);
  }
  return undefined;
}

export function useDesignerData({
  layoutId,
  designMode,
  initialSeats,
  initialSections,
  setSeats,
  setSectionMarkers,
}: UseDesignerDataParams) {
  const { data: existingSeats, isLoading, error: seatsError } = useQuery({
    queryKey: ["seats", layoutId],
    queryFn: () => seatService.getByLayout(layoutId),
    enabled: !!layoutId && !initialSeats,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: sectionsData } = useQuery({
    queryKey: ["sections", "layout", layoutId],
    queryFn: () => sectionService.getByLayout(layoutId),
    enabled: !!layoutId && !initialSections,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const effectiveSectionsData = (initialSections || sectionsData) as typeof sectionsData;
  const lastInitialSeatsRef = useRef<typeof initialSeats>();
  const lastExistingSeatsRef = useRef<typeof existingSeats>();

  // Load sections when initialSections provided
  useEffect(() => {
    if (initialSections && designMode === "section-level") {
      const markers: SectionMarker[] = initialSections.map((section) => {
        const sectionWithExtras = section as {
          file_id?: string | null;
          canvas_background_color?: string | null;
          marker_fill_transparency?: number | null;
        };
        return {
          id: section.id,
          name: section.name,
          x: section.x_coordinate || 50,
          y: section.y_coordinate || 50,
          imageUrl: section.image_url || undefined,
          file_id: sectionWithExtras.file_id ?? undefined,
          canvasBackgroundColor:
            sectionWithExtras.canvas_background_color !== undefined &&
            sectionWithExtras.canvas_background_color !== null
              ? sectionWithExtras.canvas_background_color
              : undefined,
          markerFillTransparency:
            sectionWithExtras.marker_fill_transparency !== undefined &&
            sectionWithExtras.marker_fill_transparency !== null
              ? sectionWithExtras.marker_fill_transparency
              : undefined,
          shape: parseSectionShape(section.shape),
          isNew: false,
        };
      });
      setSectionMarkers(markers);
    }
  }, [initialSections, designMode, setSectionMarkers]);

  // Load sections from API when initialSections not provided
  useEffect(() => {
    if (
      !initialSections &&
      effectiveSectionsData !== undefined &&
      designMode === "section-level"
    ) {
      const markers: SectionMarker[] = effectiveSectionsData.map((section: { id: string; name: string; x_coordinate?: number | null; y_coordinate?: number | null; image_url?: string | null; shape?: string | null; canvas_background_color?: string | null; marker_fill_transparency?: number | null }) => {
        const sectionWithFileId = section as { file_id?: string | null };
        return {
          id: section.id,
          name: section.name,
          x: section.x_coordinate || 50,
          y: section.y_coordinate || 50,
          imageUrl: section.image_url || undefined,
          file_id: sectionWithFileId.file_id ?? undefined,
          canvasBackgroundColor:
            section.canvas_background_color !== undefined &&
            section.canvas_background_color !== null
              ? section.canvas_background_color
              : undefined,
          markerFillTransparency:
            section.marker_fill_transparency !== undefined &&
            section.marker_fill_transparency !== null
              ? section.marker_fill_transparency
              : undefined,
          shape: parseSectionShape(section.shape),
          isNew: false,
        };
      });
      setSectionMarkers(markers);
    }
  }, [effectiveSectionsData, initialSections, designMode, setSectionMarkers]);

  // Load seats when initialSeats or existingSeats changes
  useEffect(() => {
    const initialSeatsChanged = initialSeats !== lastInitialSeatsRef.current;
    const existingSeatsChanged = existingSeats !== lastExistingSeatsRef.current;

    if (
      !initialSeatsChanged &&
      !existingSeatsChanged &&
      lastInitialSeatsRef.current !== undefined
    ) {
      return;
    }

    if (initialSeats) {
      lastInitialSeatsRef.current = initialSeats;
      if (initialSeats.length > 0) {
        const markers: SeatMarker[] = initialSeats.map((seat) => ({
          id: seat.id,
          x: seat.x_coordinate || 0,
          y: seat.y_coordinate || 0,
          seat: {
            section: seat.section_name || seat.section_id || "Unknown",
            sectionId: seat.section_id,
            row: seat.row,
            seatNumber: seat.seat_number,
            seatType: seat.seat_type as SeatType,
          },
          shape: parseSeatShape(seat.shape),
        }));
        setSeats(markers);
      } else {
        setSeats([]);
      }
    } else if (existingSeats) {
      lastExistingSeatsRef.current = existingSeats;
      if (existingSeats.items && existingSeats.items.length > 0) {
        const markers: SeatMarker[] = existingSeats.items.map((seat: { id: string; x_coordinate?: number | null; y_coordinate?: number | null; section_id: string; section_name?: string; row: string; seat_number: string; seat_type: string; shape?: string | null }) => ({
          id: seat.id,
          x: seat.x_coordinate || 0,
          y: seat.y_coordinate || 0,
          seat: {
            section: seat.section_name || seat.section_id || "Unknown",
            sectionId: seat.section_id,
            row: seat.row,
            seatNumber: seat.seat_number,
            seatType: seat.seat_type as SeatType,
          },
          shape: parseSeatShape(seat.shape),
        }));
        setSeats(markers);
      } else if (
        lastInitialSeatsRef.current === undefined &&
        lastExistingSeatsRef.current === undefined
      ) {
        setSeats([]);
      }
    } else if (
      !isLoading &&
      !seatsError &&
      !initialSeats &&
      lastInitialSeatsRef.current === undefined &&
      lastExistingSeatsRef.current === undefined
    ) {
      setSeats([]);
    }
  }, [existingSeats, initialSeats, isLoading, seatsError, setSeats]);

  return {
    isLoading,
    seatsError,
    effectiveSectionsData: effectiveSectionsData ?? undefined,
  };
}
