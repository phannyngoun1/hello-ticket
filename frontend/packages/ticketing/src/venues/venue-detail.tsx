/**
 * Venue Detail Component
 *
 * Display detailed information about a venue with optional edit and activity views.
 */

import React, { useMemo, useState } from "react";
import { Card } from "@truths/ui";
import { LayoutList } from "../layouts";
import {
  ActionList,
  CopyButton,
  DescriptionList,
  DescriptionItem,
  DescriptionSection,
  ButtonTabs,
  RefreshButton,
} from "@truths/custom-ui";
import type { ActionItem, ButtonTabItem } from "@truths/custom-ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Edit,
  Info,
  Plus,
  LayoutGrid,
  Phone,
  Database,
  Mail,
  Globe,
  MapPin,
} from "lucide-react";
import { Venue } from "./types";
import { CreateLayoutDialog } from "./create-layout-dialog";
import { EditLayoutDialog } from "./edit-layout-dialog";

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
  onEditLayout?: (layout: import("../layouts").Layout) => void;

  profilePhotoComponent?: React.ReactNode;

  customActions?: (data: Venue) => React.ReactNode;
  onRefresh?: () => void;
  isRefetching?: boolean;
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
  onRefresh,
  isRefetching = false,
}: VenueDetailProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [layoutToEdit, setLayoutToEdit] = useState<
    import("../layouts").Layout | null
  >(null);

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

  const hasMetadata = showMetadata;

  const handleEditLayout = (layout: import("../layouts").Layout) => {
    setLayoutToEdit(layout);
    setIsEditDialogOpen(true);
  };

  // Build tabs configuration
  const tabs: ButtonTabItem[] = [
    {
      value: "layout",
      label: "Layout",
      icon: LayoutGrid,
    },
    {
      value: "overview",
      label: "Overview",
      icon: Info,
    },
    {
      value: "contact",
      label: "Contact & Address",
      icon: Phone,
    },
  ];

  // Add metadata tab if enabled
  if (hasMetadata) {
    tabs.push({
      value: "metadata",
      label: "Metadata",
      icon: Database,
    });
  }

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
            customActions={
              onRefresh || customActions ? (
                <>
                  {onRefresh && (
                    <RefreshButton
                      onRefresh={onRefresh}
                      isRefetching={isRefetching}
                      size="icon"
                    />
                  )}
                  {customActions?.(data)}
                </>
              ) : undefined
            }
            size="sm"
          />
        </div>

        {/* Tabs */}
        <ButtonTabs tabs={tabs} defaultValue="layout">
          {(activeTab) => (
            <div className="mt-0">
              {/* Layout Tab */}
              {activeTab === "layout" && (
                <div className="space-y-6">
                  <LayoutList
                    venueId={data.id}
                    onNavigateToDesigner={(layoutId) => {
                      if (onNavigateToSeatDesigner) {
                        onNavigateToSeatDesigner(data.id, layoutId);
                      }
                    }}
                    onEdit={handleEditLayout}
                  />
                </div>
              )}

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
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
                    icon={MapPin}
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
          )}
        </ButtonTabs>
      </div>

      {/* Create Layout Dialog */}
      <CreateLayoutDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        venue={data}
      />

      {/* Edit Layout Dialog */}
      <EditLayoutDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setLayoutToEdit(null);
        }}
        layout={layoutToEdit || undefined}
      />
    </Card>
  );
}
