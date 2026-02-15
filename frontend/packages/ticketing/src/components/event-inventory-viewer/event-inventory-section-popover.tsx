/**
 * Event Inventory Viewer – section hover popover content
 */

import type { Section } from "../../layouts/types";
import type { EventSeatStatus } from "../../events/types";
import { getSeatStatusColor } from "./event-inventory-viewer-utils";

export interface EventInventorySectionPopoverProps {
  section: Section;
  seatCount: number;
  eventSeatCount: number;
  statusSummary: Record<string, number>;
  x: number;
  y: number;
}

export function EventInventorySectionPopover({
  section,
  seatCount,
  eventSeatCount,
  statusSummary,
  x,
  y,
}: EventInventorySectionPopoverProps) {
  return (
    <div
      className="fixed z-[9999] rounded-lg border border-gray-300 bg-white p-4 shadow-2xl dark:border-gray-600 dark:bg-gray-900"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        pointerEvents: "none",
        width: "320px",
        opacity: 1,
        backdropFilter: "none",
      }}
    >
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">Section Information</h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Section Name:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{section.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Seats:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{seatCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Event Seats:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {eventSeatCount} / {seatCount}
              </span>
            </div>
          </div>
        </div>

        {Object.keys(statusSummary).length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">Status Summary</h4>
            <div className="space-y-1.5 text-sm">
              {Object.entries(statusSummary).map(([status, count]) => {
                const colors = getSeatStatusColor(status as EventSeatStatus);
                return (
                  <div
                    key={status}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: colors.fill,
                          border: `1px solid ${colors.stroke}`,
                        }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">{status}:</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
