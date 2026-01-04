/**
 * Role Detail Component
 *
 * Display detailed information about a role including permissions and users.
 *
 * @author Phanny
 */

import React, { useState } from "react";
import { Card } from "@truths/ui";
import { Button } from "@truths/ui";
import { Badge } from "@truths/ui";
import { Tabs } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { AccountComponentMetadata } from "../registry";
import { Role, User } from "../types";
import { Edit } from "lucide-react";
import { useDensityStyles } from "@truths/utils";

export interface RoleDetailProps {
  className?: string;
  role?: Role;
  users?: User[];
  loading?: boolean;
  error?: Error | null;
  showUsers?: boolean;
  editable?: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onUserClick?: (user: User) => void;
  customActions?: (role: Role) => React.ReactNode;
}

export function RoleDetail({
  className,
  role,
  users = [],
  loading = false,
  error = null,
  showUsers = true,
  editable = true,
  onEdit,
  onDelete,
  onUserClick,
  customActions,
}: RoleDetailProps) {
  const [activeTab, setActiveTab] = useState<"permissions" | "users">(
    "permissions"
  );
  const density = useDensityStyles();

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  if (error || !role) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error?.message || "Role not found"}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{role.name}</h2>
              {role.isSystem && <Badge variant="secondary">System Role</Badge>}
            </div>
            {role.description && (
              <p className="mt-2 text-muted-foreground">{role.description}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">
                  {role.userCount || users.length}
                </span>{" "}
                users
              </div>
              <div>
                <span className="font-medium">
                  {role.permissions?.length || 0}
                </span>{" "}
                permissions
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {customActions?.(role)}
            {editable && onEdit && !role.isSystem && (
              <Button onClick={() => onEdit(role)} size="sm" variant="outline" className={cn("h-8 px-2 text-xs")}>
                <Edit className="h-3 w-3 mr-1" />
                Edit Role
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="border-b">
            <div className="flex gap-4">
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "permissions"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("permissions")}
              >
                Permissions
              </button>
              {showUsers && (
                <button
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "users"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("users")}
                >
                  Users ({role.userCount || users.length})
                </button>
              )}
            </div>
          </div>

          <div className="mt-6">
            {/* Permissions Tab */}
            {activeTab === "permissions" && (
              <div className="space-y-4">
                {!role.permissions || role.permissions.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No permissions assigned
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {role.permissions.map((permission) => (
                      <Card key={permission.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{permission.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {permission.action}
                              </Badge>
                              {permission.scope && (
                                <Badge variant="secondary" className="text-xs">
                                  {permission.scope}
                                </Badge>
                              )}
                            </div>
                            {permission.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {permission.description}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Resource: {permission.resource}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-3">
                {users.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No users with this role
                  </p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <Card
                        key={user.id}
                        className={cn(
                          "p-3 transition-colors",
                          onUserClick && "cursor-pointer hover:bg-muted/50"
                        )}
                        onClick={() => onUserClick?.(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {user.firstName || user.lastName
                                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                : user.username || user.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                          <Badge
                            variant={
                              user.status === "active" ? "default" : "secondary"
                            }
                          >
                            {user.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs>

        {/* Actions */}
        {editable && !role.isSystem && (
          <div className="flex items-center gap-2 border-t pt-4">
            {onDelete && (
              <Button variant="destructive" onClick={() => onDelete(role)}>
                Delete Role
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function roleDetailMetadata(): AccountComponentMetadata {
  return {
    name: "Role Detail",
    description: "Display detailed information about a role",
    category: "roles",
    tags: ["roles", "permissions", "detail", "view"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
