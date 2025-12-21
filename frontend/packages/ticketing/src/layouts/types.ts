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
}

export interface UpdateLayoutInput {
  name?: string;
  description?: string;
  image_url?: string; // Deprecated: use file_id instead
  file_id?: string;
}
