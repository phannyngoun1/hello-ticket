/**
 * Item Overview Tab
 *
 * Displays basic item information organized by basic info, configuration, and timeline
 *
 * @author Phanny
 */

import { Badge } from "@truths/ui";
import type { Item } from "../../types";
import {
  DataDescription,
  type DataDescriptionSection,
} from "@truths/custom-ui";
import { formatDate, formatFieldValue } from "./item-utils";

export interface ItemOverviewTabProps {
  item: Item;
}

export function ItemOverviewTab({ item }: ItemOverviewTabProps) {
  const sections: DataDescriptionSection[] = [
    {
      title: "Basic Information",
      fields: [
        {
          label: "SKU",
          value: item.sku,
        },
        {
          label: "Description",
          value: item.description,
          preserveWhitespace: true,
        },
      ],
    },
    {
      title: "Configuration",
      fields: [
        {
          label: "Default UoM",
          value: item.default_uom,
        },
        {
          label: "Perishable",
          value: (
            <Badge variant={item.perishable ? "default" : "outline"}>
              {item.perishable ? "Yes" : "No"}
            </Badge>
          ),
        },
      ],
    },
    {
      title: "Timeline",
      fields: [
        {
          label: "Created",
          value: item.createdAt || item.created_at,
          render: (value) => formatDate(value as Date | string),
        },
        {
          label: "Last Updated",
          value: item.updatedAt || item.updated_at,
          render: (value) => formatDate(value as Date | string),
        },
      ],
    },
  ];

  return (
    <DataDescription
      sections={sections}
      formatValue={formatFieldValue}
      columns={3}
    />
  );
}
