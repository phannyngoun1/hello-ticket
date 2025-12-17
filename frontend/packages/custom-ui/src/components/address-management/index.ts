/**
 * Address Management Module
 *
 * Exports all address management components, types, and utilities
 */

// Components
export { AddressManagement } from "./address-management";
export { AddressForm } from "./address-form";
export { AddressCard } from "./address-card";

// Types
export type {
  BaseAddress,
  AddressWithMeta,
  BaseAddressInput,
  CreateAddressInput,
  UpdateAddressInput,
  AddressServiceAdapter,
  AddressManagementConfig,
} from "./types";
export type { AddressFormProps } from "./address-form";
export type { AddressCardProps } from "./address-card";
export type { AddressManagementProps } from "./address-management";

// Constants
export { COUNTRIES } from "./constants";

// Utilities
export { formatAddress } from "./utils";

