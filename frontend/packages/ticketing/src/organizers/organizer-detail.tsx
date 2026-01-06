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
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
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
  Download,
  Image as ImageIcon,
  Eye,
} from "lucide-react";
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
              {data.tags && data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {data.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs px-1.5 py-0 h-5 md:h-6"
                    >
                      <Tag className="h-3 w-3 mr-1 opacity-70" />
                      {tag}
                    </Badge>
                  ))}
                  {((onManageTags && editable) || data.tags.length === 0) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 md:h-6 md:w-6 rounded-full"
                      onClick={() => onManageTags?.(data)}
                      disabled={!onManageTags || !editable}
                      title="Manage tags"
                    >
                      <Edit className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
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
              <div className="space-y-6">
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">
                      Loading documents...
                    </div>
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="grid gap-2">
                    {documents.map((doc) => {
                      const getFileIcon = (mimeType: string) => {
                        if (mimeType.startsWith("image/")) {
                          return <ImageIcon className="h-5 w-5" />;
                        }
                        return <File className="h-5 w-5" />;
                      };

                      const formatFileSize = (bytes: number): string => {
                        if (bytes < 1024) return `${bytes} B`;
                        if (bytes < 1024 * 1024)
                          return `${(bytes / 1024).toFixed(1)} KB`;
                        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                      };

                      return (
                        <Item key={doc.id} className="p-3">
                          <ItemMedia className="text-muted-foreground">
                            {getFileIcon(doc.mime_type)}
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle className="text-sm font-medium">
                              {doc.original_name}
                            </ItemTitle>
                            <ItemDescription className="text-xs">
                              {formatFileSize(doc.size)} • {doc.mime_type} •{" "}
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            {doc.mime_type.startsWith("image/") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(doc.url, "_blank")}
                                title="View image"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => window.open(doc.url, "_blank")}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </ItemActions>
                        </Item>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                    <File className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No documents attached
                    </p>
                    {editable && onManageAttachments && (
                      <Button
                        variant="link"
                        onClick={() => onManageAttachments(data)}
                        className="mt-1"
                      >
                        Upload a document
                      </Button>
                    )}
                  </div>
                )}
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
    </Card>
  );
}
