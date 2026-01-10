/**
 * Employee Detail Component
 *
 * Display detailed information about a employee with optional edit and activity views.
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Badge,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Edit,
  MoreVertical,
  Info,
  Database,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Smartphone,
  Award,
  Map,
  AlertCircle,
  Cake,
  TrendingUp,
  Tag,
  FileText,
  Clock,
} from "lucide-react";
import {
  DescriptionList,
  DescriptionItem,
  DescriptionSection,
  DocumentList,
  CopyButton,
  ButtonTabs,
} from "@truths/custom-ui";
import type { ButtonTabItem } from "@truths/custom-ui";
import { Employee } from "./types";
import { AttachmentService, FileUpload } from "@truths/shared";
import { api } from "@truths/api";

export interface EmployeeDetailProps {
  className?: string;
  data?: Employee;
  loading?: boolean;
  error?: Error | null;

  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;

  attachmentService?: AttachmentService;
  onEdit?: (data: Employee) => void;
  onManageTags?: (data: Employee) => void;
  onManageAttachments?: (data: Employee) => void;
  profilePhotoComponent?: React.ReactNode;

  customActions?: (data: Employee) => React.ReactNode;
}

export function EmployeeDetail({
  className,
  data,
  loading = false,
  error = null,

  showMetadata = false,
  editable = true,

  attachmentService,
  onEdit,
  onManageTags,
  onManageAttachments,
  profilePhotoComponent,

  customActions,
}: EmployeeDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "contact" | "sales" | "metadata" | "documents"
  >("profile");
  const [documents, setDocuments] = useState<FileUpload[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

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

  // All hooks must be called before any early returns

  const getEmployeeDisplayName = () => {
    return data?.name || data?.code || data?.id || "";
  };

  const displayName = useMemo(
    () => (data ? getEmployeeDisplayName() : ""),
    [data, data?.code, data?.name]
  );

  const formatDate = (value?: Date | string) => {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };

  // Load documents when documents tab is active
  const loadDocuments = useCallback(async () => {
    if (!data?.id || !attachmentServiceInstance) {
      return;
    }
    setIsLoadingDocuments(true);
    try {
      const response = await attachmentServiceInstance.getAttachmentsForEntity(
        "employee",
        data.id,
        "document"
      );
      setDocuments(response.items || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [data?.id, attachmentServiceInstance]);

  useEffect(() => {
    if (activeTab === "documents" && data?.id && attachmentServiceInstance) {
      loadDocuments();
    }
  }, [activeTab, data?.id, attachmentServiceInstance, loadDocuments]);

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
          <div className="text-muted-foreground">No employee selected</div>
        </div>
      </Card>
    );
  }

  const hasMetadata = showMetadata;

  // Build tabs configuration
  const tabs: ButtonTabItem[] = [
    {
      value: "profile",
      label: "Overview",
      icon: Info,
    },
    {
      value: "contact",
      label: "Contact & Address",
      icon: Mail,
    },
    {
      value: "sales",
      label: "Sales & Performance",
      icon: TrendingUp,
    },
    {
      value: "documents",
      label: `Documents${documents.length > 0 ? ` (${documents.length})` : ""}`,
      icon: FileText,
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
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              {customActions?.(data)}
              {editable && onEdit && (
                <Button
                  onClick={() => onEdit(data)}
                  size="sm"
                  variant="outline"
                  className={cn("h-8 px-2 text-xs")}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
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
                      <Tag className="mr-2 h-3.5 w-3.5" /> Manage Tags
                    </DropdownMenuItem>
                  )}
                  {editable && onManageAttachments && (
                    <DropdownMenuItem onClick={() => onManageAttachments(data)}>
                      <FileText className="mr-2 h-3.5 w-3.5" /> Manage Documents
                    </DropdownMenuItem>
                  )}

                  {customActions && customActions(data)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ButtonTabs
          tabs={tabs}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          {(activeTab) => (
            <div className="mt-0">
              {/* Basic Information Tab */}
              {activeTab === "profile" && (
                <div className="space-y-8">
                  <DescriptionList columns={3}>
                    <DescriptionItem
                      label="Work Email"
                      value={data.work_email}
                      linkType="email"
                      icon={Mail}
                      hideIfEmpty={false}
                    />

                    {/* Organization */}
                    <DescriptionItem
                      label="Job Title"
                      value={data.job_title}
                      icon={Briefcase}
                      hideIfEmpty={false}
                    />
                    <DescriptionItem
                      label="Department"
                      value={data.department}
                      hideIfEmpty={false}
                    />
                    <DescriptionItem
                      label="Employment Type"
                      value={data.employment_type}
                      icon={Clock}
                      hideIfEmpty={false}
                    />
                    <DescriptionItem
                      label="Hire Date"
                      value={data.hire_date}
                      icon={Calendar}
                      render={(value) => formatDate(value as Date | string)}
                      hideIfEmpty={false}
                    />
                    <DescriptionItem
                      label="Birthday"
                      value={data.birthday}
                      icon={Cake}
                      render={(value) => formatDate(value as Date | string)}
                      hideIfEmpty={false}
                    />

                    {/* HR / Personal */}
                  </DescriptionList>

                  {/* Tags */}
                  <DescriptionSection showBorder>
                    <DescriptionList
                      gridClassName="!grid-cols-1"
                      className="mt-0 mb-0"
                    >
                      <DescriptionItem
                        label={`Tags${data.tags && data.tags.length > 0 ? ` (${data.tags.length})` : ""}`}
                        value={
                          data.tags && data.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {data.tags.map((tag, index) => (
                                <Badge
                                  key={`tag-${index}-${tag}`}
                                  variant="secondary"
                                  className="text-xs flex items-center gap-1.5 pr-2 py-1.5 px-2.5 bg-primary/10 text-primary border-primary/20"
                                >
                                  <Tag className="h-3 w-3" />
                                  <span>{tag}</span>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">
                              No tags
                            </span>
                          )
                        }
                        hideIfEmpty={false}
                      />
                    </DescriptionList>
                  </DescriptionSection>

                  {/* System Information */}
                  <DescriptionSection showBorder>
                    <DescriptionList
                      columns={2}
                      icon={Database}
                      title="System Information"
                      className="mt-0 mb-0"
                    >
                      <DescriptionItem
                        label="Created"
                        value={data.created_at}
                        render={(value) => formatDate(value as Date | string)}
                        hideIfEmpty={false}
                      />
                      <DescriptionItem
                        label="Last Updated"
                        value={data.updated_at}
                        render={(value) => formatDate(value as Date | string)}
                        hideIfEmpty={false}
                      />
                    </DescriptionList>
                  </DescriptionSection>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === "contact" && (
                <div className="space-y-8">
                  {/* Contact & Location */}
                  <DescriptionList icon={Mail} title="Contact" columns={3}>
                    <DescriptionItem
                      label="Work Phone"
                      value={data.work_phone}
                      linkType="tel"
                      icon={Phone}
                      hideIfEmpty={false}
                    />
                    <DescriptionItem
                      label="Mobile Phone"
                      value={data.mobile_phone}
                      linkType="tel"
                      icon={Smartphone}
                      hideIfEmpty={false}
                    />
                    

                    {/* Emergency Contact */}
                    <DescriptionItem
                      label="Emergency Contact"
                      value={
                        data.emergency_contact_name ? (
                          <span>
                            {data.emergency_contact_name}
                            {data.emergency_contact_phone && (
                              <span className="text-muted-foreground ml-1">
                                ({data.emergency_contact_phone})
                              </span>
                            )}
                            {data.emergency_contact_relationship && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {data.emergency_contact_relationship}
                              </div>
                            )}
                          </span>
                        ) : null
                      }
                      icon={AlertCircle}
                      hideIfEmpty={false}
                    />
                  </DescriptionList>

                  <DescriptionList icon={MapPin} title="Address" columns={3}> 
                    <DescriptionItem
                      value={
                        data.office_location ? (
                          <div className="whitespace-pre-line">
                            {data.office_location}
                          </div>
                        ) : null
                      }
                      
                      hideIfEmpty={false}
                    />  
                  </DescriptionList>
                </div>
              )}

              {/* Sales Tab */}
              {activeTab === "sales" && (
                <div className="space-y-8">
                  {/* Sales & Operations */}
                  <DescriptionList columns={3}>
                    <DescriptionItem
                      label="Skills"
                      value={
                        data.skills && data.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {data.skills.map((skill, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : null
                      }
                      icon={Award}
                      hideIfEmpty={false}
                    />
                    <DescriptionItem
                      label="Territories"
                      value={
                        data.assigned_territories &&
                        data.assigned_territories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {data.assigned_territories.map((territory, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary-foreground"
                              >
                                {territory}
                              </span>
                            ))}
                          </div>
                        ) : null
                      }
                      icon={Map}
                      hideIfEmpty={false}
                    />
                    <DescriptionItem
                      label="Commission Tier"
                      value={data.commission_tier}
                      icon={TrendingUp}
                      hideIfEmpty={false}
                    />
                  </DescriptionList>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  <DocumentList
                    documents={documents}
                    isLoading={isLoadingDocuments}
                    onManageAttachments={
                      editable && onManageAttachments
                        ? () => onManageAttachments(data)
                        : undefined
                    }
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
          )}
        </ButtonTabs>
      </div>
    </Card>
  );
}
