/**
 * Item Utility Functions
 *
 * Shared utility functions for formatting and displaying item data
 *
 * @author Phanny
 */

import type { Item } from "../../types";

/**
 * Format a date value to a localized string
 */
export function formatDate(value?: Date | string): string {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

/**
 * Format any field value for display
 * Note: This function does NOT auto-detect dates from strings to avoid
 * incorrectly formatting text fields that happen to look like dates.
 * Use formatDate() explicitly for date fields.
 */
export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "N/A";
    return trimmed;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Get the display name for an item
 */
export function getItemDisplayName(item?: Item): string {
  return item?.name || item?.code || item?.id || "Unnamed Item";
}

/**
 * Format item type for display
 */
export function formatItemType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format item usage for display
 */
export function formatItemUsage(usage: string): string {
  return usage
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format tracking scope for display
 */
export function formatTrackingScope(scope: string): string {
  return scope
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format UoM context for display
 */
export function formatUoMContext(context: string): string {
  return context
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
