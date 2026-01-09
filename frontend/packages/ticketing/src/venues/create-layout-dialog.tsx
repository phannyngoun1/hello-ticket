/**
 * Create Layout Dialog Component
 *
 * Dialog for creating a new layout for a venue.
 */

import React, { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import { useLayoutService, useCreateLayout } from "../layouts";
import type { Venue } from "./types";

export interface CreateLayoutDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Venue data */
  venue?: Venue;
}

/**
 * Dialog component for creating a new layout for a venue.
 *
 * @example
 * ```tsx
 * <CreateLayoutDialog
 *   open={isDialogOpen}
 *   onOpenChange={setIsDialogOpen}
 *   venue={venueData}
 * />
 * ```
 */
export function CreateLayoutDialog({
  open,
  onOpenChange,
  venue,
}: CreateLayoutDialogProps) {
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutDesignMode, setNewLayoutDesignMode] = useState<
    "seat-level" | "section-level"
  >("seat-level");

  // All hooks must be called before any early returns
  const layoutService = useLayoutService();
  const createLayoutMutation = useCreateLayout(layoutService);

  const handleCreateLayout = async () => {
    if (!venue || !newLayoutName.trim()) return;

    try {
      await createLayoutMutation.mutateAsync({
        venue_id: venue.id,
        name: newLayoutName.trim(),
        design_mode: newLayoutDesignMode,
      });
      setNewLayoutName("");
      setNewLayoutDesignMode("seat-level");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create layout:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Layout</DialogTitle>
          <DialogDescription>
            Create a new layout for this venue. Design mode cannot be changed
            after seats are added.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="layout-name">Layout Name</Label>
            <Input
              id="layout-name"
              placeholder="Layout name"
              value={newLayoutName}
              onChange={(e) => setNewLayoutName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newLayoutName.trim()) {
                  handleCreateLayout();
                }
              }}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="design-mode">Design Mode</Label>
            <Select
              value={newLayoutDesignMode}
              onValueChange={(v) =>
                setNewLayoutDesignMode(v as "seat-level" | "section-level")
              }
            >
              <SelectTrigger id="design-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seat-level">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Seat Level</span>
                    <span className="text-xs text-muted-foreground">
                      Place seats directly on venue floor plan
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="section-level">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Section Level</span>
                    <span className="text-xs text-muted-foreground">
                      Define sections first, then add seats to each section
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setNewLayoutName("");
              setNewLayoutDesignMode("seat-level");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateLayout}
            disabled={!newLayoutName.trim() || createLayoutMutation.isPending}
          >
            {createLayoutMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}