/**
 * Customer Detail Component
 *
 * Display detailed information about a customer with optional edit and activity views.
 *
 * @author Phanny
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Card, Badge } from "@truths/ui";
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
  XCircle,
  CheckCircle2,
  User,
  Building2,
  Share2,
  Tag,
  SettingsIcon,
  AlertCircle,
  Globe,
} from "lucide-react";
import {
  DocumentList,
  DescriptionList,
  DescriptionItem,
  DescriptionSection,
  ActionList,
  CopyButton,
  TagList,
  ButtonTabs,
  RefreshButton,
} from "@truths/custom-ui";
import type { ButtonTabItem } from "@truths/custom-ui";
import { AttachmentService, FileUpload } from "@truths/shared";
import { api } from "@truths/api";

import { Customer } from "../types";

import { CustomerProfilePhotoUpload } from "./customer-profile-photo-upload";

const ID_TYPE_LABELS: Record<string, string> = {
  passport: "Passport",
  driver_license: "Driver's License",
  national_id: "National ID",
  other: "Other",
};

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
  profilePhoto?: FileUpload | null;
  onProfilePhotoChange?: (photo: FileUpload | null) => void;
  customActions?: (cus: Customer) => React.ReactNode;
  onRefresh?: () => void;
  isRefetching?: boolean;
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
  profilePhoto,
  onProfilePhotoChange,
  customActions,
  onRefresh,
  isRefetching = false,
}: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "account" | "social" | "metadata" | "documents"
  >("overview");
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

  // Build action items
  const isActive = cus?.status === "active";
  const hasMetadata = showMetadata;

  // Build tabs configuration
  const tabs: ButtonTabItem[] = [
    {
      value: "overview",
      label: "Overview",
      icon: Info,
    },
    {
      value: "profile",
      label: "Preferences & Settings",
      icon: SettingsIcon,
    },
    {
      value: "account",
      label: "Account",
      icon: Building2,
    },
    {
      value: "social",
      label: "Social & Tags",
      icon: Share2,
    },
    {
      value: "documents",
      label:
        "Documents" + (documents.length > 0 ? ` (${documents.length})` : ""),
      icon: FileText,
    },
  ];

  // Add metadata tab if enabled
  if (hasMetadata) {
    tabs.splice(4, 0, {
      value: "metadata",
      label: "Metadata",
      icon: Database,
    });
  }

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
            {cus ? (
              <div className="flex-shrink-0">
                <CustomerProfilePhotoUpload
                  customer={cus}
                  attachmentService={attachmentServiceInstance}
                  currentPhoto={profilePhoto}
                  onPhotoChange={onProfilePhotoChange}
                />
              </div>
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
                    <CopyButton
                      value={cus.code}
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      title="Copy code"
                    />
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
            <ActionList
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
                    {customActions?.(cus)}
                  </>
                ) : undefined
              }
              actions={[
                ...(cus && onCreateBooking
                  ? [
                      {
                        id: "book-now",
                        label: "Book Now",
                        icon: <ShoppingCart className="h-4 w-4" />,
                        onClick: () => onCreateBooking(cus),
                        variant: "default" as const, // Using default variant for primary action
                      },
                    ]
                  : []),
                ...(editable && cus && onEdit
                  ? [
                      {
                        id: "edit",
                        label: "Edit",
                        icon: <Edit className="h-4 w-4" />,
                        onClick: () => onEdit(cus),
                        variant: "outline" as const,
                      },
                    ]
                  : []),
                ...(cus && onViewBookings
                  ? [
                      {
                        id: "view-bookings",
                        label: "View Bookings",
                        icon: <CreditCard className="h-4 w-4" />,
                        onClick: () => onViewBookings(cus),
                        variant: "outline" as const,
                      },
                    ]
                  : []),
                ...(cus && isActive && onDeactivate
                  ? [
                      {
                        id: "deactivate",
                        label: "Deactivate",
                        icon: <UserX className="h-4 w-4" />,
                        onClick: () => onDeactivate(cus),
                        display: "dropdown-item" as const,
                      },
                    ]
                  : []),
                ...(cus && !isActive && onActivate
                  ? [
                      {
                        id: "activate",
                        label: "Activate",
                        icon: <UserCheck className="h-4 w-4" />,
                        onClick: () => onActivate(cus),
                        display: "dropdown-item" as const,
                      },
                    ]
                  : []),
                ...(cus && editable && onManageTags
                  ? [
                      {
                        id: "manage-tags",
                        label: "Manage Tags",
                        icon: <Tag className="h-4 w-4" />,
                        onClick: () => onManageTags(cus),
                        display: "dropdown-item" as const,
                      },
                    ]
                  : []),
                ...(cus && editable && onManageAttachments
                  ? [
                      {
                        id: "manage-documents",
                        label: "Manage Documents",
                        icon: <FileText className="h-4 w-4" />,
                        onClick: () => onManageAttachments(cus),
                        display: "dropdown-item" as const,
                      },
                    ]
                  : []),
                ...(cus && onDelete
                  ? [
                      {
                        id: "delete",
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: () => onDelete(cus),
                        variant: "destructive" as const, // This only affects button variant, but good to have
                        display: "dropdown-item" as const,
                      },
                    ]
                  : []),
              ]}
            />
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
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* Personal Information */}
                  <DescriptionList
                    title="Personal Information"
                    icon={User}
                    columns={3}
                  >
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
                    <DescriptionItem
                      label="ID Type"
                      value={cus.id_type}
                      render={(value) =>
                        (value && ID_TYPE_LABELS[value as string]) ||
                        (value as string) ||
                        undefined
                      }
                    />
                    <DescriptionItem label="ID Number" value={cus.id_number} />
                  </DescriptionList>
                  {/* 1. Essential Information */}
                  <DescriptionList
                    title="Contact Information"
                    icon={Mail}
                    columns={3}
                  >
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

                  <DescriptionList
                    columns={3}
                    title="Emergency Contact"
                    icon={AlertCircle}
                    className="mt-0 mb-0"
                  >
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
                  {/* Preferences & Settings */}
                  <DescriptionList columns={2}>
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
                  </DescriptionList>

                  <DescriptionSection showBorder>
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
                  <DescriptionList
                    title="Social & Online"
                    icon={Globe}
                    columns={2}
                  >
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
                    columns={1}
                  >
                    <DescriptionItem
                      label={``}
                      value={
                        cus.tags && cus.tags.length > 0 ? (
                          <TagList tags={cus.tags} />
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Tag className="h-4 w-4 opacity-50" />
                            <span>No tags assigned</span>
                          </div>
                        )
                      }
                      hideIfEmpty={false}
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
          )}
        </ButtonTabs>
      </div>
    </Card>
  );
}
