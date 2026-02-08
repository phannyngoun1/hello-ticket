/**
 * Section Creation Toolbar Component
 *
 * Inline toolbar for creating a new section (shape + name) or editing (name only).
 * When editing, shape tools are hidden; style matches SeatEditControls (text-xs, h-6).
 */

import React, { useState, useEffect } from "react";
import { Card, Input } from "@truths/ui";
import { Check, X, MousePointer2 } from "lucide-react";
import { PlacementShapeType } from "../types";
import { cn } from "@truths/ui/lib/utils";
import {
  Circle,
  Square,
  Hexagon,
  PenTool,
} from "lucide-react";

export interface SectionCreationToolbarProps {
  initialName?: string;
  /** When true, hide shape tools and show only name + Save/Cancel (matches seat edit flow) */
  isEditing?: boolean;
  selectedShapeType: PlacementShapeType | null;
  onShapeTypeSelect: (shapeType: PlacementShapeType | null) => void;
  onSave: (name: string) => void;
  onCancel: () => void;
  className?: string;
}

export function SectionCreationToolbar({
  initialName = "",
  isEditing = false,
  selectedShapeType,
  onShapeTypeSelect,
  onSave,
  onCancel,
  className,
}: SectionCreationToolbarProps) {
  const [name, setName] = useState(initialName);

  // Update name when initialName changes
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  // Auto-focus input when component mounts
  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const shapes = [
    {
      type: PlacementShapeType.RECTANGLE,
      icon: Square,
      label: "Rectangle",
    },
    {
      type: PlacementShapeType.CIRCLE,
      icon: Circle,
      label: "Circle",
    },
    {
      type: PlacementShapeType.POLYGON,
      icon: Hexagon,
      label: "Polygon",
    },
    {
      type: PlacementShapeType.FREEFORM,
      icon: PenTool,
      label: "Freeform",
    },
  ];

  return (
    <Card className={cn("px-3 py-2.5 flex items-center gap-3 flex-wrap w-full", className)}>
      {!isEditing && (
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Shapes:
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onShapeTypeSelect(null)}
              className={cn(
                "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md",
                !selectedShapeType
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border"
              )}
              title="Pointer (Select)"
            >
              <MousePointer2 className="h-3.5 w-3.5" />
            </button>
            {shapes.map((shape) => {
              const Icon = shape.icon;
              const isSelected = selectedShapeType === shape.type;
              return (
                <button
                  key={shape.type}
                  type="button"
                  onClick={() => onShapeTypeSelect(shape.type)}
                  className={cn(
                    "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                    "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border"
                  )}
                  title={shape.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-2 flex-wrap",
          !isEditing && "border-l pl-2.5"
        )}
      >
        {isEditing && (
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0">
            Edit:
          </span>
        )}
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Section Name (e.g. Stage)"
          className="h-6 text-xs w-36 min-w-36"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className={cn(
              "flex items-center justify-center h-6 w-6 rounded border transition-all shrink-0",
              "hover:bg-primary hover:border-primary hover:text-primary-foreground",
              "bg-background border-border"
            )}
            title="Save"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "flex items-center justify-center h-6 w-6 rounded border transition-all shrink-0",
              "hover:bg-accent hover:border-accent-foreground",
              "bg-background border-border"
            )}
            title="Cancel"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </Card>
  );
}
