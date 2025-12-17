/**
 * Company Address Service Adapter
 *
 * Adapter that wraps CompanyAddressService to work with generic AddressManagement component.
 * Located in web app since company address management is a general company/settings feature,
 * not specific to purchasing.
 */

import {
  AddressWithMeta,
  CreateAddressInput,
  UpdateAddressInput,
} from "@truths/custom-ui";
import {
  CompanyAddress,
  CreateCompanyAddressInput,
  UpdateCompanyAddressInput,
  CompanyAddressService,
} from "@truths/shared";

type CompanyAddressType = "default" | "billing" | "shipping";

/**
 * Transform CompanyAddress to AddressWithMeta format
 */
function transformToAddressWithMeta(address: CompanyAddress): AddressWithMeta {
  return {
    id: address.id,
    name: address.name,
    street: address.street ?? undefined,
    city: address.city ?? undefined,
    state: address.state ?? undefined,
    postal_code: address.postal_code ?? undefined,
    country: address.country ?? undefined,
    is_default: address.is_default,
    notes: address.notes ?? undefined,
    address_type: address.address_type,
    created_at: address.created_at,
    updated_at: address.updated_at,
  };
}

/**
 * Service adapter that wraps CompanyAddressService to work with generic AddressManagement
 */
export class CompanyAddressServiceAdapter {
  constructor(private companyAddressService: CompanyAddressService) {}

  async listAddresses(
    _entityId: string,
    addressType?: CompanyAddressType
  ): Promise<AddressWithMeta[]> {
    // For company addresses, entityId is not used (addresses are tenant-scoped)
    // Backend has a max limit of 200, so we fetch with that limit
    const response = await this.companyAddressService.fetchCompanyAddresses({
      address_type: addressType,
      skip: 0,
      limit: 200, // Backend max limit is 200
    });
    return response.data.map(transformToAddressWithMeta);
  }

  async createAddress(
    _entityId: string,
    input: CreateAddressInput<CompanyAddressType>
  ): Promise<AddressWithMeta> {
    // Ensure name is provided and not empty for company addresses (required field)
    if (!input.name || !input.name.trim()) {
      throw new Error("Address name is required");
    }
    // Convert generic input to CreateCompanyAddressInput
    const companyInput: CreateCompanyAddressInput = {
      name: input.name,
      address_type: input.address_type,
      street: input.street ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      postal_code: input.postal_code ?? null,
      country: input.country ?? null,
      is_default: input.is_default ?? false,
      notes: input.notes ?? null,
    };
    const address =
      await this.companyAddressService.createCompanyAddress(companyInput);
    return transformToAddressWithMeta(address);
  }

  async updateAddress(
    _entityId: string,
    addressId: string,
    input: UpdateAddressInput<CompanyAddressType>
  ): Promise<AddressWithMeta> {
    // Convert generic input to UpdateCompanyAddressInput
    const companyInput: UpdateCompanyAddressInput = {
      name: input.name,
      address_type: input.address_type,
      street: input.street ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      postal_code: input.postal_code ?? null,
      country: input.country ?? null,
      is_default: input.is_default,
      notes: input.notes ?? null,
    };
    const address = await this.companyAddressService.updateCompanyAddress(
      addressId,
      companyInput
    );
    return transformToAddressWithMeta(address);
  }

  async deleteAddress(_entityId: string, addressId: string): Promise<void> {
    await this.companyAddressService.deleteCompanyAddress(addressId);
  }

  async setDefaultAddress(
    _entityId: string,
    addressId: string
  ): Promise<AddressWithMeta> {
    // Update this address to be default
    const updatedAddress =
      await this.companyAddressService.updateCompanyAddress(addressId, {
        is_default: true,
      });

    // Company can only have one default address total (not one per type)
    // Fetch all addresses to find and unset other defaults
    // Backend has a max limit of 200, so we fetch with that limit
    const allAddresses = await this.companyAddressService.fetchCompanyAddresses(
      {
        skip: 0,
        limit: 200, // Backend max limit is 200
      }
    );

    // Unset default for all other addresses
    const updatePromises = allAddresses.data
      .filter(
        (addr: CompanyAddress) => addr.id !== addressId && addr.is_default
      )
      .map((addr: CompanyAddress) =>
        this.companyAddressService.updateCompanyAddress(addr.id, {
          is_default: false,
        })
      );

    await Promise.all(updatePromises);

    return transformToAddressWithMeta(updatedAddress);
  }
}
