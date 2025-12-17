/**
 * Item Header Component
 *
 * Displays the item header with status, badges, inventory stats, and actions menu
 *
 * @author Phanny
 */

import React from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Badge,
} from "@truths/ui";
import { Edit, MoreVertical, Package } from "lucide-react";
import type { Item } from "../../types";
import type { ItemActions } from "./use-item-actions";
import { formatItemType } from "./item-utils";

export interface ItemHeaderProps {
  item: Item;
  actions: ItemActions;
  displayName: string;
  onEdit: () => void;
  customActions?: (item: Item) => React.ReactNode;
  inventoryStats?: {
    totalQuantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    locationCount: number;
  };
  balancesLoading?: boolean;
  balancesError?: Error | null;
}

export function ItemHeader({
  item,
  actions,
  displayName,
  onEdit,
  customActions,
  inventoryStats,
  balancesLoading,
  balancesError,
}: ItemHeaderProps) {
  const showInventoryStats =
    item.tracking_scope &&
    item.tracking_scope !== "none" &&
    (item.tracking_scope === "inventory_only" ||
      item.tracking_scope === "both");

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
          <Package className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{displayName}</h2>
          {item.code && (
            <p className="text-sm text-muted-foreground mt-1">
              Code: {item.code}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2">
            <Badge variant={item.active ? "default" : "secondary"}>
              {item.active ? "Active" : "Inactive"}
            </Badge>
            {item.item_type && (
              <Badge variant="outline">{formatItemType(item.item_type)}</Badge>
            )}
            {item.perishable && (
              <Badge variant="outline" className="text-orange-600">
                Perishable
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Inventory Statistics - Compact Header View */}
        {showInventoryStats && (
          <div className="flex items-center gap-4">
            {balancesLoading ? (
              <div className="flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : balancesError ? (
              <div className="text-xs text-destructive">Stats unavailable</div>
            ) : inventoryStats ? (
              <>
                <div className="flex flex-col items-end">
                  <div className="text-xs font-medium text-muted-foreground">
                    Total
                  </div>
                  <div className="text-lg font-semibold">
                    {inventoryStats.totalQuantity.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.default_uom || "units"}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs font-medium text-muted-foreground">
                    Available
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {inventoryStats.availableQuantity.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.default_uom || "units"}
                  </div>
                </div>
                {inventoryStats.reservedQuantity > 0 && (
                  <div className="flex flex-col items-end">
                    <div className="text-xs font-medium text-muted-foreground">
                      Reserved
                    </div>
                    <div className="text-lg font-semibold text-orange-600">
                      {inventoryStats.reservedQuantity.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.default_uom || "units"}
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-end">
                  <div className="text-xs font-medium text-muted-foreground">
                    Locations
                  </div>
                  <div className="text-lg font-semibold">
                    {inventoryStats.locationCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {inventoryStats.locationCount === 1
                      ? "location"
                      : "locations"}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        <div className="flex items-center gap-2">{customActions?.(item)}</div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Actions"
                disabled={!actions.hasActions}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {actions.canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-3.5 w-3.5" /> Edit item
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
