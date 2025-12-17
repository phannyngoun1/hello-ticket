/**
 * Item Classification Tab
 *
 * Displays item classification information
 *
 * @author Phanny
 */

import { Package } from "lucide-react";
import { Badge } from "@truths/ui";
import type { Item } from "../../types";
import {
  DataDescription,
  type DataDescriptionSection,
} from "@truths/custom-ui";
import {
  formatFieldValue,
  formatItemType,
  formatItemUsage,
} from "./item-utils";

export interface ItemClassificationTabProps {
  item: Item;
  categoryLookup?: Record<
    string,
    { label: string; code: string; name: string }
  >;
}

export function ItemClassificationTab({
  item,
  categoryLookup,
}: ItemClassificationTabProps) {
  const getCategoryInfo = (categoryId: string | null | undefined) => {
    if (!categoryId || !categoryLookup) return null;
    const category = categoryLookup[categoryId];
    return category ? { code: category.code, name: category.name } : null;
  };

  const categoryInfo = item.category_id
    ? getCategoryInfo(item.category_id)
    : null;

  const sections: DataDescriptionSection[] = [
    {
      title: "Item Classification",
      icon: Package,
      fields: [
        {
          label: "Type",
          value: item.item_type ? (
            <Badge variant="outline">{formatItemType(item.item_type)}</Badge>
          ) : null,
        },
        {
          label: "Usage",
          value: item.item_usage ? (
            <Badge variant="outline">{formatItemUsage(item.item_usage)}</Badge>
          ) : null,
        },
        {
          label: "Category",
          value: categoryInfo ? (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground font-mono">
                {categoryInfo.code}
              </span>
              <span className="text-sm text-muted-foreground">
                {categoryInfo.name}
              </span>
            </div>
          ) : item.category_id ? (
            <span className="text-xs text-muted-foreground font-mono">
              {item.category_id}
            </span>
          ) : null,
        },
        {
          label: "Item Group",
          value: item.item_group,
        },
      ],
    },
  ];

  return (
    <DataDescription
      sections={sections}
      formatValue={formatFieldValue}
      columns={2}
    />
  );
}
