/**
 * Organizer Detail Component
 *
 * Display detailed information about a organizer with optional edit and activity views.
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  Badge,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Edit,
  MoreVertical,
  Info,
  Database,
  MapPin,
  Phone,
  Mail,
  Globe,
  Tag,
  File,
} from "lucide-react";
import { DocumentList } from "@truths/custom-ui";
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
    "profile" | "documents" | "metadata"
  >("profile");
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

              {data.description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                  {data.description}
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
            <div className="flex items-center gap-1.5">
              {customActions?.(data)}
            </div>
            {editable && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(data)}
                className="h-8 px-3 text-xs"
                aria-label="Edit organizer"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-8 px-2 text-xs")}
                    aria-label="Actions"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {editable && onManageTags && (
                    <DropdownMenuItem onClick={() => onManageTags(data)}>
                      <Tag className="mr-2 h-3.5 w-3.5" /> Manage tags
                    </DropdownMenuItem>
                  )}
                  {editable && onManageAttachments && (
                    <DropdownMenuItem onClick={() => onManageAttachments(data)}>
                      <File className="mr-2 h-3.5 w-3.5" /> Manage documents
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
                  activeTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("profile")}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Profile
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
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Basic Information
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium">Description</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {data.description || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">Tags</dt>
                        <dd className="mt-1">
                          {(() => {
                            console.log(
                              "DEBUG: Profile tab tags check - data.tags:",
                              data.tags,
                              "length:",
                              data.tags?.length,
                              "condition:",
                              data.tags && data.tags.length > 0
                            );
                            return data.tags && data.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {data.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs px-1.5 py-0 h-5"
                                  >
                                    <Tag className="h-3 w-3 mr-1 opacity-70" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No tags
                              </span>
                            );
                          })()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Contact & Location
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email
                        </dt>
                        <dd className="mt-1 text-sm text-muted-foreground pl-6">
                          {data.email ? (
                            <a
                              href={`mailto:${data.email}`}
                              className="hover:underline text-primary"
                            >
                              {data.email}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Phone
                        </dt>
                        <dd className="mt-1 text-sm text-muted-foreground pl-6">
                          {data.phone ? (
                            <a
                              href={`tel:${data.phone}`}
                              className="hover:underline text-primary"
                            >
                              {data.phone}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Address
                        </dt>
                        <dd className="mt-1 text-sm text-muted-foreground pl-6">
                          {[data.address, data.city, data.country]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          Website
                        </dt>
                        <dd className="mt-1 text-sm text-muted-foreground pl-6">
                          {data.website ? (
                            <a
                              href={data.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-primary"
                            >
                              {data.website}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Timeline
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium">Created</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(data.created_at)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium">Last Updated</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(data.updated_at)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
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
