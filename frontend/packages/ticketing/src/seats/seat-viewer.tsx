/**
 * Seat Viewer Component
 *
 * Displays seats for a venue with options to view as floor plan or datatable.
 * If no floor plan exists, shows a button to create one.
 */

import React, { useState } from "react";
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
import { seatService } from "./seat-service";
import type { Seat } from "./types";
import { SeatType } from "./types";
import { useQuery } from "@tanstack/react-query";

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
  if (!imageUrl) {
    return (
      <div className="text-center py-8 text-gray-500">
        No floor plan image available
      </div>
    );
  }

  return (
    <div className="relative border rounded-lg overflow-hidden bg-gray-100">
      <img
        src={imageUrl}
        alt="Venue layout"
        className="w-full h-auto"
        style={{ minHeight: "400px", objectFit: "contain" }}
      />
      {seats.map((seat) => (
        <div
          key={seat.id}
          className={`absolute w-5 h-5 rounded-full border-2 ${
            seat.seat_type === SeatType.VIP
              ? "bg-yellow-400 border-yellow-600"
              : seat.seat_type === SeatType.WHEELCHAIR
                ? "bg-green-400 border-green-600"
                : "bg-gray-300 border-gray-500"
          }`}
          style={{
            left: `${seat.x_coordinate || 0}%`,
            top: `${seat.y_coordinate || 0}%`,
            transform: "translate(-50%, -50%)",
          }}
          title={`${seat.section} ${seat.row} ${seat.seat_number} (${seat.seat_type})`}
        />
      ))}
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
                <td className="px-4 py-3 font-medium">{seat.section}</td>
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
                  {seat.x_coordinate !== null && seat.y_coordinate !== null
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
