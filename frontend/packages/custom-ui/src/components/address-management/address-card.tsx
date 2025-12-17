/**
 * Address Card Component
 *
 * Generic card component for displaying addresses
 */

import { Button, Card, Badge } from "@truths/ui";
import { Edit, Trash2, Star, StarOff } from "lucide-react";
import { AddressWithMeta } from "./types";
import { formatAddress } from "./utils";

export interface AddressCardProps<TAddressType extends string = string> {
  /**
   * The address to display
   */
  address: AddressWithMeta;

  /**
   * Function to format address type label
   */
  formatAddressTypeLabel?: (addressType: TAddressType) => string;

  /**
   * Edit handler
   */
  onEdit: () => void;

  /**
   * Delete handler
   */
  onDelete: () => void;

  /**
   * Set default handler
   */
  onSetDefault: () => void;
}

export function AddressCard<TAddressType extends string = string>({
  address,
  formatAddressTypeLabel,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps<TAddressType>) {
  const getAddressTypeLabel = (type: string): string => {
    if (formatAddressTypeLabel) {
      return formatAddressTypeLabel(type as TAddressType);
    }
    // Default formatting
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={address.is_default ? "default" : "secondary"}>
              {getAddressTypeLabel(address.address_type)}
            </Badge>
            {address.is_default && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Default
              </Badge>
            )}
          </div>
          {address.name && (
            <p className="text-sm font-semibold mb-1">{address.name}</p>
          )}
          <p className="text-sm">{formatAddress(address)}</p>
          {address.notes && (
            <p className="text-xs text-muted-foreground mt-2">
              {address.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!address.is_default && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSetDefault}
              title="Set as default"
            >
              <StarOff className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={address.is_default}
            title={
              address.is_default ? "Cannot delete default address" : "Delete"
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
