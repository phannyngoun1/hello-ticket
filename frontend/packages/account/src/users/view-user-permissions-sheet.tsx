/**
 * View User Permissions Sheet Component
 *
 * Sheet dialog to display all groups, roles, and permissions for a user
 */

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@truths/ui";
import { Badge } from "@truths/ui";
import { User, Role, Group, Permission } from "../types";
import { RoleService } from "../roles/role-service";
import { GroupService } from "../groups/group-service";
import { UsersRound, Shield, Key } from "lucide-react";
import { SearchInput } from "@truths/custom-ui";

export interface ViewUserPermissionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  roleService: RoleService;
  groupService: GroupService;
}

export function ViewUserPermissionsSheet({
  open,
  onOpenChange,
  user,
  roleService,
  groupService,
}: ViewUserPermissionsSheetProps) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permissionSearchQuery, setPermissionSearchQuery] = useState("");

  useEffect(() => {
    if (open && user) {
      loadData();
    } else {
      setGroups([]);
      setRoles([]);
      setError(null);
      setPermissionSearchQuery("");
    }
  }, [open, user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch user groups and all roles (including from groups)
      const [userGroups, userRoles] = await Promise.all([
        groupService.getUserGroups(user.id),
        roleService.getUserAllRoles(user.id),
      ]);

      setGroups(userGroups);
      setRoles(userRoles);
    } catch (err) {
      console.error("Failed to load user permissions:", err);
      setError("Failed to load permissions data");
    } finally {
      setLoading(false);
    }
  };

  // Collect all unique permissions from all roles
  const allPermissions = useMemo(() => {
    const permissionMap = new Map<string, Permission>();
    roles.forEach((role) => {
      role.permissions?.forEach((perm) => {
        if (!permissionMap.has(perm.id)) {
          permissionMap.set(perm.id, perm);
        }
      });
    });
    return Array.from(permissionMap.values());
  }, [roles]);

  // Filter permissions based on search query
  const filteredPermissions = useMemo(() => {
    if (!permissionSearchQuery.trim()) {
      return allPermissions;
    }
    const query = permissionSearchQuery.toLowerCase();
    return allPermissions.filter(
      (perm) =>
        perm.name.toLowerCase().includes(query) ||
        perm.resource?.toLowerCase().includes(query) ||
        perm.action?.toLowerCase().includes(query)
    );
  }, [allPermissions, permissionSearchQuery]);

  if (!user) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="overflow-y-auto"
        style={{
          width: "700px",
          maxWidth: "1000px",
        }}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions & Access
          </SheetTitle>
          <SheetDescription>
            View all groups, roles, and permissions for{" "}
            {user.firstName || user.username || user.email}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Base Role — removed per request */}

              {/* Groups */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <UsersRound className="h-4 w-4" />
                  Groups ({groups.length})
                </h3>
                {groups.length === 0 ? (
                  <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                    User is not assigned to any groups
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className="rounded-md border p-3 hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {group.name}
                              </span>
                              {!group.isActive && (
                                <Badge variant="secondary" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {group.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {group.description}
                              </p>
                            )}
                            {group.roleCount !== undefined && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {group.roleCount} role
                                {group.roleCount !== 1 ? "s" : ""} assigned
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Roles */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Roles ({roles.length})
                </h3>
                {roles.length === 0 ? (
                  <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                    User has no assigned roles
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="rounded-md border p-3 hover:bg-muted/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {role.name}
                              </span>
                              {role.isSystem && (
                                <Badge variant="secondary" className="text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {role.description}
                              </p>
                            )}
                            {role.permissions &&
                              role.permissions.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {role.permissions.length} permission
                                  {role.permissions.length !== 1 ? "s" : ""}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Access Rights (All Permissions) */}
              {allPermissions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Access Rights ({filteredPermissions.length}
                      {permissionSearchQuery &&
                      filteredPermissions.length !== allPermissions.length
                        ? ` of ${allPermissions.length}`
                        : ""}
                      )
                    </h3>
                  </div>
                  <div className="mb-4">
                    <SearchInput
                      placeholder="Search permissions by name, resource, or action..."
                      value={permissionSearchQuery}
                      onChange={(e) => setPermissionSearchQuery(e.target.value)}
                    />
                  </div>
                  {filteredPermissions.length === 0 ? (
                    <div className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                      No permissions found matching "{permissionSearchQuery}"
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden max-h-[500px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 z-10 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-xs uppercase text-muted-foreground">
                              Resource
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-xs uppercase text-muted-foreground">
                              Permission
                            </th>
                            {filteredPermissions.some((p) => p.action) && (
                              <th className="px-4 py-2 text-left font-medium text-xs uppercase text-muted-foreground">
                                Action
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPermissions.map((perm, index) => (
                            <tr
                              key={perm.id}
                              className={`border-b hover:bg-muted/30 ${
                                index % 2 === 0
                                  ? "bg-background"
                                  : "bg-muted/10"
                              }`}
                            >
                              <td className="px-4 py-2 text-xs font-medium">
                                {perm.resource || "other"}
                              </td>
                              <td className="px-4 py-2 text-xs">{perm.name}</td>
                              {filteredPermissions.some((p) => p.action) && (
                                <td className="px-4 py-2 text-xs text-muted-foreground">
                                  {perm.action || "-"}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
