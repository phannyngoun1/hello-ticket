/**
 * Event Inventory Viewer – seat hover popover content
 */

import type { Seat } from "../../seats/types";
import type { EventSeat } from "../../events/types";
import { EventSeatStatus as EventSeatStatusEnum } from "../../events/types";
import { getSeatStatusColor } from "./event-inventory-viewer-utils";

export interface EventInventorySeatPopoverProps {
  seat: Seat;
  eventSeat?: EventSeat;
  sectionName: string;
  x: number;
  y: number;
}

export function EventInventorySeatPopover({
  seat,
  eventSeat,
  sectionName,
  x,
  y,
}: EventInventorySeatPopoverProps) {
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
          <h4 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">Seat Information</h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Section:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{sectionName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Row:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {seat.row || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Seat Number:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {seat.seat_number || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Seat Type:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {seat.seat_type || "STANDARD"}
              </span>
            </div>
          </div>
        </div>

        {eventSeat ? (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">Event Seat Status</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor:
                      getSeatStatusColor(eventSeat.status).fill + "20",
                    color: getSeatStatusColor(eventSeat.status).stroke,
                    border: `1px solid ${getSeatStatusColor(eventSeat.status).stroke}`,
                  }}
                >
                  {eventSeat.status}
                </span>
              </div>
              {(eventSeat.status === EventSeatStatusEnum.HELD ||
                eventSeat.status === EventSeatStatusEnum.BLOCKED) &&
                eventSeat.attributes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {eventSeat.status === EventSeatStatusEnum.HELD
                        ? "Hold"
                        : "Block"}{" "}
                      Reason:
                    </span>
                    <span
                      className="font-medium text-gray-900 dark:text-gray-100 max-w-32 truncate"
                      title={
                        eventSeat.status === EventSeatStatusEnum.HELD
                          ? eventSeat.attributes.hold_reason ||
                            "No reason provided"
                          : eventSeat.attributes.block_reason ||
                            "No reason provided"
                      }
                    >
                      {eventSeat.status === EventSeatStatusEnum.HELD
                        ? eventSeat.attributes.hold_reason ||
                          "No reason provided"
                        : eventSeat.attributes.block_reason ||
                          "No reason provided"}
                    </span>
                  </div>
                )}
              {eventSeat.ticket_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ticket Number:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {eventSeat.ticket_number}
                  </span>
                </div>
              )}
              {eventSeat.ticket_price !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ticket Price:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ${eventSeat.ticket_price.toFixed(2)}
                  </span>
                </div>
              )}
              {eventSeat.broker_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Broker ID:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {eventSeat.broker_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No event seat assigned</p>
          </div>
        )}
      </div>
    </div>
  );
}
