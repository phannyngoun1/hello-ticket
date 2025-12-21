/**
 * Layout List Component
 *
 * Displays a list of layouts for a venue with ability to add new layouts
 */

import React, { useState } from "react";
import { Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label } from "@truths/ui";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import {
  useLayoutsByVenue,
  useCreateLayout,
  useDeleteLayout,
} from "./use-layouts";
import { useLayoutService } from "./layout-provider";
import type { Layout } from "./types";
import { ConfirmationDialog } from "@truths/custom-ui";

export interface LayoutListProps {
  venueId: string;
  onNavigateToDesigner?: (layoutId: string) => void;
  onEdit?: (layout: Layout) => void;
}

export function LayoutList({
  venueId,
  onNavigateToDesigner,
  onEdit,
}: LayoutListProps) {
  // This hook requires LayoutProvider to be in the component tree
  const service = useLayoutService();
  const {
    data: layouts,
    isLoading,
    error,
  } = useLayoutsByVenue(service, venueId);
  const createMutation = useCreateLayout(service);
  const deleteMutation = useDeleteLayout(service);
  const [isCreating, setIsCreating] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutDesignMode, setNewLayoutDesignMode] = useState<"seat-level" | "section-level">("seat-level");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newLayoutName.trim()) return;

    try {
      await createMutation.mutateAsync({
        venue_id: venueId,
        name: newLayoutName.trim(),
        design_mode: newLayoutDesignMode,
      });
      setNewLayoutName("");
      setNewLayoutDesignMode("seat-level");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create layout:", error);
    }
  };

  const handleDelete = async (layoutId: string) => {
    setLayoutToDelete(layoutId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!layoutToDelete) return;

    try {
      await deleteMutation.mutateAsync(layoutToDelete);
      setDeleteConfirmOpen(false);
      setLayoutToDelete(null);
    } catch (error) {
      console.error("Failed to delete layout:", error);
      // Keep dialog open on error so user can see what happened
    }
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading layouts...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error loading layouts:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Layouts</h3>
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Layout
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="layout-name" className="text-sm font-medium mb-1.5 block">
                  Layout Name
                </Label>
                <input
                  id="layout-name"
                  type="text"
                  placeholder="Layout name"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreate();
                    } else if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewLayoutName("");
                      setNewLayoutDesignMode("seat-level");
                    }
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="design-mode" className="text-sm font-medium mb-1.5 block">
                  Design Mode
                </Label>
                <Select value={newLayoutDesignMode} onValueChange={(v) => setNewLayoutDesignMode(v as "seat-level" | "section-level")}>
                  <SelectTrigger id="design-mode" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seat-level">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Seat Level</span>
                        <span className="text-xs text-muted-foreground">Place seats directly on venue floor plan</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="section-level">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Section Level</span>
                        <span className="text-xs text-muted-foreground">Define sections first, then add seats to each section</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Design mode cannot be changed after seats are added
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                size="sm"
                disabled={!newLayoutName.trim()}
              >
                Create
              </Button>
              <Button
                onClick={() => {
                  setIsCreating(false);
                  setNewLayoutName("");
                  setNewLayoutDesignMode("seat-level");
                }}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!layouts || layouts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No layouts yet. Click "Add Layout" to create one.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {layouts.map((layout) => (
            <Card key={layout.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{layout.name}</h4>
                  {layout.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {layout.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {onNavigateToDesigner && (
                      <Button
                        onClick={() => onNavigateToDesigner(layout.id)}
                        size="sm"
                        variant="outline"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Design
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        onClick={() => onEdit(layout)}
                        size="sm"
                        variant="ghost"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(layout.id)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>

    <ConfirmationDialog
      open={deleteConfirmOpen}
      onOpenChange={setDeleteConfirmOpen}
      title="Delete Layout"
      description="Are you sure you want to delete this layout? This action cannot be undone and will remove all associated seats."
      confirmAction={{
        label: "Delete",
        variant: "destructive",
        onClick: handleConfirmDelete,
        loading: deleteMutation.isPending,
      }}
      cancelAction={{
        label: "Cancel",
      }}
    />
  </>
  );
}
