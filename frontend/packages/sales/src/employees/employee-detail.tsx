/**
 * Employee Detail Component
 *
 * Display detailed information about a employee with optional edit and activity views.
 */

import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Edit, MoreVertical, Info, Database } from "lucide-react";
import { Employee } from "./types";

export interface EmployeeDetailProps {
  className?: string;
  data?: Employee;
  loading?: boolean;
  error?: Error | null;

  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;
  onEdit?: (data: Employee) => void;

  customActions?: (data: Employee) => React.ReactNode;
}

export function EmployeeDetail({
  className,
  data,
  loading = false,
  error = null,

  showMetadata = false,
  editable = true,
  onEdit,

  customActions,
}: EmployeeDetailProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "metadata">("profile");

  // All hooks must be called before any early returns

  const getEmployeeDisplayName = () => {
    return data?.code || data?.name || data?.id || "";

    return data?.id || "";
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
          <div className="text-muted-foreground">No employee selected</div>
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
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
              <Info className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>
              {data.code && (
                <p className="text-sm text-muted-foreground mt-1">
                  Code: {data.code}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {customActions?.(data)}
            </div>
            {editable && onEdit && (
              <Button
                onClick={() => onEdit(data)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {editable && onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(data)}>
                      <Edit className="mr-2 h-3.5 w-3.5" /> Edit employee
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
                  {/* Basic Information */}
                  {data.work_email && (
                    <div>
                      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                        Basic Information
                      </h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium">Work Email</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.work_email)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {/* Organization */}
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Organization
                    </h3>
                    <dl className="space-y-3">
                      {data.job_title && (
                        <div>
                          <dt className="text-sm font-medium">Job Title</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.job_title)}
                          </dd>
                        </div>
                      )}
                      {data.department && (
                        <div>
                          <dt className="text-sm font-medium">Department</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.department)}
                          </dd>
                        </div>
                      )}
                      {data.employment_type && (
                        <div>
                          <dt className="text-sm font-medium">
                            Employment Type
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.employment_type)}
                          </dd>
                        </div>
                      )}
                      {data.hire_date && (
                        <div>
                          <dt className="text-sm font-medium">Hire Date</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.hire_date)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Contact & Location */}
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Contact & Location
                    </h3>
                    <dl className="space-y-3">
                      {data.work_phone && (
                        <div>
                          <dt className="text-sm font-medium">Work Phone</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.work_phone)}
                          </dd>
                        </div>
                      )}
                      {data.mobile_phone && (
                        <div>
                          <dt className="text-sm font-medium">Mobile Phone</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.mobile_phone)}
                          </dd>
                        </div>
                      )}
                      {data.office_location && (
                        <div>
                          <dt className="text-sm font-medium">
                            Office Location
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.office_location)}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium">Timezone</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {data.timezone || "UTC"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Sales & Operations */}
                {(data.skills ||
                  data.assigned_territories ||
                  data.commission_tier) && (
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Sales & Operations
                    </h3>
                    <dl className="grid gap-4 md:grid-cols-3">
                      {data.skills && data.skills.length > 0 && (
                        <div>
                          <dt className="text-sm font-medium">Skills</dt>
                          <dd className="mt-2 flex flex-wrap gap-1">
                            {data.skills.map((skill, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                              >
                                {skill}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                      {data.assigned_territories &&
                        data.assigned_territories.length > 0 && (
                          <div>
                            <dt className="text-sm font-medium">Territories</dt>
                            <dd className="mt-2 flex flex-wrap gap-1">
                              {data.assigned_territories.map((territory, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary-foreground"
                                >
                                  {territory}
                                </span>
                              ))}
                            </dd>
                          </div>
                        )}
                      {data.commission_tier && (
                        <div>
                          <dt className="text-sm font-medium">
                            Commission Tier
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.commission_tier)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Emergency Contact */}
                {(data.emergency_contact_name ||
                  data.emergency_contact_phone ||
                  data.birthday) && (
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      HR / Personal
                    </h3>
                    <dl className="grid gap-4 md:grid-cols-3">
                      {data.emergency_contact_name && (
                        <div>
                          <dt className="text-sm font-medium">
                            Emergency Contact
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.emergency_contact_name)}
                            {data.emergency_contact_phone && (
                              <>
                                {" "}
                                (
                                {formatFieldValue(data.emergency_contact_phone)}
                                )
                              </>
                            )}
                            {data.emergency_contact_relationship && (
                              <div className="text-xs mt-1">
                                {data.emergency_contact_relationship}
                              </div>
                            )}
                          </dd>
                        </div>
                      )}
                      {data.birthday && (
                        <div>
                          <dt className="text-sm font-medium">Birthday</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatFieldValue(data.birthday)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                    Timeline
                  </h3>
                  <dl className="grid gap-4 md:grid-cols-3">
                    {data.created_at && (
                      <div>
                        <dt className="text-sm font-medium">Created</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(data.created_at)}
                        </dd>
                      </div>
                    )}
                    {data.updated_at && (
                      <div>
                        <dt className="text-sm font-medium">Last Updated</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(data.updated_at)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
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
