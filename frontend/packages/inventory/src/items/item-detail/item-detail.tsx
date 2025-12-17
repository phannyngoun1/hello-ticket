/**
 * Item Detail Component
 *
 * Display detailed information about an item with optional edit and metadata views.
 *
 * @author Phanny
 */

import React, { useState, useEffect, useMemo } from "react";
import { Card, Tabs } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { useToast } from "@truths/ui";
import { Item, type ItemCategoryTree } from "../../types";
import { useItem, useUpdateItem, useItemBalances } from "../use-items";
import { useItemService } from "../item-provider";
import { useItemActions } from "./use-item-actions";
import { getItemDisplayName } from "./item-utils";
import { ItemHeader } from "./item-header";
import { ItemTabs, type ItemTab } from "./item-tabs";
import { ItemOverviewTab } from "./item-overview-tab";
import { ItemClassificationTab } from "./item-classification-tab";
import { ItemTrackingTab } from "./item-tracking-tab";
import { ItemMetadataTab } from "./item-metadata-tab";
import { ItemEditDialog } from "./item-dialogs";
import { CategoryService } from "../../categories/category-service";
import { useCategoryTree } from "../../categories/use-categories";
import { api } from "@truths/api";

export interface ItemDetailProps {
  className?: string;
  id?: string;
  item?: Item;
  loading?: boolean;
  error?: Error | null;
  editable?: boolean;
  showMetadata?: boolean;
  customActions?: (item: Item) => React.ReactNode;
  onBack?: () => void;
  onUpdateTabTitle?: (title: string, iconName?: string) => void;
}

export function ItemDetail({
  className,
  id,
  item: providedItem,
  loading: providedLoading = false,
  error: providedError = null,
  editable = true,
  showMetadata = false,
  customActions,
  onBack: _onBack,
  onUpdateTabTitle,
}: ItemDetailProps) {
  const [activeTab, setActiveTab] = useState<ItemTab>("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const itemService = useItemService();
  const categoryService = useMemo(
    () =>
      new CategoryService({
        apiClient: api,
        endpoints: {
          categories: "/api/v1/inventory/categories",
        },
      }),
    []
  );
  const {
    data: categoryTreeData,
    isLoading: isCategoryTreeLoading,
    error: categoryTreeError,
    refetch: refetchCategoryTree,
  } = useCategoryTree(categoryService);
  const categoryTree = categoryTreeData ?? [];
  const categoryLookup = useMemo(() => {
    const flatten = (
      tree: ItemCategoryTree[] | undefined,
      parentPath: string[] = []
    ): Record<string, { label: string; code: string; name: string }> => {
      if (!tree || tree.length === 0) return {};

      return tree.reduce<
        Record<string, { label: string; code: string; name: string }>
      >((acc, node) => {
        const path = [...parentPath, node.name || node.code];
        const label = `${path.join(" / ")} (${node.code})`;

        acc[node.id] = {
          label,
          code: node.code,
          name: node.name,
        };

        const childLookup = flatten(node.children, path);
        Object.assign(acc, childLookup);
        return acc;
      }, {});
    };

    return flatten(categoryTree);
  }, [categoryTree]);
  const updateMutation = useUpdateItem(itemService);
  const { toast } = useToast();

  // Fetch item if id is provided and item is not provided
  const {
    data: fetchedItem,
    isLoading: isFetching,
    error: fetchError,
  } = useItem(itemService, id && !providedItem ? id : null);

  const item = providedItem || fetchedItem;
  const loading = providedLoading ?? isFetching;
  const error = providedError || fetchError;

  // Determine item ID for balances query - use stable value
  const itemIdForBalances = useMemo(() => {
    return item?.id || id || null;
  }, [item?.id, id]);

  // Fetch inventory balances for statistics
  const {
    data: balances,
    isLoading: balancesLoading,
    error: balancesError,
  } = useItemBalances(itemService, itemIdForBalances);

  // Calculate inventory statistics - must be before early returns
  const inventoryStats = useMemo(() => {
    if (!balances || balances.length === 0) {
      return {
        totalQuantity: 0,
        availableQuantity: 0,
        reservedQuantity: 0,
        locationCount: 0,
        statusBreakdown: {},
        locationBreakdown: {},
      };
    }

    let totalQuantity = 0;
    let availableQuantity = 0;
    let reservedQuantity = 0;
    const statusBreakdown: Record<string, number> = {};
    const locationBreakdown: Record<string, number> = {};

    balances.forEach((balance) => {
      const qty = balance.quantity || 0;
      totalQuantity += qty;

      if (balance.status === "available") {
        availableQuantity += qty;
      } else if (balance.status === "reserved") {
        reservedQuantity += qty;
      }

      statusBreakdown[balance.status] =
        (statusBreakdown[balance.status] || 0) + qty;
      locationBreakdown[balance.location_id] =
        (locationBreakdown[balance.location_id] || 0) + qty;
    });

    return {
      totalQuantity,
      availableQuantity,
      reservedQuantity,
      locationCount: Object.keys(locationBreakdown).length,
      statusBreakdown,
      locationBreakdown,
    };
  }, [balances]);

  // Check if item has metadata - must be before early returns
  const hasMetadata = useMemo((): boolean => {
    if (!item?.attributes) return false;
    return Object.keys(item.attributes).length > 0;
  }, [item?.attributes]);

  // Update the top tab title once the item is loaded
  useEffect(() => {
    if (!id || !item || !onUpdateTabTitle) return;
    const displayName = item.code || item.name || "Item";
    onUpdateTabTitle(displayName, "Package");
  }, [id, item, onUpdateTabTitle]);

  // Determine available actions
  const actions = useItemActions(item, editable);

  // Get display name
  const displayName = useMemo(
    () => getItemDisplayName(item),
    [item?.name, item?.code, item?.id]
  );

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (
    itemId: string,
    input: Parameters<typeof itemService.updateItem>[1]
  ) => {
    try {
      await updateMutation.mutateAsync({ id: itemId, input });
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      });
      throw error; // Re-throw to let dialog handle it
    }
  };

  // Early returns - after all hooks
  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  if (error || !item) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error?.message || "Item not found"}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div>
        {/* Header */}
        <ItemHeader
          item={item}
          actions={actions}
          displayName={displayName}
          onEdit={handleEdit}
          customActions={customActions}
          inventoryStats={inventoryStats}
          balancesLoading={balancesLoading}
          balancesError={balancesError}
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ItemTab)}
        >
          <ItemTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            item={item}
            showMetadata={showMetadata ?? false}
            hasMetadata={hasMetadata}
          />

          <div className="mt-0">
            {/* Overview Tab */}
            {activeTab === "overview" && <ItemOverviewTab item={item} />}

            {/* Classification Tab */}
            {activeTab === "classification" && (
              <ItemClassificationTab
                item={item}
                categoryLookup={categoryLookup}
              />
            )}

            {/* Tracking & Configuration Tab */}
            {activeTab === "tracking" && <ItemTrackingTab item={item} />}

            {/* Metadata Tab */}
            {activeTab === "metadata" && hasMetadata && (
              <ItemMetadataTab item={item} />
            )}
          </div>
        </Tabs>
      </div>

      {/* Dialogs */}
      {editable && (
        <ItemEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEditSubmit}
          item={item}
          categoryTree={categoryTree}
          isCategoryTreeLoading={isCategoryTreeLoading}
          categoryTreeError={categoryTreeError as Error | null}
          onReloadCategoryTree={refetchCategoryTree}
        />
      )}
    </Card>
  );
}
