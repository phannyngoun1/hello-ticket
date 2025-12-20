/**
 * PlacementPanel Component
 *
 * Reusable panel component for placing and editing seats or sections
 * in the seat designer.
 */

import React from "react";
import { Button, Card } from "@truths/ui";
import { X, Trash2, Edit3, Plus } from "lucide-react";

export interface PlacementPanelProps {
  title: string;
  isEditing: boolean;
  editingInfo?: string;
  onClose: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  instructionText?: string;
  children: React.ReactNode;
}

export function PlacementPanel({
  title,
  isEditing,
  editingInfo,
  onClose,
  onDelete,
  isDeleting,
  instructionText,
  children,
}: PlacementPanelProps) {
  return (
    <Card
      className={`w-80 min-w-80 max-w-80 flex-shrink-0 ${isEditing ? "border-blue-500 border-2 shadow-lg" : ""}`}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isEditing ? (
              <Edit3 className="h-4 w-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <h4 className="font-medium truncate">{title}</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isEditing && editingInfo && (
          <div className="text-xs text-muted-foreground p-2 bg-blue-50 border border-blue-200 rounded">
            {editingInfo}
          </div>
        )}

        <div className="space-y-4">{children}</div>

        {isEditing && onDelete ? (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        ) : (
          instructionText && (
            <p className="text-xs text-muted-foreground">{instructionText}</p>
          )
        )}
      </div>
    </Card>
  );
}
