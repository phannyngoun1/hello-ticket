/**
 * Category List Component
 *
 * Display and manage categories with hierarchy support.
 *
 * @author Phanny
 */

import React from "react";
import { Button } from "@truths/ui";
import { DataList, StatConfig, BadgeConfig } from "@truths/custom-ui";
import { Plus, Edit, Trash2 } from "lucide-react";
import { ItemCategory } from "../types";

export interface CategoryListProps {
  className?: string;
  categories?: ItemCategory[];
  loading?: boolean;
  error?: Error | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  showLevel?: boolean;
  showParent?: boolean;
  showActions?: boolean;
  showCreateButton?: boolean;
  onCreate?: () => void;
  onCategoryClick?: (category: ItemCategory) => void;
  onEdit?: (category: ItemCategory) => void;
  onDelete?: (category: ItemCategory) => void;
  onSearch?: (query: string) => void;
  customActions?: (category: ItemCategory) => React.ReactNode;
}

export function CategoryList({
  className,
  categories = [],
  loading = false,
  error = null,
  searchable = true,
  searchPlaceholder = "Search categories...",
  showLevel = true,
  showParent = true,
  showActions = true,
  showCreateButton = false,
  onCreate,
  onCategoryClick,
  onEdit,
  onDelete,
  onSearch,
  customActions,
}: CategoryListProps) {
  // Configure stats to display
  const stats: StatConfig<ItemCategory>[] = [];
  if (showLevel) {
    stats.push({
      key: "level",
      label: "level",
      value: (category: ItemCategory) => category.level || 0,
    });
  }

  // Configure badges
  const badges: BadgeConfig<ItemCategory>[] = [
    {
      key: "active",
      label: "Active",
      condition: (category: ItemCategory) => !!category.is_active,
      variant: "default",
    },
    {
      key: "inactive",
      label: "Inactive",
      condition: (category: ItemCategory) => !category.is_active,
      variant: "secondary",
    },
  ];

  // Custom actions renderer
  const actionsRenderer = (category: ItemCategory) => {
    if (customActions) {
      return customActions(category);
    }

    return (
      <>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </>
    );
  };

  // Transform categories to include formatted name with parent info if available
  const formattedCategories = categories.map((category) => {
    let displayName = category.name;
    if (showParent && category.parent_category_id) {
      const parent = categories.find(c => c.id === category.parent_category_id);
      if (parent) {
        displayName = `${parent.name} > ${category.name}`;
      }
    }
    return {
      ...category,
      name: displayName,
      description: category.description || category.code,
    };
  });

  return (
    <DataList
      className={className}
      items={formattedCategories}
      loading={loading}
      error={error}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      title="Categories"
      description="Manage item categories"
      stats={stats}
      badges={badges}
      showActions={showActions}
      showCreateButton={showCreateButton}
      createButtonLabel={
        <>
          <Plus className="h-4 w-4 mr-2" />
          New
        </>
      }
      onCreate={onCreate}
      onItemClick={onCategoryClick}
      onEdit={showActions ? onEdit : undefined}
      onDelete={showActions ? onDelete : undefined}
      onSearch={onSearch}
      customActions={showActions ? actionsRenderer : undefined}
      loadingMessage="Loading categories..."
      emptyMessage="No categories found"
      gridCols={{ default: 1, md: 2, lg: 3 }}
    />
  );
}

