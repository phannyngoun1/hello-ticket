/**
 * Inventory Management Page Component
 *
 * Unified page combining Items and Categories management with tabs
 */

import { useState, useMemo } from "react";
import { CustomTabs } from "@truths/custom-ui";
import { ItemListContainer } from "./items/item-list/item-list-container";
import { CategoryListContainer } from "./categories/category-list-container";
import { CategoryService } from "./categories/category-service";
import { ItemCategory } from "./types";
import { api } from "@truths/api";
import { ItemService } from "./items/item-service";

export interface InventoryManagementPageProps {
  className?: string;
  defaultTab?: "items" | "categories";
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
  onItemClick?: (itemId: string) => void;
  onCategoryClick?: (category: ItemCategory) => void;
}

export function InventoryManagementPage({
  className,
  defaultTab = "items",
  onCreateDialogClose,
  onItemClick,
  onCategoryClick,
  autoOpenCreate,
}: InventoryManagementPageProps) {
  const [activeTab, setActiveTab] = useState<"items" | "categories">(
    (defaultTab as any) || "items"
  );

  // Initialize services
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

  const itemService = useMemo(
    () =>
      new ItemService({
        apiClient: api,
        endpoints: {
          items: "/api/v1/inventory/items",
        },
      }),
    []
  );

  return (
    <div className={className}>
      <CustomTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "items" | "categories")}
        variant="default"
        items={[
          {
            value: "items",
            label: "Items",
            content: (
              <ItemListContainer
                autoOpenCreate={autoOpenCreate}
                onCreateDialogClose={onCreateDialogClose}
                onNavigateToItem={onItemClick}
              />
            ),
          },
          {
            value: "categories",
            label: "Categories",
            content: (
              <CategoryListContainer
                service={categoryService}
                onCategoryClick={onCategoryClick}
                showCreateButton={true}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
