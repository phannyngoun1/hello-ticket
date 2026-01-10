/**
 * Edit Layout Dialog Component
 *
 * Dialog for editing an existing layout for a venue.
 */

import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Textarea,
} from "@truths/ui";
import { useLayoutService, useUpdateLayout } from "../layouts";
import type { Layout } from "../layouts/types";

export interface EditLayoutDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Layout data to edit */
  layout?: Layout;
}

/**
 * Dialog component for editing an existing layout for a venue.
 *
 * @example
 * ```tsx
 * <EditLayoutDialog
 *   open={isDialogOpen}
 *   onOpenChange={setIsDialogOpen}
 *   layout={layoutData}
 * />
 * ```
 */
export function EditLayoutDialog({
  open,
  onOpenChange,
  layout,
}: EditLayoutDialogProps) {
  const [layoutName, setLayoutName] = useState("");
  const [layoutDescription, setLayoutDescription] = useState("");

  // All hooks must be called before any early returns
  const layoutService = useLayoutService();
  const updateLayoutMutation = useUpdateLayout(layoutService);

  // Update form values when layout changes
  useEffect(() => {
    if (layout) {
      setLayoutName(layout.name || "");
      setLayoutDescription(layout.description || "");
    }
  }, [layout]);

  const handleUpdateLayout = async () => {
    if (!layout || !layoutName.trim()) return;

    try {
      await updateLayoutMutation.mutateAsync({
        id: layout.id,
        input: {
          name: layoutName.trim(),
          description: layoutDescription.trim() || undefined,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update layout:", error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset form to original values
    if (layout) {
      setLayoutName(layout.name || "");
      setLayoutDescription(layout.description || "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Layout</DialogTitle>
          <DialogDescription>
            Update the layout information for "{layout?.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="layout-name">Layout Name</Label>
            <Input
              id="layout-name"
              placeholder="Layout name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && layoutName.trim()) {
                  handleUpdateLayout();
                }
              }}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="layout-description">Description</Label>
            <Textarea
              id="layout-description"
              placeholder="Layout description (optional)"
              value={layoutDescription}
              onChange={(e) => setLayoutDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateLayout}
            disabled={!layoutName.trim() || updateLayoutMutation.isPending}
          >
            {updateLayoutMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}