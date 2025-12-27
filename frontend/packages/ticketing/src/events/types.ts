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
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEventInput {
  show_id: string;
  title: string;
  start_dt: string; // ISO datetime string
  duration_minutes: number;
  venue_id: string;
  layout_id?: string;
  status?: EventStatus;
}

export interface UpdateEventInput {
  title?: string;
  start_dt?: string; // ISO datetime string
  duration_minutes?: number;
  venue_id?: string;
  layout_id?: string;
  status?: EventStatus;
}

export interface EventFilter {
  search?: string;
  is_active?: boolean;
  show_id?: string;
}

