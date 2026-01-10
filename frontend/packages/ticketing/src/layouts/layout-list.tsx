/**
 * Layout List Component
 *
 * Displays a list of layouts for a venue with ability to add new layouts
 */

import { useState, useMemo } from "react";
import {
  Card,
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  Badge,
} from "@truths/ui";
import {
  Edit,
  Trash2,
  MapPin,
  LayoutGrid,
  Loader2,
  Settings,
} from "lucide-react";
import { useLayoutsByVenue, useDeleteLayout } from "./use-layouts";
import { useLayoutService } from "./layout-provider";
import type { Layout } from "./types";
import {
  ConfirmationDialog,
  ActionButtonList,
  type ActionButtonItem,
} from "@truths/custom-ui";
import { cn } from "@truths/ui/lib/utils";

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
  const deleteMutation = useDeleteLayout(service);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState<string | null>(null);

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

  const getDesignModeLabel = (mode?: string) => {
    if (mode === "seat-level") return "Seat Level";
    if (mode === "section-level") return "Section Level";
    return "Not Set";
  };

  // Action button configuration
  const actionButtons: ActionButtonItem[] = useMemo(
    () => [
      {
        id: "designer",
        icon: <Settings className="h-4 w-4" />,
        title: "Open layout designer",
        onClick: (layout: Layout) => {
          if (onNavigateToDesigner) {
            onNavigateToDesigner(layout.id);
          }
        },
        show: !!onNavigateToDesigner,
      },
      {
        id: "edit",
        icon: <Edit className="h-4 w-4" />,
        title: "Edit layout info",
        onClick: (layout: Layout) => {
          if (onEdit) {
            onEdit(layout);
          }
        },
        show: !!onEdit,
      },
      {
        id: "delete",
        icon: <Trash2 className="h-4 w-4" />,
        title: "Delete layout",
        onClick: (layout: Layout) => handleDelete(layout.id),
        className:
          "text-destructive hover:text-destructive hover:bg-destructive/10",
        show: true,
      },
    ],
    [onNavigateToDesigner, onEdit, handleDelete]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading layouts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <MapPin className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">
              Error loading layouts
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {!layouts || layouts.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <LayoutGrid className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No layouts yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Click "Add Layout" in the header to create your first layout
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {layouts.map((layout) => (
              <Item
                key={layout.id}
                className={cn("group", !layout.is_active && "opacity-60")}
              >
                <ItemMedia>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                  </div>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <ItemTitle className="flex items-center gap-2">
                        <span className="truncate">{layout.name}</span>
                        {layout.design_mode && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            {getDesignModeLabel(layout.design_mode)}
                          </Badge>
                        )}
                        {!layout.is_active && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Inactive
                          </Badge>
                        )}
                      </ItemTitle>
                      {layout.description && (
                        <ItemDescription className="line-clamp-2">
                          {layout.description}
                        </ItemDescription>
                      )}
                      {!layout.description && (
                        <ItemDescription className="text-xs">
                          Created{" "}
                          {new Date(layout.created_at).toLocaleDateString()}
                        </ItemDescription>
                      )}
                    </div>
                  </div>
                </ItemContent>
                <ActionButtonList item={layout} actions={actionButtons} />
              </Item>
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
