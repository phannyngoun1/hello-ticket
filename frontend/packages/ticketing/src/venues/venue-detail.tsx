/**
 * Venue Detail Component
 *
 * Display detailed information about a venue with optional edit and activity views.
 */

import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
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
import { cn } from "@truths/ui/lib/utils";
import { Edit, MoreVertical, Info, Database, MapPin, Plus, LayoutGrid } from "lucide-react";
import { Venue } from "./types";
import { LayoutList, useLayoutService, useCreateLayout, useLayoutsByVenue } from "../layouts";

export interface VenueDetailProps {
  className?: string;
  data?: Venue;
  loading?: boolean;
  error?: Error | null;

  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;
  onEdit?: (data: Venue) => void;
  onNavigateToSeatDesigner?: (venueId: string, layoutId: string) => void;

  customActions?: (data: Venue) => React.ReactNode;
}

export function VenueDetail({
  className,
  data,
  loading = false,
  error = null,

  showMetadata = false,
  editable = true,
  onEdit,
  onNavigateToSeatDesigner,

  customActions,
}: VenueDetailProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "seats" | "metadata">(
    "seats"
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutDesignMode, setNewLayoutDesignMode] = useState<"seat-level" | "section-level">("seat-level");

  // All hooks must be called before any early returns
  const layoutService = useLayoutService();
  const createLayoutMutation = useCreateLayout(layoutService);
  const { data: layouts } = useLayoutsByVenue(layoutService, data?.id ?? null);

  const getVenueDisplayName = () => {
    return data?.name || data?.id || "";
  };

  const displayName = useMemo(
    () => (data ? getVenueDisplayName() : ""),
    [data, data?.name]
  );

  const formatDate = (value?: Date | string) => {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };

  const formatFieldValue = (value: unknown) => {
    if (value === null || value === undefined) return "N/A";
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "N/A";
      const potentialDate = new Date(trimmed);
      if (!Number.isNaN(potentialDate.getTime())) {
        return potentialDate.toLocaleString();
      }
      return trimmed;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error: {error.message}</div>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No venue selected</div>
        </div>
      </Card>
    );
  }

  const hasMetadata = showMetadata;

  const handleCreateLayout = async () => {
    if (!data || !newLayoutName.trim()) return;

    try {
      await createLayoutMutation.mutateAsync({
        venue_id: data.id,
        name: newLayoutName.trim(),
        design_mode: newLayoutDesignMode,
      });
      setNewLayoutName("");
      setNewLayoutDesignMode("seat-level");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Failed to create layout:", error);
    }
  };

  return (
    <Card className={cn("p-6", className)}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
              <Info className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>
              {data.code && (
                <p className="text-sm text-muted-foreground mt-1">
                  Code: {data.code}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {customActions?.(data)}
              {editable && onEdit && (
                <Button
                  onClick={() => onEdit(data)}
                  size="sm"
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Layout
              </Button>
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {editable && onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(data)}>
                      <Edit className="mr-2 h-3.5 w-3.5" /> Edit venue
                    </DropdownMenuItem>
                  )}

                  {customActions && customActions(data)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="border-b mb-4">
            <div className="flex gap-4">
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "seats"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("seats")}
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Layout
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("profile")}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Information
                </span>
              </button>
              {hasMetadata && (
                <button
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "metadata"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("metadata")}
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Metadata
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-0">
            {/* Information Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Description */}
                {data.description && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Description
                    </h3>
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {data.description}
                    </p>
                  </div>
                )}

                {/* Statistics */}
                <div>
                  <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Statistics
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm font-medium">Layouts</dt>
                      <dd className="mt-1 text-2xl font-semibold">
                        {layouts?.length ?? 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">Sections</dt>
                      <dd className="mt-1 text-2xl font-semibold">
                        {/* TODO: Calculate from layouts when sections data is available */}
                        -
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">Seats</dt>
                      <dd className="mt-1 text-2xl font-semibold">
                        {/* TODO: Calculate from layouts when seats data is available */}
                        -
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Venue Details
                    </h3>
                    <dl className="space-y-3">
                      {data.venue_type && (
                        <div>
                          <dt className="text-sm font-medium">Venue Type</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.venue_type)}
                          </dd>
                        </div>
                      )}
                      {data.capacity && (
                        <div>
                          <dt className="text-sm font-medium">Capacity</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {data.capacity.toLocaleString()} seats
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Facilities
                    </h3>
                    <dl className="space-y-3">
                      {data.parking_info && (
                        <div>
                          <dt className="text-sm font-medium">Parking</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.parking_info)}
                          </dd>
                        </div>
                      )}
                      {data.accessibility && (
                        <div>
                          <dt className="text-sm font-medium">Accessibility</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.accessibility)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Additional Information
                    </h3>
                    <dl className="space-y-3">
                      {data.amenities && data.amenities.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium">Amenities</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            <div className="flex flex-wrap gap-1">
                              {data.amenities.map((amenity, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </dd>
                        </div>
                      )}
                      {data.opening_hours && (
                        <div>
                          <dt className="text-sm font-medium">Opening Hours</dt>
                          <dd className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                            {formatFieldValue(data.opening_hours)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Contact Information
                    </h3>
                    <dl className="space-y-3">
                      {data.phone && (
                        <div>
                          <dt className="text-sm font-medium">Phone</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            <a href={`tel:${data.phone}`} className="hover:underline">
                              {data.phone}
                            </a>
                          </dd>
                        </div>
                      )}
                      {data.email && (
                        <div>
                          <dt className="text-sm font-medium">Email</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            <a href={`mailto:${data.email}`} className="hover:underline">
                              {data.email}
                            </a>
                          </dd>
                        </div>
                      )}
                      {data.website && (
                        <div>
                          <dt className="text-sm font-medium">Website</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            <a href={data.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {data.website}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Address
                    </h3>
                    <dl className="space-y-3">
                      {data.street_address && (
                        <div>
                          <dt className="text-sm font-medium">Street</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {data.street_address}
                          </dd>
                        </div>
                      )}
                      {(data.city || data.state_province || data.postal_code) && (
                        <div>
                          <dt className="text-sm font-medium">City, State, ZIP</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {[data.city, data.state_province, data.postal_code].filter(Boolean).join(", ")}
                          </dd>
                        </div>
                      )}
                      {data.country && (
                        <div>
                          <dt className="text-sm font-medium">Country</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {data.country}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Timeline
                    </h3>
                    <dl className="space-y-3">
                      {data.created_at && (
                        <div>
                          <dt className="text-sm font-medium">Created</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(data.created_at)}
                          </dd>
                        </div>
                      )}
                      {data.updated_at && (
                        <div>
                          <dt className="text-sm font-medium">Last Updated</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(data.updated_at)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {/* Layout Tab */}
            {activeTab === "seats" && (
              <div className="space-y-6">
                <LayoutList
                  venueId={data.id}
                  onNavigateToDesigner={(layoutId) => {
                    if (onNavigateToSeatDesigner) {
                      onNavigateToSeatDesigner(data.id, layoutId);
                    }
                  }}
                />
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === "metadata" && (
              <div className="space-y-6">
                <Card>
                  <div className="p-4">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Create Layout Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Layout</DialogTitle>
            <DialogDescription>
              Create a new layout for this venue. Design mode cannot be changed after seats are added.
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
                onValueChange={(v) => setNewLayoutDesignMode(v as "seat-level" | "section-level")}
              >
                <SelectTrigger id="design-mode">
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
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
    </Card>
  );
}
