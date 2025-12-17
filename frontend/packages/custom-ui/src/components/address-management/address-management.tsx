/**
 * Address Management Component
 *
 * Generic address management component that can work with vendors, customers,
 * company addresses, etc. through a service adapter pattern.
 */

import { useState, useEffect } from "react";
import {
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@truths/ui";
import { useToast } from "@truths/ui";
import { ConfirmationDialog } from "../confirmation-dialog";
import { AddressForm } from "./address-form";
import { AddressCard } from "./address-card";
import { formatAddress } from "./utils";
import {
  AddressServiceAdapter,
  AddressWithMeta,
  AddressManagementConfig,
  CreateAddressInput,
  UpdateAddressInput,
} from "./types";

export interface AddressManagementProps<
  TAddress extends AddressWithMeta = AddressWithMeta,
  TAddressType extends string = string,
  TCreateInput extends
    CreateAddressInput<TAddressType> = CreateAddressInput<TAddressType>,
  TUpdateInput extends
    UpdateAddressInput<TAddressType> = UpdateAddressInput<TAddressType>,
> {
  /**
   * Entity ID (vendor ID, customer ID, etc.)
   */
  entityId: string;

  /**
   * Service adapter for address operations
   */
  service: AddressServiceAdapter<
    TAddress,
    TAddressType,
    TCreateInput,
    TUpdateInput
  >;

  /**
   * Configuration for address management
   */
  config: AddressManagementConfig<TAddressType>;

  /**
   * Callback when addresses change
   */
  onAddressesChanged?: () => void;

  /**
   * External control for add dialog
   */
  addDialogOpen?: boolean;

  /**
   * Handler for add dialog open state change
   */
  onAddDialogOpenChange?: (open: boolean) => void;
}

export function AddressManagement<
  TAddress extends AddressWithMeta = AddressWithMeta,
  TAddressType extends string = string,
  TCreateInput extends
    CreateAddressInput<TAddressType> = CreateAddressInput<TAddressType>,
  TUpdateInput extends
    UpdateAddressInput<TAddressType> = UpdateAddressInput<TAddressType>,
>({
  entityId,
  service,
  config,
  onAddressesChanged,
  addDialogOpen: externalAddDialogOpen,
  onAddDialogOpenChange,
}: AddressManagementProps<TAddress, TAddressType, TCreateInput, TUpdateInput>) {
  const [addresses, setAddresses] = useState<TAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [internalAddDialogOpen, setInternalAddDialogOpen] = useState(false);
  const addDialogOpen = externalAddDialogOpen ?? internalAddDialogOpen;
  const setAddDialogOpen = onAddDialogOpenChange ?? setInternalAddDialogOpen;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<TAddress | null>(null);
  const [editingAddress, setEditingAddress] = useState<TAddress | null>(null);
  const { toast } = useToast();

  const getAddressId = (address: TAddress): string => {
    return config.getAddressId ? config.getAddressId(address) : address.id;
  };

  const formatAddressTypeLabel = (type: TAddressType): string => {
    if (config.formatAddressTypeLabel) {
      return config.formatAddressTypeLabel(type);
    }
    return (
      config.addressTypeLabels?.[type] ||
      type.charAt(0).toUpperCase() + type.slice(1)
    );
  };

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const data = await service.listAddresses(entityId);
      setAddresses(data);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load addresses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      loadAddresses();
    }
  }, [entityId]);

  const handleAdd = async (
    data: CreateAddressInput<TAddressType> | UpdateAddressInput<TAddressType>
  ) => {
    try {
      // Ensure address_type is defined for creation
      if (!("address_type" in data) || !data.address_type) {
        throw new Error("Address type is required");
      }
      await service.createAddress(entityId, data as TCreateInput);
      toast({
        title: "Success",
        description: "Address added successfully",
      });
      setAddDialogOpen(false);
      await loadAddresses();
      onAddressesChanged?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add address",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdate = async (addressId: string, data: TUpdateInput) => {
    try {
      await service.updateAddress(entityId, addressId, data);
      toast({
        title: "Success",
        description: "Address updated successfully",
      });
      setEditDialogOpen(false);
      setEditingAddress(null);
      await loadAddresses();
      onAddressesChanged?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update address",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteClick = (address: TAddress) => {
    if (address.is_default) {
      toast({
        title: "Cannot Delete",
        description:
          "Default addresses cannot be deleted. Please set another address as default first, or edit this address instead.",
        variant: "destructive",
      });
      return;
    }
    setDeletingAddress(address);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAddress) return;

    try {
      await service.deleteAddress(entityId, getAddressId(deletingAddress));
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDeletingAddress(null);
      await loadAddresses();
      onAddressesChanged?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await service.setDefaultAddress(entityId, addressId);
      toast({
        title: "Success",
        description: "Default address updated successfully",
      });
      await loadAddresses();
      onAddressesChanged?.();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to set default address",
        variant: "destructive",
      });
    }
  };

  // Group addresses by type
  const addressesByType = config.addressTypes.reduce(
    (acc, type) => {
      acc[type] = addresses.filter((a) => a.address_type === type);
      return acc;
    },
    {} as Record<TAddressType, TAddress[]>
  );

  const defaultAddressType =
    config.defaultAddressType || config.addressTypes[0];
  const entityLabel = config.entityLabel || "entity";

  return (
    <div className="space-y-6">
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Add {formatAddressTypeLabel(defaultAddressType)} Address
            </DialogTitle>
          </DialogHeader>
          <AddressForm
            onSubmit={handleAdd}
            defaultAddressType={defaultAddressType}
            addressTypes={config.addressTypes}
            addressTypeLabels={config.addressTypeLabels}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading addresses...
        </div>
      ) : addresses.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            No addresses found. Add a{" "}
            {formatAddressTypeLabel(defaultAddressType).toLowerCase()} address
            to get started.
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {config.addressTypes.map((type) => {
            const typeAddresses = addressesByType[type];
            if (typeAddresses.length === 0) return null;

            return (
              <div key={type}>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {formatAddressTypeLabel(type)} Addresses
                </h4>
                <div className="space-y-3">
                  {typeAddresses.map((addr) => (
                    <AddressCard
                      key={getAddressId(addr)}
                      address={addr}
                      formatAddressTypeLabel={formatAddressTypeLabel}
                      onEdit={() => {
                        setEditingAddress(addr);
                        setEditDialogOpen(true);
                      }}
                      onDelete={() => handleDeleteClick(addr)}
                      onSetDefault={() => handleSetDefault(getAddressId(addr))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      {editingAddress && (
        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingAddress(null);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
            </DialogHeader>
            <AddressForm
              onSubmit={(data) =>
                handleUpdate(getAddressId(editingAddress), data as TUpdateInput)
              }
              defaultValues={{
                name: editingAddress.name,
                street: editingAddress.street,
                city: editingAddress.city,
                state: editingAddress.state,
                postal_code: editingAddress.postal_code,
                country: editingAddress.country,
                address_type: editingAddress.address_type as TAddressType,
                is_default: editingAddress.is_default,
                notes: editingAddress.notes || undefined,
              }}
              addressTypes={config.addressTypes}
              addressTypeLabels={config.addressTypeLabels}
              onCancel={() => {
                setEditDialogOpen(false);
                setEditingAddress(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingAddress(null);
        }}
        title="Delete Address"
        description={
          deletingAddress ? (
            <div className="space-y-2">
              <p>Are you sure you want to delete this address?</p>
              {deletingAddress.name && (
                <p className="text-sm font-semibold">{deletingAddress.name}</p>
              )}
              <p className="text-sm text-muted-foreground font-mono">
                {formatAddress(deletingAddress)}
              </p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. The address will be removed from
                this {entityLabel}.
              </p>
            </div>
          ) : undefined
        }
        confirmAction={{
          label: "Delete",
          variant: "destructive",
          onClick: handleDeleteConfirm,
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => {
            setDeleteDialogOpen(false);
            setDeletingAddress(null);
          },
        }}
      />
    </div>
  );
}
