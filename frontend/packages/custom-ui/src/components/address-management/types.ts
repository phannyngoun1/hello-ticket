/**
 * Generic Address Management Types
 *
 * Provides type definitions for reusable address management components
 * that can work with vendors, customers, company addresses, etc.
 */

/**
 * Base address fields common to all address types
 */
export interface BaseAddress {
  id: string;
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Address with metadata (includes assignment_id for entities using AddressAssignment pattern)
 */
export interface AddressWithMeta extends BaseAddress {
  assignment_id?: string;
  address_type: string;
}

/**
 * Base address input fields for creation/update
 */
export interface BaseAddressInput {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
  notes?: string;
}

/**
 * Create address input (requires address_type)
 */
export interface CreateAddressInput<TAddressType extends string = string> extends BaseAddressInput {
  address_type: TAddressType;
}

/**
 * Update address input (address_type optional)
 */
export interface UpdateAddressInput<TAddressType extends string = string> extends BaseAddressInput {
  address_type?: TAddressType;
}

/**
 * Service adapter interface for address operations
 * Implement this interface to adapt different service implementations
 */
export interface AddressServiceAdapter<
  TAddress extends AddressWithMeta = AddressWithMeta,
  TAddressType extends string = string,
  TCreateInput extends CreateAddressInput<TAddressType> = CreateAddressInput<TAddressType>,
  TUpdateInput extends UpdateAddressInput<TAddressType> = UpdateAddressInput<TAddressType>
> {
  /**
   * List all addresses for an entity
   */
  listAddresses(entityId: string, addressType?: TAddressType): Promise<TAddress[]>;

  /**
   * Create a new address for an entity
   */
  createAddress(entityId: string, input: TCreateInput): Promise<TAddress>;

  /**
   * Update an existing address
   * @param entityId - The entity ID (vendor, customer, etc.)
   * @param addressId - The address ID or assignment_id depending on implementation
   * @param input - The update input
   */
  updateAddress(entityId: string, addressId: string, input: TUpdateInput): Promise<TAddress>;

  /**
   * Delete an address
   * @param entityId - The entity ID
   * @param addressId - The address ID or assignment_id depending on implementation
   */
  deleteAddress(entityId: string, addressId: string): Promise<void>;

  /**
   * Set an address as the default for its type
   * @param entityId - The entity ID
   * @param addressId - The address ID or assignment_id depending on implementation
   */
  setDefaultAddress(entityId: string, addressId: string): Promise<TAddress>;
}

/**
 * Configuration for address management component
 */
export interface AddressManagementConfig<TAddressType extends string = string> {
  /**
   * Available address types (e.g., ["billing"] or ["default", "billing", "shipping"])
   */
  addressTypes: readonly TAddressType[];

  /**
   * Labels for address types (e.g., { billing: "Billing" })
   */
  addressTypeLabels?: Record<TAddressType, string>;

  /**
   * Default address type when creating new address
   */
  defaultAddressType?: TAddressType;

  /**
   * Label for the entity (e.g., "vendor", "customer", "company")
   * Used in confirmation dialogs and messages
   */
  entityLabel?: string;

  /**
   * Function to get the address ID for operations (id or assignment_id)
   */
  getAddressId?: (address: AddressWithMeta) => string;

  /**
   * Function to format address type label for display
   */
  formatAddressTypeLabel?: (addressType: TAddressType) => string;
}

