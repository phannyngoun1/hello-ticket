/**
 * Test Detail Component
 *
 * Display detailed information about a test with optional edit and activity views.
 *
 * @author Phanny
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
import {
  Edit,
  MoreVertical,
  Info,
  Database,
  
} from "lucide-react";
import { Test } from "./types";

export interface TestDetailProps {
  className?: string;
  data?: Test;
  loading?: boolean;
  error?: Error | null;
  
  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;
  onEdit?: (data: Test) => void;
  
  customActions?: (data: Test) => React.ReactNode;
}

export function TestDetail({
  className,
  data,
  loading = false,
  error = null,
  
  showMetadata = false,
  editable = true,
  onEdit,
  
  customActions,
}: TestDetailProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "metadata">("profile");
  

  // All hooks must be called before any early returns
  
  const getTestDisplayName = () => {
    
    
    
    return data?.code || data?.id || "";
    
    
    
    
    
    
    
    return data?.id || "";
  };
  

  const displayName = useMemo(
    () =>
      data
        ? getTestDisplayName()
        : "",
    [data, data?.code]
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
          <div className="text-muted-foreground">No test selected</div>
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

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              {customActions?.(data)}
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={cn("h-8 px-2 text-xs")} aria-label="Actions">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {editable && onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(data)}>
                      <Edit className="mr-2 h-3.5 w-3.5" /> Edit test
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
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Basic Information
                    </h3>
                    <dl className="space-y-3">
                      
                      
                      
                      
                      
                      <div>
                        <dt className="text-sm font-medium">Code</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatFieldValue(data.code)}
                        </dd>
                      </div>
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      
                      <div>
                        <dt className="text-sm font-medium">Name</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatFieldValue(data.name)}
                        </dd>
                      </div>
                      
                      
                      
                      
                      
                      
                      
                    </dl>
                  </div>

                  

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Timeline
                    </h3>
                    <dl className="space-y-3">
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
