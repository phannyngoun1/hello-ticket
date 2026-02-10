/**
 * Layout Types
 * 
 * This file contains all TypeScript types and interfaces for the Layout entity.
 */

export interface Layout {
  id: string;
  tenant_id: string;
  venue_id: string;
  name: string;
  description?: string;
  image_url?: string; // Deprecated: use file_id instead
  file_id?: string;
  design_mode?: "seat-level" | "section-level";
  canvas_background_color?: string; // When no image (hex e.g. #e5e7eb)
  marker_fill_transparency?: number; // Marker fill transparency (0.0 to 1.0)
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLayoutInput {
  venue_id: string;
  name: string;
  description?: string;
  image_url?: string; // Deprecated: use file_id instead
  file_id?: string;
  design_mode?: "seat-level" | "section-level";
  canvas_background_color?: string;
  marker_fill_transparency?: number;
}

export interface UpdateLayoutInput {
  name?: string;
  description?: string;
  image_url?: string; // Deprecated: use file_id instead
  file_id?: string;
  canvas_background_color?: string;
  marker_fill_transparency?: number;
}

export interface Section {
  id: string;
  tenant_id: string;
  layout_id: string;
  name: string;
  x_coordinate?: number | null;
  y_coordinate?: number | null;
  file_id?: string | null;
  image_url?: string | null;
  canvas_background_color?: string | null; // Canvas background when no section image (hex)
  shape?: string | null; // JSON string storing PlacementShape data
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
