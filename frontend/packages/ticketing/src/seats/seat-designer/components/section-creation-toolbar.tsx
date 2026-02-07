/**
 * Section Creation Toolbar Component
 *
 * Inline toolbar for creating a new section (shape + name).
 */

import React, { useState, useEffect } from "react";
import { Card, Input, Button } from "@truths/ui";
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
  selectedShapeType: PlacementShapeType | null;
  onShapeTypeSelect: (shapeType: PlacementShapeType | null) => void;
  onSave: (name: string) => void;
  onCancel: () => void;
  className?: string;
}

export function SectionCreationToolbar({
  initialName = "",
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
    <Card className={cn("px-2 py-2 flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 border-r pr-2 mr-1">
         {/* Pointer tool (deselect) */}
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
            <MousePointer2 className="h-4 w-4" />
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
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-1">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Section Name (e.g. Stage)"
          className="h-8 w-48"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!name.trim()}
          className="h-8 px-2"
        >
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
