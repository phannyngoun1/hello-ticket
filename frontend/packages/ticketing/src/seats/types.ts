/**
 * Seat Types
 * 
 * This file contains all TypeScript types and interfaces for the Seat entity.
 */

export enum SeatType {
    STANDARD = "STANDARD",
    VIP = "VIP",
    WHEELCHAIR = "WHEELCHAIR",
    COMPANION = "COMPANION",
}

export interface Seat {
    id: string;
    tenant_id: string;
    venue_id: string;
    layout_id: string;
    section_id: string;
    section_name?: string;  // Section name for display
    row: string;
    seat_number: string;
    seat_type: SeatType;
    x_coordinate?: number;
    y_coordinate?: number;
    shape?: string; // JSON string storing PlacementShape data
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateSeatInput {
    venue_id: string;
    layout_id: string;
    section_id: string;
    row: string;
    seat_number: string;
    seat_type?: SeatType;
    x_coordinate?: number;
    y_coordinate?: number;
    shape?: string; // JSON string storing PlacementShape data
}

export interface UpdateSeatInput {
    section_id?: string;
    row?: string;
    seat_number?: string;
    seat_type?: SeatType;
    x_coordinate?: number;
    y_coordinate?: number;
    shape?: string; // JSON string storing PlacementShape data
}

export interface SeatListResponse {
    items: Seat[];
    skip: number;
    limit: number;
    total: number;
    has_next: boolean;
}
