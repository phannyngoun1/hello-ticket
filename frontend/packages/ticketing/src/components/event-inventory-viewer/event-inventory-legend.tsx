/**
 * Event Inventory Viewer – seat status legend
 */

import { EventSeatStatus } from "../../events/types";
import { getSeatStatusColor } from "./event-inventory-viewer-utils";
import { cn } from "@truths/ui/lib/utils";

export interface EventInventoryLegendProps {
  className?: string;
}

export function EventInventoryLegend({ className }: EventInventoryLegendProps) {
  return (
    <div
      className={cn(
        "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      <div className="text-xs font-medium mb-2 text-gray-900 dark:text-gray-100">
        Seat Status
      </div>
      <div className="space-y-1">
        {Object.entries(EventSeatStatus).map(([key, value]) => {
          const colors = getSeatStatusColor(value);
          return (
            <div
              key={key}
              className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: colors.fill,
                  border: `1px solid ${colors.stroke}`,
                }}
              />
              <span>{key}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
