/**
 * Types for Seat Designer
 */

import { SeatType } from "../types";

export interface SeatDesignerProps {
  venueId: string;
  layoutId: string;
  layoutName?: string;
  imageUrl?: string;
  designMode?: "seat-level" | "section-level";
  initialSeats?: Array<{
    id: string;
    section_id: string;
    section_name?: string;
    row: string;
    seat_number: string;
    seat_type: string;
    x_coordinate?: number | null;
    y_coordinate?: number | null;
  }>;
  initialSections?: Array<{
    id: string;
    name: string;
    x_coordinate?: number | null;
    y_coordinate?: number | null;
    file_id?: string | null;
    image_url?: string | null;
  }>;
  onImageUpload?: (url: string) => void;
  className?: string;
  fileId?: string;
}

export interface SectionMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  imageUrl?: string;
  isNew?: boolean;
}

export interface SeatInfo {
  section: string;
  sectionId?: string;
  row: string;
  seatNumber: string;
  seatType: SeatType;
}

export interface SeatMarker {
  id: string;
  x: number;
  y: number;
  seat: SeatInfo;
  isNew?: boolean;
}

