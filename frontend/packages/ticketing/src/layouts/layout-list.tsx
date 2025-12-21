/**
 * Layout List Component
 *
 * Displays a list of layouts for a venue with ability to add new layouts
 */

import React, { useState } from "react";
import { Button, Card } from "@truths/ui";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import {
  useLayoutsByVenue,
  useCreateLayout,
  useDeleteLayout,
} from "./use-layouts";
import { useLayoutService } from "./layout-provider";
import type { Layout } from "./types";

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

  const handleCreate = async () => {
    if (!newLayoutName.trim()) return;

    try {
      await createMutation.mutateAsync({
        venue_id: venueId,
        name: newLayoutName.trim(),
      });
      setNewLayoutName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create layout:", error);
    }
  };

  const handleDelete = async (layoutId: string) => {
    if (!confirm("Are you sure you want to delete this layout?")) return;

    try {
      await deleteMutation.mutateAsync(layoutId);
    } catch (error) {
      console.error("Failed to delete layout:", error);
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
            <input
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
                }
              }}
            />
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
  );
}
