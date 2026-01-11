/**
 * Hold/Block Seats Dialog
 *
 * Uses the shared ConfirmationDialog from custom-ui for consistency,
 * with custom footer containing the reason textarea.
 */

import { ConfirmationDialog } from "@truths/custom-ui";
import { Button } from "@truths/ui";
import { Textarea } from "@truths/ui";
import { Label } from "@truths/ui";
import { useState } from "react";

export interface HoldBlockSeatsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableSeatIds: Set<string>;
  action: "hold" | "block" | "unhold" | "unblock";
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
}

export function HoldBlockSeatsDialog({
  isOpen,
  onOpenChange,
  availableSeatIds,
  action,
  onConfirm,
  isLoading = false,
}: HoldBlockSeatsDialogProps) {
  const [reason, setReason] = useState("");

  const actionLabel =
    action === "hold"
      ? "Hold"
      : action === "unhold"
        ? "Unhold"
        : action === "unblock"
          ? "Unblock"
          : "Block";

  const handleConfirm = () => {
    const trimmedReason = reason.trim();
    onConfirm(trimmedReason || undefined);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  // Custom footer with reason textarea and buttons
  const customFooter = (
    <div className="space-y-4">
      {/* Reason textarea - only show for hold and block */}
      {action !== "unhold" && (
        <div className="space-y-2">
          <Label htmlFor="reason" className="text-sm font-medium">
            Reason (Optional)
          </Label>
          <Textarea
            id="reason"
            placeholder={`Enter reason for ${action.toLowerCase()}ing seats...`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            This reason will be visible to administrators and can help track why
            seats were {action.toLowerCase()}ed.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          variant={action === "block" ? "destructive" : "default"}
          size="default"
        >
          {isLoading
            ? "Processing..."
            : `${actionLabel} ${availableSeatIds.size} Seat${availableSeatIds.size !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );

  return (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={onOpenChange}
      title={`${actionLabel} ${availableSeatIds.size} Seat${availableSeatIds.size !== 1 ? "s" : ""}`}
      description={
        action === "hold"
          ? `These ${availableSeatIds.size} available seat${availableSeatIds.size !== 1 ? "s" : ""} will be temporarily held and cannot be sold. You can provide an optional reason for the hold.`
          : action === "unhold"
            ? `These ${availableSeatIds.size} held seat${availableSeatIds.size !== 1 ? "s" : ""} will be released and become available for sale again.`
            : action === "unblock"
              ? `These ${availableSeatIds.size} blocked seat${availableSeatIds.size !== 1 ? "s" : ""} will be unblocked and become available for sale again.`
              : `These ${availableSeatIds.size} available seat${availableSeatIds.size !== 1 ? "s" : ""} will be blocked and permanently unavailable for sale. You can provide an optional reason for the block.`
      }
      footer={customFooter}
      className="sm:max-w-[500px]"
    />
  );
}
