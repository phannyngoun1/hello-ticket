/**
 * Organizer Detail Component
 *
 * Display detailed information about a organizer with optional edit and activity views.
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Card, Tabs, Badge } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Edit,
  Info,
  Database,
  MapPin,
  Phone,
  Mail,
  Globe,
  Tag,
  File,
  User,
} from "lucide-react";
import {
  DocumentList,
  DescriptionList,
  DescriptionItem,
  ActionList,
  TagList,
  DescriptionSection,
} from "@truths/custom-ui";
import { AttachmentService, FileUpload } from "@truths/shared";
import { api } from "@truths/api";
import { Organizer } from "./types";

export interface OrganizerDetailProps {
  className?: string;
  data?: Organizer;
  loading?: boolean;
  error?: Error | null;

  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;
  attachmentService?: AttachmentService;
  onEdit?: (data: Organizer) => void;

  customActions?: (data: Organizer) => React.ReactNode;

  onManageTags?: (data: Organizer) => void;
  onManageAttachments?: (data: Organizer) => void;

  profilePhoto?: { url: string } | null;
  profilePhotoComponent?: React.ReactNode;
}

export function OrganizerDetail({
  className,
  data,
  loading = false,
  error = null,

  showMetadata = false,
  editable = true,
  attachmentService,
  onEdit,

  customActions,

  onManageTags,
  onManageAttachments,

  profilePhotoComponent,
}: OrganizerDetailProps) {
  // Debug: log what data the component receives
  console.log("DEBUG: OrganizerDetail received data:", data);

  const [activeTab, setActiveTab] = useState<
    "overview" | "documents" | "metadata"
  >("overview");
  const [documents, setDocuments] = useState<FileUpload[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Auto-create AttachmentService if not provided
  const attachmentServiceInstance = useMemo(() => {
    if (attachmentService) return attachmentService;
    return new AttachmentService({
      apiClient: api,
      endpoints: {
        attachments: "/api/v1/shared/attachments",
        entityAttachments: "/api/v1/shared/attachments/entity",
        profilePhoto: "/api/v1/shared/attachments/entity",
      },
    });
  }, [attachmentService]);

  // Load documents function
  const loadDocuments = useCallback(async () => {
    if (!data?.id || !attachmentServiceInstance) {
      return;
    }

    setLoadingDocuments(true);
    try {
      const response = await attachmentServiceInstance.getAttachmentsForEntity(
        "organizer",
        data.id,
        "document"
      );
      setDocuments(response.items || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, [data?.id, attachmentServiceInstance]);

  useEffect(() => {
    if (activeTab === "documents" && data?.id && attachmentServiceInstance) {
      loadDocuments();
    }
  }, [activeTab, data?.id, attachmentServiceInstance, loadDocuments]);

  // All hooks must be called before any early returns

  // Debug: log when tags change
  React.useEffect(() => {
    console.log("OrganizerDetail: data.tags changed", data?.tags);
  }, [data?.tags]);

  const getOrganizerDisplayName = () => {
    return data?.name || data?.code || data?.id || "";

    return data?.id || "";
  };

  const displayName = useMemo(
    () => (data ? getOrganizerDisplayName() : ""),
    [data, data?.code]
  );

  const formatDate = (value?: Date | string) => {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
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
          <div className="text-muted-foreground">No organizer selected</div>
        </div>
      </Card>
    );
  }

  const hasMetadata = showMetadata;

  return (
    <Card className={cn("p-6", className)}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {profilePhotoComponent ? (
              profilePhotoComponent
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
                {data.logo ? (
                  <img
                    src={data.logo}
                    alt={displayName}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <Info className="h-10 w-10 text-primary" />
                )}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>

              {data.code && (
                <p className="text-sm text-muted-foreground mt-1">
                  Code: {data.code}
                </p>
              )}

              {data.website && (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  {data.website}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ActionList
              actions={[
                ...(editable && onEdit
                  ? [
                      {
                        id: "edit",
                        label: "Edit",
                        icon: <Edit className="h-3.5 w-3.5" />,
                        onClick: () => onEdit(data),
                      },
                    ]
                  : []),
                ...(editable && onManageTags
                  ? [
                      {
                        id: "manage-tags",
                        label: "Manage tags",
                        icon: <Tag className="h-3.5 w-3.5" />,
                        onClick: () => onManageTags(data),
                        display: "dropdown-item" as const,
                      },
                    ]
                  : []),
                ...(editable && onManageAttachments
                  ? [
                      {
                        id: "manage-documents",
                        label: "Manage documents",
                        icon: <File className="h-3.5 w-3.5" />,
                        onClick: () => onManageAttachments(data),
                        display: "dropdown-item" as const,
                      },
                    ]
                  : []),
              ]}
              customActions={customActions?.(data)}
            />
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
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("overview")}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Overview
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "documents"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("documents")}
              >
                <span className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Documents
                  {documents.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 min-w-[1.25rem]"
                    >
                      {documents.length}
                    </Badge>
                  )}
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
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Basic Information */}

                {/* Contact & Location */}
                <DescriptionList
                  title="Contact & Location"
                  icon={User}
                  columns={3}
                >
                  <DescriptionItem
                    label="Email"
                    value={data.email}
                    dataType="email"
                    linkType="email"
                    icon={Mail}
                  />
                  <DescriptionItem
                    label="Phone"
                    value={data.phone}
                    dataType="phone"
                    linkType="tel"
                    icon={Phone}
                  />
                  <DescriptionItem
                    label="Website"
                    value={data.website}
                    dataType="url"
                    linkType="external"
                    icon={Globe}
                  />
                  <DescriptionItem
                    label="Address"
                    value={[data.address, data.city, data.country]
                      .filter(Boolean)
                      .join(", ")}
                    icon={MapPin}
                    span="md:col-span-3"
                  />
                </DescriptionList>
                <DescriptionSection>
                  <DescriptionItem
                    label="Description"
                    value={data.description}
                    span="md:col-span-3"
                  />
                </DescriptionSection>

                <DescriptionSection>
                  <DescriptionItem
                    label={`Tags${data.tags && data.tags.length > 0 ? ` (${data.tags.length})` : ""}`}
                    value={
                      data.tags && data.tags.length > 0 ? (
                        <TagList tags={data.tags} />
                      ) : null
                    }
                    span="md:col-span-3"
                    hideIfEmpty={false}
                  />
                </DescriptionSection>

                {/* Timeline */}
                <DescriptionList
                  title="System Information"
                  icon={Database}
                  columns={3}
                >
                  <DescriptionItem
                    label="Created"
                    value={data.created_at}
                    render={(value) =>
                      formatDate(value as Date | string) as React.ReactNode
                    }
                  />
                  <DescriptionItem
                    label="Last Updated"
                    value={data.updated_at}
                    render={(value) =>
                      formatDate(value as Date | string) as React.ReactNode
                    }
                  />
                </DescriptionList>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <DocumentList
                documents={documents}
                isLoading={loadingDocuments}
                onManageAttachments={
                  editable && onManageAttachments
                    ? () => onManageAttachments(data)
                    : undefined
                }
              />
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
    </Card>
  );
}
