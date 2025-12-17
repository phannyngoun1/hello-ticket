/**
 * TestBasic Detail Component
 *
 * Display detailed information about a test-basic
 *
 * @author Phanny
 */

import React, { useMemo } from "react";
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  Edit,
  MoreVertical,
  Info,
} from "lucide-react";
import type {TestBasic} from "./types";

export interface TestBasicDetailProps {
  className?: string | undefined;
  tb?: TestBasic | undefined;
  loading?: boolean | undefined;
  error?: Error | null | undefined;
  editable?: boolean | undefined;
  onEdit?: ((tb: TestBasic) => void) | undefined;
  customActions?: ((tb: TestBasic) => React.ReactNode) | undefined;
}

export function TestBasicDetail({
  className,
  tb,
  loading = false,
  error = null,
  editable = true,
  onEdit,
  customActions,
}: TestBasicDetailProps) {
  const displayName = useMemo(
    () =>
      tb
        ? tb.name || tb.code || tb.id
        : "",
    [tb]
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
      return trimmed;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }};

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

  if (!tb) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No test-basic selected</div>
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
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10">
              <Info className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>
              {tb.code && (
                <p className="text-sm text-muted-foreground mt-1">
                  Code: {tb.code}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {customActions?.(tb)}
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {editable && onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(tb)}>
                      <Edit className="mr-2 h-3.5 w-3.5" /> Edit test-basic
                    </DropdownMenuItem>
                  )}
                  {customActions && customActions(tb)}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                Basic Information
              </h3>
              <dl className="space-y-3">
                {tb.code && (
                  <div>
                    <dt className="text-sm font-medium">Code</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {formatFieldValue(tb.code)}
                    </dd>
                  </div>
                )}
                {tb.name && (
                  <div>
                    <dt className="text-sm font-medium">Name</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {formatFieldValue(tb.name)}
                    </dd>
                  </div>
                )}
                {tb.id && (
                  <div>
                    <dt className="text-sm font-medium">ID</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {formatFieldValue(tb.id)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                Timeline
              </h3>
              <dl className="space-y-3">
                {tb.created_at && (
                  <div>
                    <dt className="text-sm font-medium">Created</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {formatDate(tb.created_at)}
                    </dd>
                  </div>
                )}
                {tb.updated_at && (
                  <div>
                    <dt className="text-sm font-medium">Last Updated</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">
                      {formatDate(tb.updated_at)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
