/**
 * Venue Detail Component
 *
 * Display detailed information about a venue with optional edit and activity views.
 */

import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
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
import { ActionList, CopyButton } from "@truths/custom-ui";
import type { ActionItem } from "@truths/custom-ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Edit,
  Info,
  Database,
  Plus,
  LayoutGrid,
  Phone,
  Mail,
  Globe,
  MapPin as MapPinIcon,
} from "lucide-react";
import { Venue } from "./types";
import { LayoutList, useLayoutService, useCreateLayout } from "../layouts";

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

  profilePhotoComponent?: React.ReactNode;

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

  profilePhotoComponent,

  customActions,
}: VenueDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "seats" | "details" | "contact" | "address" | "metadata"
  >("seats");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutDesignMode, setNewLayoutDesignMode] = useState<
    "seat-level" | "section-level"
  >("seat-level");

  // All hooks must be called before any early returns
  const layoutService = useLayoutService();
  const createLayoutMutation = useCreateLayout(layoutService);

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

  // Build action list
  const actionItems: ActionItem[] = [];

  // Add Edit action if editable
  if (editable && onEdit && data) {
    actionItems.push({
      id: "edit",
      label: "Edit",
      icon: <Edit className="h-3.5 w-3.5" />,
      onClick: () => onEdit(data),
    });
  }

  // Add Create Layout action
  actionItems.push({
    id: "add-layout",
    label: "Add Layout",
    icon: <Plus className="h-3.5 w-3.5" />,
    onClick: () => setIsCreateDialogOpen(true),
  });

  return (
    <Card className={cn("p-6", className)}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {profilePhotoComponent ? (
              <div className="flex-shrink-0">{profilePhotoComponent}</div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
                <Info className="h-10 w-10 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>
              {data.code && (
                <p className="text-sm text-muted-foreground mt-1">
                  Code: {data.code}
                  <CopyButton
                    value={data.code}
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1"
                    title="Copy code"
                  />
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <ActionList
            actions={actionItems}
            maxVisibleActions={2}
            customActions={customActions?.(data)}
            size="sm"
          />
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
                  activeTab === "details"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("details")}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Overview
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "contact"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("contact")}
              >
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "address"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("address")}
              >
                <span className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4" />
                  Address
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
            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Description */}
                {data.description && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Description
                    </h3>
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {data.description}
                    </p>
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Venue Information
                    </h3>
                    <dl className="space-y-4">
                      {data.venue_type && (
                        <div>
                          <dt className="text-sm font-medium mb-1">
                            Venue Type
                          </dt>
                          <dd className="text-sm text-muted-foreground">
                            {formatFieldValue(data.venue_type)}
                          </dd>
                        </div>
                      )}
                      {data.capacity && (
                        <div>
                          <dt className="text-sm font-medium mb-1">Capacity</dt>
                          <dd className="text-sm text-muted-foreground">
                            {data.capacity.toLocaleString()} seats
                          </dd>
                        </div>
                      )}
                      {data.opening_hours && (
                        <div>
                          <dt className="text-sm font-medium mb-1">
                            Opening Hours
                          </dt>
                          <dd className="text-sm text-muted-foreground whitespace-pre-line">
                            {formatFieldValue(data.opening_hours)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Facilities & Amenities
                    </h3>
                    <dl className="space-y-4">
                      {data.parking_info && (
                        <div>
                          <dt className="text-sm font-medium mb-1">Parking</dt>
                          <dd className="text-sm text-muted-foreground">
                            {formatFieldValue(data.parking_info)}
                          </dd>
                        </div>
                      )}
                      {data.accessibility && (
                        <div>
                          <dt className="text-sm font-medium mb-1">
                            Accessibility
                          </dt>
                          <dd className="text-sm text-muted-foreground">
                            {formatFieldValue(data.accessibility)}
                          </dd>
                        </div>
                      )}
                      {data.amenities && data.amenities.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium mb-2">
                            Amenities
                          </dt>
                          <dd className="text-sm text-muted-foreground">
                            <div className="flex flex-wrap gap-2">
                              {data.amenities.map((amenity, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    Timeline
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.created_at && (
                      <div>
                        <dt className="text-sm font-medium mb-1">Created</dt>
                        <dd className="text-sm text-muted-foreground">
                          {formatDate(data.created_at)}
                        </dd>
                      </div>
                    )}
                    {data.updated_at && (
                      <div>
                        <dt className="text-sm font-medium mb-1">
                          Last Updated
                        </dt>
                        <dd className="text-sm text-muted-foreground">
                          {formatDate(data.updated_at)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {data.phone || data.email || data.website ? (
                    <>
                      {data.phone && (
                        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                          <Phone className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <dt className="text-sm font-medium mb-1">Phone</dt>
                            <dd className="text-sm">
                              <a
                                href={`tel:${data.phone}`}
                                className="text-primary hover:underline"
                              >
                                {data.phone}
                              </a>
                            </dd>
                          </div>
                        </div>
                      )}
                      {data.email && (
                        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                          <Mail className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <dt className="text-sm font-medium mb-1">Email</dt>
                            <dd className="text-sm">
                              <a
                                href={`mailto:${data.email}`}
                                className="text-primary hover:underline"
                              >
                                {data.email}
                              </a>
                            </dd>
                          </div>
                        </div>
                      )}
                      {data.website && (
                        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg md:col-span-2">
                          <Globe className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <dt className="text-sm font-medium mb-1">
                              Website
                            </dt>
                            <dd className="text-sm">
                              <a
                                href={data.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all"
                              >
                                {data.website}
                              </a>
                            </dd>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      No contact information available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address Tab */}
            {activeTab === "address" && (
              <div className="space-y-6">
                {data.street_address ||
                data.city ||
                data.state_province ||
                data.postal_code ||
                data.country ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <MapPinIcon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 space-y-2">
                        {data.street_address && (
                          <div>
                            <dt className="text-sm font-medium mb-1">
                              Street Address
                            </dt>
                            <dd className="text-sm text-muted-foreground">
                              {data.street_address}
                            </dd>
                          </div>
                        )}
                        {(data.city ||
                          data.state_province ||
                          data.postal_code) && (
                          <div>
                            <dt className="text-sm font-medium mb-1">
                              City, State, ZIP
                            </dt>
                            <dd className="text-sm text-muted-foreground">
                              {[
                                data.city,
                                data.state_province,
                                data.postal_code,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </dd>
                          </div>
                        )}
                        {data.country && (
                          <div>
                            <dt className="text-sm font-medium mb-1">
                              Country
                            </dt>
                            <dd className="text-sm text-muted-foreground">
                              {data.country}
                            </dd>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No address information available
                  </div>
                )}
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
              Create a new layout for this venue. Design mode cannot be changed
              after seats are added.
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
                onValueChange={(v) =>
                  setNewLayoutDesignMode(v as "seat-level" | "section-level")
                }
              >
                <SelectTrigger id="design-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seat-level">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Seat Level</span>
                      <span className="text-xs text-muted-foreground">
                        Place seats directly on venue floor plan
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="section-level">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Section Level</span>
                      <span className="text-xs text-muted-foreground">
                        Define sections first, then add seats to each section
                      </span>
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
