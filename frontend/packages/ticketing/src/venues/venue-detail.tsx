/**
 * Venue Detail Component
 *
 * Display detailed information about a venue with optional edit and activity views.
 */

import React, { useMemo, useState } from "react";
import { Card, Tabs } from "@truths/ui";
import {
  ActionList,
  CopyButton,
  DescriptionList,
  DescriptionItem,
  DescriptionSection,
} from "@truths/custom-ui";
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
import { LayoutList } from "../layouts";
import { CreateLayoutDialog } from "./create-layout-dialog";

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
    "seats" | "details" | "contact" | "metadata"
  >("seats");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const getVenueDisplayName = () => {
    return data?.name || data?.id || "";
  };

  const displayName = useMemo(
    () => (data ? getVenueDisplayName() : ""),
    [data, data?.name]
  );

  const formatDate = (value?: Date | string | null) => {
    if (!value) return "N/A";
    try {
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime())
        ? "Invalid Date"
        : date.toLocaleString();
    } catch {
      return "Invalid Date";
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
                  Contact & Address
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

                <DescriptionList title="Venue Information" columns={3}>
                  <DescriptionItem
                    label="Venue Type"
                    value={data.venue_type || null}
                  />
                  <DescriptionItem
                    label="Capacity"
                    value={
                      data.capacity
                        ? `${data.capacity.toLocaleString()} seats`
                        : null
                    }
                  />
                  <DescriptionItem
                    label="Opening Hours"
                    value={data.opening_hours || null}
                    preserveWhitespace
                  />
                </DescriptionList>

                <DescriptionList title="Facilities & Amenities" columns={3}>
                  <DescriptionItem
                    label="Parking"
                    value={data.parking_info || null}
                  />
                  <DescriptionItem
                    label="Accessibility"
                    value={data.accessibility || null}
                  />
                  <DescriptionItem
                    label="Amenities"
                    value={
                      data.amenities &&
                      Array.isArray(data.amenities) &&
                      data.amenities.length > 0 ? (
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
                      ) : null
                    }
                  />
                </DescriptionList>

                <DescriptionSection>
                  <DescriptionItem
                    label="Description"
                    value={data.description || null}
                  />
                </DescriptionSection>

                {/* Timeline */}
                <DescriptionList
                  title="Timeline"
                  icon={Database}
                  columns={3}
                  className="border-t pt-4"
                >
                  <DescriptionItem
                    label="Created"
                    value={data.created_at}
                    render={(value) => formatDate(value as Date | string)}
                  />
                  <DescriptionItem
                    label="Last Updated"
                    value={data.updated_at}
                    render={(value) => formatDate(value as Date | string)}
                  />
                </DescriptionList>
              </div>
            )}

            {/* Contact & Address Tab */}
            {activeTab === "contact" && (
              <div className="space-y-6">
                <DescriptionList title="Contact Information" columns={3}>
                  <DescriptionItem
                    label="Phone"
                    value={data.phone || null}
                    linkType="tel"
                    icon={Phone}
                  />
                  <DescriptionItem
                    label="Email"
                    value={data.email || null}
                    linkType="email"
                    icon={Mail}
                  />
                  <DescriptionItem
                    label="Website"
                    value={data.website || null}
                    linkType="external"
                    icon={Globe}
                    span="md:col-span-3"
                  />
                </DescriptionList>

                <DescriptionList
                  title="Address Information"
                  icon={MapPinIcon}
                  columns={3}
                >
                  <DescriptionItem
                    label="Street Address"
                    value={data.street_address || null}
                  />
                  <DescriptionItem
                    label="City, State, ZIP"
                    value={
                      [data.city, data.state_province, data.postal_code]
                        .filter(Boolean)
                        .join(", ") || null
                    }
                  />
                  <DescriptionItem
                    label="Country"
                    value={data.country || null}
                  />
                </DescriptionList>
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
      <CreateLayoutDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        venue={data}
      />
    </Card>
  );
}
