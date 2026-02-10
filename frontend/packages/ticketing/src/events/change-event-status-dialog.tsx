/**
 * Change Event Status Dialog
 *
 * Dialog for changing the status of an event with validation based on current status
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Alert,
  AlertDescription,
} from "@truths/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { EventStatus } from "./types";

export interface ChangeEventStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: EventStatus;
  onConfirm: (newStatus: EventStatus) => void | Promise<void>;
  loading?: boolean;
  eventTitle?: string;
}

// Define allowed status transitions
const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  [EventStatus.PUBLISHED]: [EventStatus.ON_SALE, EventStatus.CANCELLED],
  [EventStatus.ON_SALE]: [
    EventStatus.SOLD_OUT,
    EventStatus.COMPLETED,
    EventStatus.CANCELLED,
  ],
  [EventStatus.SOLD_OUT]: [
    EventStatus.ON_SALE,
    EventStatus.COMPLETED,
    EventStatus.CANCELLED,
  ],
  [EventStatus.CANCELLED]: [], // Cannot transition from cancelled
  [EventStatus.COMPLETED]: [], // Cannot transition from completed
};

const STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: "Draft",
  [EventStatus.PUBLISHED]: "Published",
  [EventStatus.ON_SALE]: "On Sale",
  [EventStatus.SOLD_OUT]: "Sold Out",
  [EventStatus.CANCELLED]: "Cancelled",
  [EventStatus.COMPLETED]: "Completed",
};

const STATUS_DESCRIPTIONS: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: "Event is in draft mode. Seats can be added or removed.",
  [EventStatus.PUBLISHED]:
    "Event is published but not yet on sale. Seats can be held or blocked.",
  [EventStatus.ON_SALE]: "Event is on sale. Customers can book seats.",
  [EventStatus.SOLD_OUT]: "Event is sold out. No more bookings available.",
  [EventStatus.CANCELLED]: "Event has been cancelled.",
  [EventStatus.COMPLETED]: "Event has been completed.",
};

const getStatusColor = (status: EventStatus): string => {
  switch (status) {
    case EventStatus.DRAFT:
      return "bg-gray-100 text-gray-800 border-gray-300";
    case EventStatus.PUBLISHED:
      return "bg-blue-100 text-blue-800 border-blue-300";
    case EventStatus.ON_SALE:
      return "bg-green-100 text-green-800 border-green-300";
    case EventStatus.SOLD_OUT:
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case EventStatus.CANCELLED:
      return "bg-red-100 text-red-800 border-red-300";
    case EventStatus.COMPLETED:
      return "bg-purple-100 text-purple-800 border-purple-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export function ChangeEventStatusDialog({
  open,
  onOpenChange,
  currentStatus,
  onConfirm,
  loading = false,
  eventTitle,
}: ChangeEventStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | null>(
    null,
  );

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  const canChangeStatus = allowedTransitions.length > 0;

  const handleConfirm = async () => {
    if (!selectedStatus) return;

    await onConfirm(selectedStatus);
    setSelectedStatus(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedStatus(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Change Event Status</DialogTitle>
          <DialogDescription>
            {eventTitle && (
              <span className="block mb-2 font-medium text-foreground">
                {eventTitle}
              </span>
            )}
            Update the status of this event. Status changes affect what actions
            can be performed on the event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${getStatusColor(currentStatus)}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {STATUS_LABELS[currentStatus]}
            </div>
            <p className="text-sm text-muted-foreground">
              {STATUS_DESCRIPTIONS[currentStatus]}
            </p>
          </div>

          {/* New Status Selection */}
          {canChangeStatus ? (
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select
                value={selectedStatus || ""}
                onValueChange={(value) =>
                  setSelectedStatus(value as EventStatus)
                }
              >
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStatus && (
                <p className="text-sm text-muted-foreground">
                  {STATUS_DESCRIPTIONS[selectedStatus]}
                </p>
              )}
            </div>
          ) : (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No status transitions available from the current status.{" "}
                {currentStatus === EventStatus.CANCELLED
                  ? "Cancelled events cannot be changed."
                  : "Completed events cannot be changed."}
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for critical transitions */}
          {selectedStatus === EventStatus.CANCELLED && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Cancelling an event cannot be undone.
                All bookings will need to be handled manually.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedStatus || loading}
            variant={
              selectedStatus === EventStatus.CANCELLED
                ? "destructive"
                : "default"
            }
          >
            {loading ? "Updating..." : "Change Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
