/**
 * Customer Detail Component
 *
 * Display detailed information about a customer with optional edit and activity views.
 *
 * @author Phanny
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Tabs,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Edit,
  Info,
  Database,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ShoppingCart,
  Users,
  FileText,
  Copy,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  Share2,
  Tag,
  MoreVertical,
} from "lucide-react";
import {
  DocumentList,
  DescriptionList,
  DescriptionItem,
  DescriptionSection,
} from "@truths/custom-ui";
import { AttachmentService, FileUpload } from "@truths/shared";
import { api } from "@truths/api";

import { Customer } from "../types";

export interface CustomerDetailProps {
  className?: string;
  cus?: Customer;
  loading?: boolean;
  error?: Error | null;
  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;
  attachmentService?: AttachmentService;
  onEdit?: (cus: Customer) => void;
  onDelete?: (cus: Customer) => void;
  onActivate?: (cus: Customer) => void;
  onDeactivate?: (cus: Customer) => void;
  onCreateBooking?: (cus: Customer) => void;
  onViewBookings?: (cus: Customer) => void;
  onManageTags?: (cus: Customer) => void;
  onManageAttachments?: (cus: Customer) => void;
  profilePhoto?: { url: string } | null;
  profilePhotoComponent?: React.ReactNode;
  customActions?: (cus: Customer) => React.ReactNode;
}

export function CustomerDetail({
  className,
  cus,
  loading = false,
  error = null,
  showMetadata = false,
  editable = true,
  attachmentService,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  onCreateBooking,
  onViewBookings,
  onManageTags,
  onManageAttachments,
  profilePhotoComponent,
  customActions,
}: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "account" | "social" | "metadata" | "documents"
  >("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);
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

  const getCustomerDisplayName = () => {
    return cus?.code || cus?.id || "";

    return cus?.id || "";
  };

  const displayName = useMemo(
    () => (cus ? getCustomerDisplayName() : ""),
    [cus, cus?.code]
  );

  const formatDate = (value?: Date | string) => {
    if (!value) return "N/A";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };

  // Load documents when documents tab is active
  const loadDocuments = useCallback(async () => {
    if (!cus?.id || !attachmentServiceInstance) {
      return;
    }
    setIsLoadingDocuments(true);
    try {
      const response = await attachmentServiceInstance.getAttachmentsForEntity(
        "customer",
        cus.id,
        "document"
      );
      setDocuments(response.items || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [cus?.id, attachmentServiceInstance]);

  useEffect(() => {
    if (activeTab === "documents" && cus?.id && attachmentServiceInstance) {
      loadDocuments();
    }
  }, [activeTab, cus?.id, attachmentServiceInstance, loadDocuments]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Build action items
  const isActive = cus?.status === "active";
  const hasMetadata = showMetadata;

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

  if (!cus) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No customer selected</div>
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
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">
                  {cus.name || displayName}
                </h2>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={cn(
                    isActive
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                  )}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1">
                {cus.code && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Code:</span>
                    <span className="text-sm font-medium">{cus.code}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => copyToClipboard(cus.code, "code")}
                      title="Copy code"
                    >
                      {copiedField === "code" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
                {cus.email && (
                  <a
                    href={`mailto:${cus.email}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </a>
                )}
                {cus.phone && (
                  <a
                    href={`tel:${cus.phone}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              {cus && onCreateBooking && (
                <Button
                  onClick={() => onCreateBooking(cus)}
                  size="sm"
                  className={cn("h-8 px-2 text-xs")}
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Book Now
                </Button>
              )}
              {editable && cus && onEdit && (
                <Button
                  onClick={() => onEdit(cus)}
                  size="sm"
                  variant="outline"
                  className={cn("h-8 px-2 text-xs")}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
               {cus && onViewBookings && (
                <Button
                  onClick={() => onViewBookings(cus)}
                  size="sm"
                  variant="outline"
                  className={cn("h-8 px-2 text-xs")}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  View Bookings
                </Button>
              )}
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={cn("h-8 px-2 text-xs")} aria-label="Actions">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {cus && isActive && onDeactivate && (
                    <DropdownMenuItem onClick={() => onDeactivate(cus)}>
                        <UserX className="mr-2 h-3.5 w-3.5" /> Deactivate
                    </DropdownMenuItem>
                  )}
                  {cus && !isActive && onActivate && (
                    <DropdownMenuItem onClick={() => onActivate(cus)}>
                        <UserCheck className="mr-2 h-3.5 w-3.5" /> Activate
                    </DropdownMenuItem>
                  )}
                  {cus && editable && onManageTags && (
                    <DropdownMenuItem onClick={() => onManageTags(cus)}>
                      <Tag className="mr-2 h-3.5 w-3.5" /> Manage Tags
                    </DropdownMenuItem>
                  )}
                  {cus && editable && onManageAttachments && (
                    <DropdownMenuItem onClick={() => onManageAttachments(cus)}>
                      <FileText className="mr-2 h-3.5 w-3.5" /> Manage Documents
                    </DropdownMenuItem>
                  )}
                  {cus && onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(cus)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  )}

                  {customActions && customActions(cus)}
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
                  activeTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("profile")}
              >
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "account"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("account")}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Account
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "social"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("social")}
              >
                <span className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Social & Tags
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
                  <FileText className="h-4 w-4" />
                  Documents {documents.length > 0 && `(${documents.length})`}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-0">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* 1. Essential Information */}
                <DescriptionList title="Contact Information" columns={3}>
                  <DescriptionItem
                    label="Business Name"
                    value={cus.business_name}
                  />
                  <DescriptionItem
                    label="Email"
                    value={cus.email}
                    linkType="email"
                  />
                  <DescriptionItem
                    label="Phone"
                    value={cus.phone}
                    linkType="tel"
                  />
                  <DescriptionItem
                    label="Website"
                    value={cus.website}
                    linkType="external"
                  />
                </DescriptionList>

                {/* 2. Address Information */}
                <DescriptionList
                  title="Address Information"
                  icon={MapPin}
                  columns={3}
                >
                  <DescriptionItem
                    label="Street Address"
                    value={cus.street_address}
                    span="md:col-span-2 lg:col-span-3"
                  />
                  <DescriptionItem label="City" value={cus.city} />
                  <DescriptionItem
                    label="State/Province"
                    value={cus.state_province}
                  />
                  <DescriptionItem
                    label="Postal Code"
                    value={cus.postal_code}
                  />
                  <DescriptionItem label="Country" value={cus.country} />
                </DescriptionList>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                {/* Personal Information */}
                <DescriptionList title="Personal Information" columns={3}>
                  <DescriptionItem
                    label="Date of Birth"
                    value={cus.date_of_birth}
                    render={(value) =>
                      formatDate(value as Date | string) as React.ReactNode
                    }
                  />
                  <DescriptionItem
                    label="Gender"
                    value={cus.gender}
                    valueClassName="capitalize"
                  />
                  <DescriptionItem
                    label="Nationality"
                    value={cus.nationality}
                  />
                  <DescriptionItem label="ID Type" value={cus.id_type} />
                  <DescriptionItem label="ID Number" value={cus.id_number} />
                </DescriptionList>

                {/* Preferences & Settings */}
                <DescriptionList title="Preferences & Settings" columns={2}>
                  <DescriptionItem
                    label="Event Preferences"
                    value={cus.event_preferences}
                  />
                  <DescriptionItem
                    label="Seating Preferences"
                    value={cus.seating_preferences}
                  />
                  <DescriptionItem
                    label="Accessibility Needs"
                    value={cus.accessibility_needs}
                  />
                  <DescriptionItem
                    label="Dietary Restrictions"
                    value={cus.dietary_restrictions}
                  />
                  <DescriptionItem
                    label="Preferred Language"
                    value={cus.preferred_language}
                  />

                  <DescriptionSection title="Emergency Contact" showBorder>
                    <DescriptionList columns={3} className="mt-0 mb-0">
                      <DescriptionItem
                        label="Contact Name"
                        value={cus.emergency_contact_name}
                      />
                      <DescriptionItem
                        label="Contact Phone"
                        value={cus.emergency_contact_phone}
                        linkType="tel"
                      />
                      <DescriptionItem
                        label="Relationship"
                        value={cus.emergency_contact_relationship}
                      />
                    </DescriptionList>
                  </DescriptionSection>

                  <DescriptionSection title="Marketing Preferences" showBorder>
                    <div className="flex flex-wrap gap-4">
                      {cus.marketing_opt_in !== undefined && (
                        <DescriptionItem
                          label=""
                          value={
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  cus.marketing_opt_in
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                )}
                              />
                              <span className="text-sm text-muted-foreground">
                                Marketing Opt-in:{" "}
                                {cus.marketing_opt_in ? "Yes" : "No"}
                              </span>
                            </div>
                          }
                          hideIfEmpty={false}
                        />
                      )}
                      {cus.email_marketing !== undefined && (
                        <DescriptionItem
                          label=""
                          value={
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  cus.email_marketing
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                )}
                              />
                              <span className="text-sm text-muted-foreground">
                                Email Marketing:{" "}
                                {cus.email_marketing ? "Yes" : "No"}
                              </span>
                            </div>
                          }
                          hideIfEmpty={false}
                        />
                      )}
                      {cus.sms_marketing !== undefined && (
                        <DescriptionItem
                          label=""
                          value={
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full",
                                  cus.sms_marketing
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                )}
                              />
                              <span className="text-sm text-muted-foreground">
                                SMS Marketing:{" "}
                                {cus.sms_marketing ? "Yes" : "No"}
                              </span>
                            </div>
                          }
                          hideIfEmpty={false}
                        />
                      )}
                    </div>
                  </DescriptionSection>
                </DescriptionList>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-8">
                {/* Account Management */}
                <DescriptionList
                  title="Account Management"
                  icon={Users}
                  columns={3}
                >
                  <DescriptionItem
                    label="Account Manager"
                    value={cus.account_manager_id}
                  />
                  <DescriptionItem
                    label="Sales Representative"
                    value={cus.sales_representative_id}
                  />
                  <DescriptionItem
                    label="Customer Since"
                    value={cus.customer_since}
                    render={(value) =>
                      formatDate(value as Date | string) as React.ReactNode
                    }
                    icon={Calendar}
                  />
                  <DescriptionItem
                    label="Last Purchase"
                    value={cus.last_purchase_date}
                    render={(value) =>
                      formatDate(value as Date | string) as React.ReactNode
                    }
                    icon={ShoppingCart}
                  />
                  <DescriptionItem
                    label="Total Purchase Amount"
                    value={cus.total_purchase_amount}
                    render={(value) =>
                      `$${(value as number)?.toFixed(2) || "0.00"}` as React.ReactNode
                    }
                    valueClassName="font-semibold text-foreground"
                    icon={CreditCard}
                  />
                  <DescriptionItem
                    label="Last Contact"
                    value={cus.last_contact_date}
                    render={(value) => formatDate(value as Date | string)}
                    icon={Phone}
                  />
                </DescriptionList>

                {/* System Information */}
                <DescriptionList
                  title="System Information"
                  icon={Database}
                  columns={3}
                >
                  <DescriptionItem
                    label="Status Reason"
                    value={cus.status_reason}
                  />
                  <DescriptionItem
                    label="Created"
                    value={cus.createdAt}
                    render={(value) =>
                      formatDate(value as Date | string) as React.ReactNode
                    }
                  />
                  <DescriptionItem
                    label="Last Updated"
                    value={cus.updatedAt}
                    render={(value) =>
                      formatDate(value as Date | string) as React.ReactNode
                    }
                  />
                  <DescriptionItem
                    label="Deactivated At"
                    value={cus.deactivatedAt}
                    render={(value) =>
                      formatDate(value as Date | string) as React.ReactNode
                    }
                  />
                </DescriptionList>
              </div>
            )}

            {/* Social & Tags Tab */}
            {activeTab === "social" && (
              <div className="space-y-8">
                {/* Social & Online */}
                <DescriptionList title="Social & Online" columns={2}>
                  <DescriptionItem
                    label="Facebook"
                    value={cus.facebook_url}
                    linkType="external"
                  />
                  <DescriptionItem
                    label="Twitter/X"
                    value={cus.twitter_handle}
                    render={(value) =>
                      ((value as string).startsWith("@")
                        ? value
                        : `@${value}`) as React.ReactNode
                    }
                  />
                  <DescriptionItem
                    label="LinkedIn"
                    value={cus.linkedin_url}
                    linkType="external"
                  />
                  <DescriptionItem
                    label="Instagram"
                    value={cus.instagram_handle}
                    render={(value) =>
                      ((value as string).startsWith("@")
                        ? value
                        : `@${value}`) as React.ReactNode
                    }
                  />
                </DescriptionList>

                {/* Tags & Classification */}
                <DescriptionList
                  title="Tags & Classification"
                  icon={Tag}
                  columns={2}
                >
                  <DescriptionItem
                    label={`Tags${cus.tags && cus.tags.length > 0 ? ` (${cus.tags.length})` : ""}`}
                    value={
                      cus.tags && cus.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {cus.tags.map((tag, index) => (
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Tag className="h-4 w-4 opacity-50" />
                          <span>No tags assigned</span>
                        </div>
                      )
                    }
                    hideIfEmpty={false}
                    icon={Tag}
                  />

                  <DescriptionItem
                    label="Priority"
                    value={
                      cus.priority ? (
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize",
                            cus.priority.toLowerCase() === "high" &&
                              "bg-destructive/10 text-destructive",
                            cus.priority.toLowerCase() === "medium" &&
                              "bg-yellow-500/10 text-yellow-600",
                            cus.priority.toLowerCase() === "low" &&
                              "bg-muted text-muted-foreground"
                          )}
                        >
                          {cus.priority}
                        </span>
                      ) : undefined
                    }
                  />

                  <DescriptionItem
                    label="Internal Notes"
                    value={cus.notes}
                    valueClassName="whitespace-pre-wrap"
                  />

                  <DescriptionItem
                    label="Public Notes"
                    value={cus.public_notes}
                    valueClassName="whitespace-pre-wrap"
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
                      {JSON.stringify(cus, null, 2)}
                    </pre>
                  </div>
                </Card>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <DocumentList
                documents={documents}
                isLoading={isLoadingDocuments}
                onManageAttachments={
                  onManageAttachments
                    ? () => onManageAttachments(cus!)
                    : undefined
                }
                loading={loading}
              />
            )}
          </div>
        </Tabs>
      </div>
    </Card>
  );
}
