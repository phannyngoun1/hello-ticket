/**
 * Address Management Utilities
 *
 * Utility functions for address management components
 */

import { AddressWithMeta } from "./types";

/**
 * Format an address into a readable string
 * @param address - The address to format
 * @returns Formatted address string
 */
export function formatAddress(address: AddressWithMeta): string {
  const parts: string[] = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postal_code) parts.push(address.postal_code);
  if (address.country) parts.push(address.country);
  return parts.length > 0 ? parts.join(", ") : "No address details";
}

