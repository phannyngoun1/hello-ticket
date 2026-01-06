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
} from "lucide-react";
import { ActionList, type ActionItem, DocumentList } from "@truths/custom-ui";
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
  const actionItems: ActionItem[] = [];

  if (editable && cus && onEdit) {
    actionItems.push({
      id: "edit",
      label: "Edit",
      icon: <Edit className="h-3.5 w-3.5" />,
      onClick: () => onEdit(cus),
      variant: "default",
    });
  }

  if (cus && onCreateBooking) {
    actionItems.push({
      id: "create-booking",
      label: "Create Booking",
      icon: <ShoppingCart className="h-3.5 w-3.5" />,
      onClick: () => onCreateBooking(cus),
      variant: "default",
    });
  }

  if (cus && onViewBookings) {
    actionItems.push({
      id: "view-bookings",
      label: "View Bookings",
      icon: <CreditCard className="h-3.5 w-3.5" />,
      onClick: () => onViewBookings(cus),
      variant: "outline",
    });
  }

  const isActive = cus?.status === "active";

  if (cus && isActive && onDeactivate) {
    actionItems.push({
      id: "deactivate",
      label: "Deactivate",
      icon: <UserX className="h-3.5 w-3.5" />,
      onClick: () => onDeactivate(cus),
      variant: "outline",
    });
  }

  if (cus && !isActive && onActivate) {
    actionItems.push({
      id: "activate",
      label: "Activate",
      icon: <UserCheck className="h-3.5 w-3.5" />,
      onClick: () => onActivate(cus),
      variant: "default",
    });
  }

  if (cus && editable && onManageTags) {
    actionItems.push({
      id: "manage-tags",
      label: "Manage Tags",
      icon: <Tag className="h-3.5 w-3.5" />,
      onClick: () => onManageTags(cus),
      variant: "outline",
    });
  }

  if (cus && editable && onManageAttachments) {
    actionItems.push({
      id: "manage-attachments",
      label: "Manage Documents",
      icon: <FileText className="h-3.5 w-3.5" />,
      onClick: () => onManageAttachments(cus),
      variant: "outline",
    });
  }

  if (cus && onDelete) {
    actionItems.push({
      id: "delete",
      label: "Delete",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: () => onDelete(cus),
      variant: "destructive",
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

  const hasMetadata = showMetadata;

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

          <ActionList
            actions={actionItems}
            maxVisibleActions={3}
            customActions={customActions?.(cus)}
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
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-foreground">
                    Contact Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-sm font-medium">Business Name</dt>
                      <dd className="mt-1 text-sm text-muted-foreground">
                        {formatFieldValue(cus.business_name)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">Email</dt>
                      <dd className="mt-1 text-sm text-muted-foreground">
                        {cus.email ? (
                          <a
                            href={`mailto:${cus.email}`}
                            className="text-primary hover:underline"
                          >
                            {cus.email}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">Phone</dt>
                      <dd className="mt-1 text-sm text-muted-foreground">
                        {cus.phone ? (
                          <a
                            href={`tel:${cus.phone}`}
                            className="text-primary hover:underline"
                          >
                            {cus.phone}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium">Website</dt>
                      <dd className="mt-1 text-sm text-muted-foreground">
                        {cus.website ? (
                          <a
                            href={cus.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {cus.website}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </dd>
                    </div>
                  </div>
                </div>

                {/* 2. Address Information */}
                {(cus.street_address ||
                  cus.city ||
                  cus.state_province ||
                  cus.postal_code ||
                  cus.country) && (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address Information
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {cus.street_address && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <dt className="text-sm font-medium">
                            Street Address
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.street_address)}
                          </dd>
                        </div>
                      )}
                      {cus.city && (
                        <div>
                          <dt className="text-sm font-medium">City</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.city)}
                          </dd>
                        </div>
                      )}
                      {cus.state_province && (
                        <div>
                          <dt className="text-sm font-medium">
                            State/Province
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.state_province)}
                          </dd>
                        </div>
                      )}
                      {cus.postal_code && (
                        <div>
                          <dt className="text-sm font-medium">Postal Code</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.postal_code)}
                          </dd>
                        </div>
                      )}
                      {cus.country && (
                        <div>
                          <dt className="text-sm font-medium">Country</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.country)}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                {/* Customer Profile */}
                {(cus.date_of_birth ||
                  cus.gender ||
                  cus.nationality ||
                  cus.id_number ||
                  cus.id_type) && (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-foreground">
                      Personal Information
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {cus.date_of_birth && (
                        <div>
                          <dt className="text-sm font-medium">Date of Birth</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(cus.date_of_birth)}
                          </dd>
                        </div>
                      )}
                      {cus.gender && (
                        <div>
                          <dt className="text-sm font-medium">Gender</dt>
                          <dd className="mt-1 text-sm text-muted-foreground capitalize">
                            {formatFieldValue(cus.gender)}
                          </dd>
                        </div>
                      )}
                      {cus.nationality && (
                        <div>
                          <dt className="text-sm font-medium">Nationality</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.nationality)}
                          </dd>
                        </div>
                      )}
                      {cus.id_type && (
                        <div>
                          <dt className="text-sm font-medium">ID Type</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.id_type)}
                          </dd>
                        </div>
                      )}
                      {cus.id_number && (
                        <div>
                          <dt className="text-sm font-medium">ID Number</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.id_number)}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Preferences & Settings */}
                {(cus.event_preferences ||
                  cus.seating_preferences ||
                  cus.accessibility_needs ||
                  cus.dietary_restrictions ||
                  cus.preferred_language ||
                  cus.emergency_contact_name ||
                  cus.marketing_opt_in !== undefined ||
                  cus.email_marketing !== undefined ||
                  cus.sms_marketing !== undefined) && (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-foreground">
                      Preferences & Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {cus.event_preferences && (
                          <div>
                            <dt className="text-sm font-medium">
                              Event Preferences
                            </dt>
                            <dd className="mt-1 text-sm text-muted-foreground">
                              {formatFieldValue(cus.event_preferences)}
                            </dd>
                          </div>
                        )}
                        {cus.seating_preferences && (
                          <div>
                            <dt className="text-sm font-medium">
                              Seating Preferences
                            </dt>
                            <dd className="mt-1 text-sm text-muted-foreground">
                              {formatFieldValue(cus.seating_preferences)}
                            </dd>
                          </div>
                        )}
                        {cus.accessibility_needs && (
                          <div>
                            <dt className="text-sm font-medium">
                              Accessibility Needs
                            </dt>
                            <dd className="mt-1 text-sm text-muted-foreground">
                              {formatFieldValue(cus.accessibility_needs)}
                            </dd>
                          </div>
                        )}
                        {cus.dietary_restrictions && (
                          <div>
                            <dt className="text-sm font-medium">
                              Dietary Restrictions
                            </dt>
                            <dd className="mt-1 text-sm text-muted-foreground">
                              {formatFieldValue(cus.dietary_restrictions)}
                            </dd>
                          </div>
                        )}
                        {cus.preferred_language && (
                          <div>
                            <dt className="text-sm font-medium">
                              Preferred Language
                            </dt>
                            <dd className="mt-1 text-sm text-muted-foreground">
                              {formatFieldValue(cus.preferred_language)}
                            </dd>
                          </div>
                        )}
                      </div>

                      {(cus.emergency_contact_name ||
                        cus.emergency_contact_phone ||
                        cus.emergency_contact_relationship) && (
                        <div className="pt-2 border-t">
                          <h4 className="text-sm font-medium mb-3">
                            Emergency Contact
                          </h4>
                          <div className="grid gap-4 md:grid-cols-3">
                            {cus.emergency_contact_name && (
                              <div>
                                <dt className="text-sm font-medium">
                                  Contact Name
                                </dt>
                                <dd className="mt-1 text-sm text-muted-foreground">
                                  {formatFieldValue(cus.emergency_contact_name)}
                                </dd>
                              </div>
                            )}
                            {cus.emergency_contact_phone && (
                              <div>
                                <dt className="text-sm font-medium">
                                  Contact Phone
                                </dt>
                                <dd className="mt-1 text-sm text-muted-foreground">
                                  {cus.emergency_contact_phone ? (
                                    <a
                                      href={`tel:${cus.emergency_contact_phone}`}
                                      className="text-primary hover:underline"
                                    >
                                      {cus.emergency_contact_phone}
                                    </a>
                                  ) : (
                                    "N/A"
                                  )}
                                </dd>
                              </div>
                            )}
                            {cus.emergency_contact_relationship && (
                              <div>
                                <dt className="text-sm font-medium">
                                  Relationship
                                </dt>
                                <dd className="mt-1 text-sm text-muted-foreground">
                                  {formatFieldValue(
                                    cus.emergency_contact_relationship
                                  )}
                                </dd>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(cus.marketing_opt_in !== undefined ||
                        cus.email_marketing !== undefined ||
                        cus.sms_marketing !== undefined) && (
                        <div className="pt-2 border-t">
                          <h4 className="text-sm font-medium mb-3">
                            Marketing Preferences
                          </h4>
                          <div className="flex flex-wrap gap-4">
                            {cus.marketing_opt_in !== undefined && (
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
                            )}
                            {cus.email_marketing !== undefined && (
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
                            )}
                            {cus.sms_marketing !== undefined && (
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
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-8">
                {/* Account Management */}
                {(cus.account_manager_id ||
                  cus.sales_representative_id ||
                  cus.customer_since ||
                  cus.last_purchase_date ||
                  cus.total_purchase_amount !== undefined ||
                  cus.last_contact_date) && (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Account Management
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {cus.account_manager_id && (
                        <div>
                          <dt className="text-sm font-medium">
                            Account Manager
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.account_manager_id)}
                          </dd>
                        </div>
                      )}
                      {cus.sales_representative_id && (
                        <div>
                          <dt className="text-sm font-medium">
                            Sales Representative
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(cus.sales_representative_id)}
                          </dd>
                        </div>
                      )}
                      {cus.customer_since && (
                        <div>
                          <dt className="text-sm font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Customer Since
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(cus.customer_since)}
                          </dd>
                        </div>
                      )}
                      {cus.last_purchase_date && (
                        <div>
                          <dt className="text-sm font-medium flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3" />
                            Last Purchase
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(cus.last_purchase_date)}
                          </dd>
                        </div>
                      )}
                      {cus.total_purchase_amount !== undefined && (
                        <div>
                          <dt className="text-sm font-medium flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            Total Purchase Amount
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-foreground">
                            ${cus.total_purchase_amount?.toFixed(2) || "0.00"}
                          </dd>
                        </div>
                      )}
                      {cus.last_contact_date && (
                        <div>
                          <dt className="text-sm font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Last Contact
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(cus.last_contact_date)}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* System Information */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    System Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cus.status_reason && (
                      <div>
                        <dt className="text-sm font-medium">Status Reason</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatFieldValue(cus.status_reason)}
                        </dd>
                      </div>
                    )}
                    {cus.createdAt && (
                      <div>
                        <dt className="text-sm font-medium">Created</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(cus.createdAt)}
                        </dd>
                      </div>
                    )}
                    {cus.updatedAt && (
                      <div>
                        <dt className="text-sm font-medium">Last Updated</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(cus.updatedAt)}
                        </dd>
                      </div>
                    )}
                    {cus.deactivatedAt && (
                      <div>
                        <dt className="text-sm font-medium">Deactivated At</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(cus.deactivatedAt)}
                        </dd>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Social & Tags Tab */}
            {activeTab === "social" && (
              <div className="space-y-8">
                {/* Social & Online */}
                {(cus.facebook_url ||
                  cus.twitter_handle ||
                  cus.linkedin_url ||
                  cus.instagram_handle) && (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-foreground">
                      Social & Online
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {cus.facebook_url && (
                        <div>
                          <dt className="text-sm font-medium">Facebook</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            <a
                              href={cus.facebook_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {cus.facebook_url}
                            </a>
                          </dd>
                        </div>
                      )}
                      {cus.twitter_handle && (
                        <div>
                          <dt className="text-sm font-medium">Twitter/X</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {cus.twitter_handle.startsWith("@")
                              ? cus.twitter_handle
                              : `@${cus.twitter_handle}`}
                          </dd>
                        </div>
                      )}
                      {cus.linkedin_url && (
                        <div>
                          <dt className="text-sm font-medium">LinkedIn</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            <a
                              href={cus.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {cus.linkedin_url}
                            </a>
                          </dd>
                        </div>
                      )}
                      {cus.instagram_handle && (
                        <div>
                          <dt className="text-sm font-medium">Instagram</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {cus.instagram_handle.startsWith("@")
                              ? cus.instagram_handle
                              : `@${cus.instagram_handle}`}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags & Classification */}
                {(cus.tags && cus.tags.length > 0) ||
                cus.priority ||
                cus.notes ||
                cus.public_notes ||
                editable ? (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags & Classification
                    </h3>
                    <div className="space-y-4">
                      {/* Tags Section - Always show if tags exist or editable */}
                      {(cus.tags && cus.tags.length > 0) || editable ? (
                        <div>
                          <dt className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Tags{" "}
                            {cus.tags &&
                              cus.tags.length > 0 &&
                              `(${cus.tags.length})`}
                          </dt>
                          <dd className="mt-1">
                            {cus.tags && cus.tags.length > 0 ? (
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
                            )}
                          </dd>
                        </div>
                      ) : null}

                      {/* Priority */}
                      {cus.priority && (
                        <div>
                          <dt className="text-sm font-medium">Priority</dt>
                          <dd className="mt-1">
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
                          </dd>
                        </div>
                      )}

                      {/* Notes */}
                      {cus.notes && (
                        <div>
                          <dt className="text-sm font-medium">
                            Internal Notes
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formatFieldValue(cus.notes)}
                          </dd>
                        </div>
                      )}
                      {cus.public_notes && (
                        <div>
                          <dt className="text-sm font-medium">Public Notes</dt>
                          <dd className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                            {formatFieldValue(cus.public_notes)}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No social links or tags available
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
                  onManageAttachments ? () => onManageAttachments(cus!) : undefined
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
