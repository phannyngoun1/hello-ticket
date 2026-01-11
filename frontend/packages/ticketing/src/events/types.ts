/**
 * Event Types
 * 
 * This file contains all TypeScript types and interfaces for the Event entity.
 * Types are co-located with the entity for better maintainability.
 * 
 * IMPORTANT: Do NOT duplicate these types in the package-level types.ts file.
 * The package types.ts should only contain shared types used across multiple entities.
 * These entity-specific types are automatically exported via the entity's index.ts.
 */

export enum EventStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ON_SALE = "on_sale",
  SOLD_OUT = "sold_out",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export enum EventConfigurationType {
  SEAT_SETUP = "seat_setup",
  TICKET_IMPORT = "ticket_import",
}

export enum EventSeatStatus {
  AVAILABLE = "available",
  RESERVED = "reserved",
  SOLD = "sold",
  HELD = "held",
  BLOCKED = "blocked",
}

export interface EventSeat {
  id: string;
  tenant_id: string;
  event_id: string;
  status: EventSeatStatus;
  seat_id?: string;
  section_name?: string;
  row_name?: string;
  seat_number?: string;
  broker_id?: string;
  attributes: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  // Ticket information (if ticket exists)
  ticket_number?: string;
  ticket_price?: number;  // Ticket price
  ticket_status?: string;  // Ticket status (AVAILABLE, RESERVED, CONFIRMED, etc.)
}

export interface BrokerSeatImportItem {
  section_name: string;
  row_name: string;
  seat_number: string;
  attributes?: Record<string, any>;
}

export interface EventSeatStatistics {
  total_seats: number;
  available_seats: number;
  reserved_seats: number;
  sold_seats: number;
  held_seats: number;
  blocked_seats: number;
}

export interface Event {
  id: string;
  tenant_id: string;
  show_id: string;
  title: string;
  start_dt: Date;
  duration_minutes: number;
  venue_id: string;
  layout_id?: string;
  status: EventStatus;
  configuration_type: EventConfigurationType;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  show?: {
    id: string;
    name: string;
  };
  venue?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
    show?: string;
  };
  statistics?: EventSeatStatistics;
}

export interface CreateEventInput {
  show_id: string;
  title: string;
  start_dt: string; // ISO datetime string
  duration_minutes: number;
  venue_id: string;
  layout_id?: string;
  status?: EventStatus;
  configuration_type?: EventConfigurationType;
}

export interface UpdateEventInput {
  title?: string;
  start_dt?: string; // ISO datetime string
  duration_minutes?: number;
  venue_id?: string;
  layout_id?: string;
  status?: EventStatus;
  configuration_type?: EventConfigurationType;
}

export interface EventFilter {
  search?: string;
  is_active?: boolean;
  show_id?: string;
  layout_id?: string;
}

export interface SectionPricingConfig {
  section_id: string;
  price: number;
}

export interface SeatPricingConfig {
  seat_id: string;
  price: number;
}

export interface InitializeEventSeatsInput {
  generate_tickets?: boolean;
  ticket_price?: number;
  pricing_mode?: "same" | "per_section";
  section_pricing?: SectionPricingConfig[];
  seat_pricing?: SeatPricingConfig[];
  included_section_ids?: string[];
  excluded_section_ids?: string[];
}

