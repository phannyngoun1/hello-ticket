/**
 * Shape Selector Component
 * 
 * Allows users to select and configure placement mark shapes
 */

import { Card, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from "@truths/ui";
import { Circle, Square, Hexagon } from "lucide-react";
import { PlacementShapeType, type PlacementShape } from "../types";
import { useState } from "react";

export interface ShapeSelectorProps {
  shape: PlacementShape | undefined;
  onShapeChange: (shape: PlacementShape) => void;
  label?: string;
}

export function ShapeSelector({
  shape,
  onShapeChange,
  label = "Shape",
}: ShapeSelectorProps) {
  const [localShape, setLocalShape] = useState<PlacementShape>(
    shape || {
      type: PlacementShapeType.CIRCLE,
      radius: 1.2,
    }
  );

  const handleTypeChange = (type: PlacementShapeType) => {
    const newShape: PlacementShape = {
      type,
      // Set default values based on shape type
      ...(type === PlacementShapeType.CIRCLE && { radius: 1.2 }),
      ...(type === PlacementShapeType.RECTANGLE && { width: 3, height: 2 }),
      ...(type === PlacementShapeType.ELLIPSE && { width: 3, height: 2 }),
      ...(type === PlacementShapeType.POLYGON && {
        points: [
          -1, -1, // top
          1, -1, // top right
          1.5, 0, // right
          1, 1, // bottom right
          -1, 1, // bottom left
          -1.5, 0, // left
        ],
      }),
    };
    setLocalShape(newShape);
    onShapeChange(newShape);
  };

  const handlePropertyChange = (property: keyof PlacementShape, value: number) => {
    const newShape = {
      ...localShape,
      [property]: value,
    };
    setLocalShape(newShape);
    onShapeChange(newShape);
  };

  return (
    <Card className="p-3">
      <div className="space-y-3">
        <div>
          <Label className="text-xs">{label}</Label>
          <Select
            value={localShape.type}
            onValueChange={(value) => handleTypeChange(value as PlacementShapeType)}
          >
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PlacementShapeType.CIRCLE}>
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4" />
                  <span>Circle</span>
                </div>
              </SelectItem>
              <SelectItem value={PlacementShapeType.RECTANGLE}>
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  <span>Rectangle</span>
                </div>
              </SelectItem>
              <SelectItem value={PlacementShapeType.ELLIPSE}>
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4" />
                  <span>Ellipse</span>
                </div>
              </SelectItem>
              <SelectItem value={PlacementShapeType.POLYGON}>
                <div className="flex items-center gap-2">
                  <Hexagon className="h-4 w-4" />
                  <span>Polygon</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shape-specific properties */}
        {localShape.type === PlacementShapeType.CIRCLE && (
          <div>
            <Label className="text-xs">Radius (% of image)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="50"
              value={localShape.radius || 1.2}
              onChange={(e) =>
                handlePropertyChange("radius", parseFloat(e.target.value) || 1.2)
              }
              className="mt-1 h-8 text-sm"
            />
          </div>
        )}

        {(localShape.type === PlacementShapeType.RECTANGLE ||
          localShape.type === PlacementShapeType.ELLIPSE) && (
          <>
            <div>
              <Label className="text-xs">Width (% of image)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={localShape.width || 3}
                onChange={(e) =>
                  handlePropertyChange("width", parseFloat(e.target.value) || 3)
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Height (% of image)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={localShape.height || 2}
                onChange={(e) =>
                  handlePropertyChange("height", parseFloat(e.target.value) || 2)
                }
                className="mt-1 h-8 text-sm"
              />
            </div>
            {localShape.type === PlacementShapeType.RECTANGLE && (
              <div>
                <Label className="text-xs">Corner Radius (px)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="20"
                  value={localShape.cornerRadius || 0}
                  onChange={(e) =>
                    handlePropertyChange(
                      "cornerRadius",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1 h-8 text-sm"
                />
              </div>
            )}
          </>
        )}

        {/* Rotation for all shapes */}
        <div>
          <Label className="text-xs">Rotation (degrees)</Label>
          <Input
            type="number"
            step="1"
            min="0"
            max="360"
            value={localShape.rotation || 0}
            onChange={(e) =>
              handlePropertyChange("rotation", parseFloat(e.target.value) || 0)
            }
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>
    </Card>
  );
}

