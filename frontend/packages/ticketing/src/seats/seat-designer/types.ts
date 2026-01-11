/**
 * Types for Seat Designer
 */

import { SeatType } from "../types";

/**
 * Shape types for placement marks
 */
export enum PlacementShapeType {
  CIRCLE = "circle",
  RECTANGLE = "rectangle",
  ELLIPSE = "ellipse",
  POLYGON = "polygon",
  FREEFORM = "freeform",
}

/**
 * Shape properties for placement marks
 */
export interface PlacementShape {
  type: PlacementShapeType;
  // For circle: radius
  // For rectangle/ellipse: width and height
  // For polygon: array of points relative to center
  // For freeform: array of [x, y] pairs as percentages (path points)
  width?: number; // Percentage of image width
  height?: number; // Percentage of image height
  radius?: number; // Percentage of image (for circle)
  points?: number[]; // Array of [x, y] pairs as percentages (for polygon/freeform)
  rotation?: number; // Rotation in degrees
  cornerRadius?: number; // For rounded rectangles
}

export interface SeatDesignerProps {
  venueId: string;
  layoutId: string;
  layoutName?: string;
  imageUrl?: string;
  designMode?: "seat-level" | "section-level";
  readOnly?: boolean;
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
    shape?: string | null;
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
  shape?: PlacementShape; // Optional shape for advanced placement
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
  shape?: PlacementShape; // Optional shape for advanced placement
}

/**
 * Shape overlay for making areas on the image clickable
 */
export interface ShapeOverlay {
  id: string;
  x: number; // Center X in percentage
  y: number; // Center Y in percentage
  shape: PlacementShape;
  onClick?: () => void;
  onHover?: () => void;
  label?: string;
  isSelected?: boolean;
  isNew?: boolean;
}

