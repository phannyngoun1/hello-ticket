/**
 * Seat Viewer Component
 *
 * Displays seats for a venue with options to view as floor plan or datatable.
 * If no floor plan exists, shows a button to create one.
 */

import React, { useState, useMemo } from "react";
import {
  Button,
  Card,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@truths/ui";
import { Map, Table as TableIcon, Plus, Edit } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { seatService } from "../seat-service";
import type { Seat } from "../types";
import { SeatType } from "../types";
import { useQuery } from "@tanstack/react-query";
import {
  Stage,
  Layer,
  Image,
  Circle,
  Rect,
  Ellipse,
  Line,
  Group,
  Text,
} from "react-konva";
import { PlacementShapeType, type PlacementShape } from "./types";
import {
  DEFAULT_CANVAS_BACKGROUND,
  GRAY_FILL,
  GRAY_STROKE,
  getSeatTypeColors,
} from "./colors";

export interface SeatViewerProps {
  venueId: string;
  imageUrl?: string;
  className?: string;
  onNavigateToDesigner?: (venueId: string) => void;
}

export function SeatViewer({
  venueId,
  imageUrl,
  className,
  onNavigateToDesigner,
}: SeatViewerProps) {
  const [viewMode, setViewMode] = useState<"floorplan" | "table">("floorplan");

  // Fetch seats
  const { data: seatsData, isLoading } = useQuery({
    queryKey: ["seats", venueId],
    queryFn: () => seatService.getByVenue(venueId),
    enabled: !!venueId,
  });

  const seats = seatsData?.items || [];
  const hasFloorPlan = !!imageUrl;
  const hasSeats = seats.length > 0;

  const handleCreateFloorPlan = () => {
    console.log("handleCreateFloorPlan", {
      venueId,
      hasCallback: !!onNavigateToDesigner,
    });
    if (onNavigateToDesigner) {
      try {
        onNavigateToDesigner(venueId);
      } catch (error) {
        console.error("Navigation error:", error);
        window.location.href = `/ticketing/venues/${venueId}/seats/designer`;
      }
    } else {
      // Fallback to window.location if no callback provided
      window.location.href = `/ticketing/venues/${venueId}/seats/designer`;
    }
  };

  const handleEditFloorPlan = () => {
    console.log("handleEditFloorPlan", {
      venueId,
      hasCallback: !!onNavigateToDesigner,
    });
    if (onNavigateToDesigner) {
      try {
        onNavigateToDesigner(venueId);
      } catch (error) {
        console.error("Navigation error:", error);
        window.location.href = `/ticketing/venues/${venueId}/seats/designer`;
      }
    } else {
      // Fallback to window.location if no callback provided
      window.location.href = `/ticketing/venues/${venueId}/seats/designer`;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="p-6">
          <div className="text-center py-8">Loading seats...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Seats</h3>
          <div className="flex gap-2">
            {hasFloorPlan ? (
              <Button variant="outline" size="sm" onClick={handleEditFloorPlan}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Floor Plan
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateFloorPlan}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Floor Plan
              </Button>
            )}
          </div>
        </div>

        {!hasFloorPlan && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <Map className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium mb-2">
              No Floor Plan Available
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Create a floor plan to visualize and manage seats on a venue
              layout.
            </p>
            {Link ? (
              <Link
                to="/ticketing/venues/$id/seats/designer"
                params={{ id: venueId }}
                className="inline-flex"
              >
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Floor Plan
                </Button>
              </Link>
            ) : (
              <Button onClick={handleCreateFloorPlan}>
                <Plus className="h-4 w-4 mr-2" />
                Create Floor Plan
              </Button>
            )}
          </div>
        )}

        {hasFloorPlan && (
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="floorplan">
                <Map className="h-4 w-4 mr-2" />
                Floor Plan
              </TabsTrigger>
              <TabsTrigger value="table">
                <TableIcon className="h-4 w-4 mr-2" />
                Data Table
              </TabsTrigger>
            </TabsList>

            <TabsContent value="floorplan" className="mt-4">
              <FloorPlanView imageUrl={imageUrl} seats={seats} />
            </TabsContent>

            <TabsContent value="table" className="mt-4">
              <DataTableView seats={seats} />
            </TabsContent>
          </Tabs>
        )}

        {hasFloorPlan && !hasSeats && (
          <div className="text-center py-8 text-gray-500">
            <p>No seats have been added yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditFloorPlan}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Seats
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

interface FloorPlanViewProps {
  imageUrl?: string;
  seats: Seat[];
}

function FloorPlanView({ imageUrl, seats }: FloorPlanViewProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });

  // Load image
  React.useEffect(() => {
    if (imageUrl) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        // Set container size based on image
        const aspectRatio = img.width / img.height;
        const maxWidth = 1200;
        const maxHeight = 800;
        let width = maxWidth;
        let height = maxWidth / aspectRatio;
        if (height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }
        setContainerSize({ width, height });
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  // Parse seat shapes
  const seatsWithShapes = useMemo(() => {
    return seats.map((seat) => {
      let shape: PlacementShape | undefined;
      if (seat.shape) {
        try {
          const parsed = JSON.parse(seat.shape);
          if (parsed && typeof parsed === "object" && parsed.type) {
            shape = {
              ...parsed,
              type: parsed.type as PlacementShapeType,
            };
          }
        } catch (e) {
          console.error("Failed to parse seat shape:", e);
        }
      }
      return { ...seat, parsedShape: shape };
    });
  }, [seats]);

  if (!imageUrl) {
    // Simple floor mode: render seats on blank canvas
    if (seatsWithShapes.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No floor plan image. Add seats in the designer.
        </div>
      );
    }
    const noImageWidth = 800;
    const noImageHeight = 600;
    const noImageScale = 1;
    const getSeatColorNoImage = (seatType: SeatType) => {
      // Use centralized color constants for consistency
      const colors = getSeatTypeColors(seatType);
      // Override default (Standard) to use gray for no-image mode
      if (seatType === SeatType.STANDARD) {
        return { fill: GRAY_FILL, stroke: GRAY_STROKE };
      }
      return colors;
    };
    return (
      <div
        className="relative border rounded-lg overflow-hidden bg-blue-50"
        style={{ width: noImageWidth, height: noImageHeight }}
      >
        <Stage width={noImageWidth} height={noImageHeight}>
          <Layer>
            <Rect
              x={0}
              y={0}
              width={noImageWidth}
              height={noImageHeight}
              fill={DEFAULT_CANVAS_BACKGROUND}
            />
            {seatsWithShapes.map((seat) => {
              if (!seat.x_coordinate || !seat.y_coordinate) return null;
              const x = (seat.x_coordinate / 100) * noImageWidth;
              const y = (seat.y_coordinate / 100) * noImageHeight;
              const colors = getSeatColorNoImage(seat.seat_type as SeatType);
              const markerLabel = `${seat.section_name || "?"} ${seat.row}-${seat.seat_number}`;
              const shapeEl = seat.parsedShape ? (
                (() => {
                  const s = seat.parsedShape!;
                  const bp = {
                    fill: colors.fill,
                    stroke: colors.stroke,
                    strokeWidth: 2,
                    opacity: 0.8,
                  };
                  if (s.type === PlacementShapeType.CIRCLE) {
                    const r = s.radius
                      ? (s.radius / 100) *
                        Math.min(noImageWidth, noImageHeight) *
                        noImageScale
                      : 6 * noImageScale;
                    return <Circle {...bp} radius={Math.max(1, r)} />;
                  }
                  if (s.type === PlacementShapeType.RECTANGLE) {
                    const w = s.width
                      ? (s.width / 100) * noImageWidth * noImageScale
                      : 24;
                    const h = s.height
                      ? (s.height / 100) * noImageHeight * noImageScale
                      : 24;
                    return (
                      <Rect
                        {...bp}
                        x={-w / 2}
                        y={-h / 2}
                        width={w}
                        height={h}
                        cornerRadius={
                          s.cornerRadius
                            ? Math.min(
                                (s.cornerRadius / 100) * noImageWidth,
                                Math.min(w, h) / 2,
                              )
                            : 0
                        }
                      />
                    );
                  }
                  if (s.type === PlacementShapeType.ELLIPSE) {
                    const rx = s.width
                      ? ((s.width / 100) * noImageWidth) / 2
                      : 12;
                    const ry = s.height
                      ? ((s.height / 100) * noImageHeight) / 2
                      : 12;
                    return <Ellipse {...bp} radiusX={rx} radiusY={ry} />;
                  }
                  if (
                    (s.type === PlacementShapeType.POLYGON ||
                      s.type === PlacementShapeType.FREEFORM) &&
                    (s.points?.length ?? 0) >= 4
                  ) {
                    const pts = (s.points ?? []).map((p, i) =>
                      i % 2 === 0
                        ? (p / 100) * noImageWidth * noImageScale
                        : (p / 100) * noImageHeight * noImageScale,
                    );
                    return <Line {...bp} points={pts} closed tension={0} />;
                  }
                  return (
                    <Circle
                      radius={6 * noImageScale}
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={2}
                    />
                  );
                })()
              ) : (
                <Circle
                  radius={6 * noImageScale}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={2}
                />
              );
              return (
                <Group key={seat.id} x={x} y={y}>
                  {shapeEl}
                  <Text
                    text={markerLabel}
                    fontSize={10}
                    fill="#374151"
                    offsetX={-20}
                    offsetY={12}
                    listening={false}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading floor plan...
      </div>
    );
  }

  const imageWidth = image.width;
  const imageHeight = image.height;
  const scale = containerSize.width / imageWidth;

  const getSeatColor = (seatType: SeatType) => {
    switch (seatType) {
      case SeatType.VIP:
        return { fill: "#fbbf24", stroke: "#d97706" };
      case SeatType.WHEELCHAIR:
        return { fill: "#34d399", stroke: "#059669" };
      default:
        return { fill: "#d1d5db", stroke: "#6b7280" };
    }
  };

  const renderShape = (
    shape: PlacementShape | undefined,
    colors: { fill: string; stroke: string },
    imgWidth: number,
    imgHeight: number,
    defaultRadius: number = 6,
  ) => {
    if (!shape) {
      return (
        <Circle
          radius={defaultRadius * scale}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={2}
        />
      );
    }

    const baseProps = {
      fill: colors.fill,
      stroke: colors.stroke,
      strokeWidth: 2,
      opacity: 0.8,
    };

    switch (shape.type) {
      case PlacementShapeType.CIRCLE: {
        const radius = shape.radius
          ? (shape.radius / 100) * Math.min(imgWidth, imgHeight) * scale
          : defaultRadius * scale;
        const validRadius = Math.max(1, Math.abs(radius));
        return (
          <Circle
            {...baseProps}
            radius={validRadius}
            rotation={shape.rotation || 0}
          />
        );
      }
      case PlacementShapeType.RECTANGLE: {
        const width = shape.width
          ? (shape.width / 100) * imgWidth * scale
          : 24 * scale;
        const height = shape.height
          ? (shape.height / 100) * imgHeight * scale
          : 24 * scale;
        const validWidth = Math.max(1, Math.abs(width));
        const validHeight = Math.max(1, Math.abs(height));
        const cornerRadius = shape.cornerRadius
          ? Math.min(
              (shape.cornerRadius / 100) * imgWidth * scale,
              Math.min(validWidth, validHeight) / 2,
            )
          : 0;
        return (
          <Rect
            {...baseProps}
            x={-validWidth / 2}
            y={-validHeight / 2}
            width={validWidth}
            height={validHeight}
            cornerRadius={cornerRadius}
            rotation={shape.rotation || 0}
          />
        );
      }
      case PlacementShapeType.ELLIPSE: {
        const radiusX = shape.width
          ? ((shape.width / 100) * imgWidth * scale) / 2
          : 12 * scale;
        const radiusY = shape.height
          ? ((shape.height / 100) * imgHeight * scale) / 2
          : 12 * scale;
        const validRadiusX = Math.max(1, Math.abs(radiusX));
        const validRadiusY = Math.max(1, Math.abs(radiusY));
        return (
          <Ellipse
            {...baseProps}
            radiusX={validRadiusX}
            radiusY={validRadiusY}
            rotation={shape.rotation || 0}
          />
        );
      }
      case PlacementShapeType.POLYGON:
      case PlacementShapeType.FREEFORM: {
        if (!shape.points || shape.points.length < 4) {
          return <Circle {...baseProps} radius={defaultRadius * scale} />;
        }
        const points = shape.points.map((p, index) => {
          if (index % 2 === 0) {
            return (p / 100) * imgWidth * scale;
          } else {
            return (p / 100) * imgHeight * scale;
          }
        });
        return (
          <Line
            {...baseProps}
            points={points}
            closed={true}
            tension={shape.type === PlacementShapeType.FREEFORM ? 0 : undefined}
          />
        );
      }
      default:
        return <Circle {...baseProps} radius={defaultRadius * scale} />;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-100">
      <Stage width={containerSize.width} height={containerSize.height}>
        <Layer>
          <Image
            image={image}
            width={containerSize.width}
            height={containerSize.height}
            x={0}
            y={0}
          />
          {seatsWithShapes.map((seat) => {
            if (!seat.x_coordinate || !seat.y_coordinate) return null;
            const x = (seat.x_coordinate / 100) * containerSize.width;
            const y = (seat.y_coordinate / 100) * containerSize.height;
            const configFill = seat.parsedShape?.fillColor?.trim();
            const configStroke = seat.parsedShape?.strokeColor?.trim();
            const defaults = getSeatColor(seat.seat_type);
            const isDefaultOrEmpty = (v: string | undefined, d: string) =>
              !v ||
              v.toLowerCase().replace(/^#/, "") ===
                d.toLowerCase().replace(/^#/, "");
            const colors = {
              fill: !isDefaultOrEmpty(configFill, "#60a5fa")
                ? configFill!
                : defaults.fill,
              stroke: !isDefaultOrEmpty(configStroke, "#2563eb")
                ? configStroke!
                : defaults.stroke,
            };

            const markerLabel = `${seat.section_name || "?"} ${seat.row}-${seat.seat_number}`;

            return (
              <Group key={seat.id} x={x} y={y}>
                {renderShape(seat.parsedShape, colors, imageWidth, imageHeight)}
                <Text
                  text={markerLabel}
                  fontSize={10}
                  fontFamily="Arial"
                  fill="#1e293b"
                  padding={2}
                  align="center"
                  verticalAlign="middle"
                  listening={false}
                  x={-24}
                  y={8}
                  width={48}
                  backgroundFill="rgba(255, 255, 255, 0.9)"
                  backgroundStroke="#e2e8f0"
                  backgroundStrokeWidth={1}
                  cornerRadius={2}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

interface DataTableViewProps {
  seats: Seat[];
}

function DataTableView({ seats }: DataTableViewProps) {
  if (seats.length === 0) {
    return <div className="text-center py-8 text-gray-500">No seats found</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">
                Section
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Row</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Seat Number
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Coordinates
              </th>
            </tr>
          </thead>
          <tbody>
            {seats.map((seat) => (
              <tr
                key={seat.id}
                className="border-b hover:bg-muted/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium">
                  {seat.section_name || "N/A"}
                </td>
                <td className="px-4 py-3">{seat.row}</td>
                <td className="px-4 py-3">{seat.seat_number}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      seat.seat_type === SeatType.VIP
                        ? "bg-yellow-100 text-yellow-800"
                        : seat.seat_type === SeatType.WHEELCHAIR
                          ? "bg-green-100 text-green-800"
                          : seat.seat_type === SeatType.COMPANION
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {seat.seat_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      seat.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {seat.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {seat.x_coordinate != null && seat.y_coordinate != null
                    ? `(${seat.x_coordinate.toFixed(1)}, ${seat.y_coordinate.toFixed(1)})`
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
