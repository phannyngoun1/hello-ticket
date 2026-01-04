/**
 * Section Types
 * 
 * This file contains all TypeScript types and interfaces for the Section entity.
 */

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

export interface CreateSectionInput {
    layout_id: string;
    name: string;
    x_coordinate?: number;
    y_coordinate?: number;
    file_id?: string;
    shape?: string; // JSON string storing PlacementShape data
}

export interface UpdateSectionInput {
    name?: string;
    x_coordinate?: number;
    y_coordinate?: number;
    file_id?: string;
    shape?: string; // JSON string storing PlacementShape data
}

