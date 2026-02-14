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
  SOFA = "sofa",
  STAGE = "stage",
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
  // Optional style (when set, used in maker and view mode; otherwise type-based/default colors)
  fillColor?: string; // e.g. hex #rrggbb
  strokeColor?: string; // Border color
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
    canvas_background_color?: string | null;
    marker_fill_transparency?: number | null;
    shape?: string | null;
  }>;
  /** Called when user adds a floor plan image. Pass fileId so parent can persist layout.file_id. */
  onImageUpload?: (url: string, fileId?: string) => void;
  /** Called when user removes the floor plan image (switch to simple floor). Parent should persist via layout update. */
  onRemoveImage?: () => Promise<void>;
  /** Initial canvas background color when no image (from layout). */
  initialCanvasBackgroundColor?: string;
  /** Called when user changes canvas background color. Parent should persist via layout update. */
  onCanvasBackgroundColorChange?: (color: string) => void | Promise<void>;
  /** Marker fill transparency (0.0 to 1.0) from layout. */
  markerFillTransparency?: number;
  /** Called when user changes marker fill transparency. Parent should persist via layout update. */
  onMarkerFillTransparencyChange?: (transparency: number) => void | Promise<void>;
  className?: string;
  fileId?: string;
}

export interface SectionMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  imageUrl?: string;
  /** File ID for section floor plan. null = user explicitly removed; undefined = not modified. */
  file_id?: string | null;
  /** Canvas background color when no section image (hex). Stored per section. */
  canvasBackgroundColor?: string;
  /** Marker fill transparency for seats in this section (0.0 to 1.0). Differentiates from main layout. */
  markerFillTransparency?: number;
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
 * Snapshot of designer state for undo/redo functionality
 * Captures only the undoable design state (not UI state like zoom, pan, selection)
 */
export interface DesignerSnapshot {
  seats: SeatMarker[];
  sectionMarkers: SectionMarker[];
  canvasBackgroundColor: string;
  markerFillTransparency: number;
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

