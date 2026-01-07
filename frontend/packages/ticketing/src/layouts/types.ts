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
}

export interface UpdateLayoutInput {
  name?: string;
  description?: string;
  image_url?: string; // Deprecated: use file_id instead
  file_id?: string;
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
  shape?: string | null; // JSON string storing PlacementShape data
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
