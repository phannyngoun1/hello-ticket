/**
 * Booking Types
 * 
 * This file contains all TypeScript types and interfaces for the Booking entity.
 * Types are co-located with the entity for better maintainability.
 * 
 * IMPORTANT: Do NOT duplicate these types in the package-level types.ts file.
 * The package types.ts should only contain shared types used across multiple entities.
 * These entity-specific types are automatically exported via the entity's index.ts.
 */

export interface BookingItem {
    id?: string;
    event_seat_id: string;
    ticket_id?: string;
    section_name?: string;
    row_name?: string;
    seat_number?: string;
    unit_price: number;
    total_price: number;
    currency?: string;
    ticket_number?: string;
    ticket_status?: string;
}

export interface Booking {
    id: string;
    tenant_id: string;
    booking_number: string;
    customer_id?: string;
    event_id: string;
    status: string; // 'pending' | 'reserved' | 'confirmed' | 'paid' | 'cancelled' | 'refunded'
    subtotal_amount: number;
    discount_amount: number;
    discount_type?: string; // 'percentage' | 'amount'
    discount_value?: number;
    tax_amount: number;
    tax_rate: number;
    total_amount: number;
    currency: string;
    payment_status?: string; // 'pending' | 'processing' | 'paid' | 'failed' | 'refunded'
    due_balance: number; // Remaining balance to be paid
    reserved_until?: Date;
    cancelled_at?: Date;
    cancellation_reason?: string;
    items: BookingItem[];
    created_at: Date;
    updated_at?: Date;
    version?: number;
}

export interface CreateBookingInput {
    event_id: string;
    customer_id?: string;
    items: BookingItem[];
    discount_type?: 'percentage' | 'amount';
    discount_value?: number;
    tax_rate?: number;
    currency?: string;
}

export interface UpdateBookingInput {
    customer_id?: string;
    status?: string;
    discount_type?: 'percentage' | 'amount';
    discount_value?: number;
    payment_status?: string;
}

export interface BookingFilter {
    search?: string;
    createdAfter?: string;
    createdBefore?: string;
}
