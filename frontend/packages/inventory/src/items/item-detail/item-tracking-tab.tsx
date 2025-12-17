/**
 * Item Tracking Tab
 *
 * Displays tracking configuration and UoM mappings
 *
 * @author Phanny
 */

import { Settings, Ruler } from "lucide-react";
import { Badge } from "@truths/ui";
import type { Item } from "../../types";
import {
  DataDescription,
  type DataDescriptionSection,
} from "@truths/custom-ui";
import {
  formatFieldValue,
  formatTrackingScope,
  formatUoMContext,
} from "./item-utils";

export interface ItemTrackingTabProps {
  item: Item;
}

export function ItemTrackingTab({ item }: ItemTrackingTabProps) {
  const sections: DataDescriptionSection[] = [
    {
      title: "Tracking Configuration",
      icon: Settings,
      fields: [
        {
          label: "Tracking Scope",
          value: item.tracking_scope ? (
            <Badge variant="outline">
              {formatTrackingScope(item.tracking_scope)}
            </Badge>
          ) : null,
        },
        {
          label: "Tracking Requirements",
          value:
            item.tracking_requirements &&
            item.tracking_requirements.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.tracking_requirements.map((req) => (
                  <Badge key={req} variant="outline" className="text-xs">
                    {req
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </Badge>
                ))}
              </div>
            ) : (
              <Badge variant="outline">None</Badge>
            ),
        },
      ],
    },
    {
      title: "Attributes",
      icon: Settings,
      fields: [
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
  ];

  return (
    <div className="space-y-6">
      <DataDescription
        sections={sections}
        formatValue={formatFieldValue}
        columns={2}
      />

      {/* UoM Mappings Section */}
      {item.uom_mappings && item.uom_mappings.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Unit of Measure Mappings
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Context
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    UoM Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Conversion Factor
                  </th>
                  {item.uom_mappings?.some((m) => m.is_primary) && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Primary
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {item.uom_mappings?.map((mapping, index) => (
                  <tr key={index} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {formatUoMContext(mapping.context)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono">
                      {mapping.uom_code}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {mapping.conversion_factor}
                    </td>
                    {item.uom_mappings?.some((m) => m.is_primary) && (
                      <td className="px-4 py-3">
                        {mapping.is_primary ? (
                          <Badge variant="default" className="text-xs">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
