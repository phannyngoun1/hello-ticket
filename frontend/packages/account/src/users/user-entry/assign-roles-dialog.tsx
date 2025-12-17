/**
 * Assign Roles Dialog Component
 *
 * Dialog for assigning roles directly to a user (Method 1 - direct role assignment)
 *
 * @author Phanny
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, CheckSquare, Square } from "lucide-react";
import { Button } from "@truths/ui";
import { Input } from "@truths/ui";
import { FormItem, FormLabel, FormControl, FormDescription } from "@truths/ui";
import { useToast, cn } from "@truths/ui";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { useDensityStyles, useDensity } from "@truths/utils";
import { RoleService } from "../../roles/role-service";
import { Role, User } from "../../types";
import { ApiError } from "@truths/api";

export interface AssignRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  roleService: RoleService;
  onSubmit: (userId: string, roleIds: string[]) => Promise<void>;
  loading?: boolean;
  error?: Error | null;
}

export function AssignRolesDialog({
  open,
  onOpenChange,
  user,
  roleService,
  onSubmit,
  loading = false,
}: AssignRolesDialogProps) {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const { toast } = useToast();
  const { isCompact } = useDensity();
  const density = useDensityStyles();

  useEffect(() => {
    if (open && user) {
      loadRoles();
    } else {
      setSelectedRoles([]);
      setUserRoles([]);
      setFilterQuery("");
    }
  }, [open, user]);

  // Filter roles based on search query
  const filteredRoles = useMemo(() => {
    if (!filterQuery.trim()) {
      return availableRoles;
    }
    const query = filterQuery.toLowerCase();
    return availableRoles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
    );
  }, [availableRoles, filterQuery]);

  const loadRoles = async () => {
    if (!user) return;

    setLoadingRoles(true);
    try {
      // Fetch all available roles (excluding system roles for direct assignment)
      // Note: System roles should be assigned via base_role, not directly
      const allRoles = await roleService.fetchRoles(true);
      // Filter out system roles for direct assignment
      const assignableRoles = allRoles.filter((role) => !role.isSystem);
      setAvailableRoles(assignableRoles);

      // Fetch user's current direct roles
      const currentRoles = await roleService.getUserDirectRoles(user.id);
      setUserRoles(currentRoles);
      setSelectedRoles(currentRoles.map((r) => r.id));
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Show confirmation dialog instead of directly submitting
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!user) return;

    try {
      // Get current role IDs
      const currentRoleIds = userRoles.map((r) => r.id);
      const newRoleIds = selectedRoles;

      // Find roles to add and remove
      const rolesToAdd = newRoleIds.filter(
        (id) => !currentRoleIds.includes(id)
      );
      const rolesToRemove = currentRoleIds.filter(
        (id) => !newRoleIds.includes(id)
      );

      // Remove roles from user
      for (const roleId of rolesToRemove) {
        try {
          await roleService.removeRoleFromUser(user.id, roleId);
        } catch (err) {
          const errorMessage = formatErrorMessage(
            err,
            `Failed to remove role. `
          );
          setShowConfirmDialog(false);
          toast({
            title: "Failed to Remove Role",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
      }

      // Add roles to user
      for (const roleId of rolesToAdd) {
        try {
          await roleService.assignRoleToUser(user.id, roleId);
        } catch (err) {
          const errorMessage = formatErrorMessage(
            err,
            `Failed to assign role. `
          );
          setShowConfirmDialog(false);
          toast({
            title: "Failed to Assign Role",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
      }

      await onSubmit(user.id, selectedRoles);
      setShowConfirmDialog(false);
      toast({
        title: "Roles Updated",
        description: "User roles have been successfully updated",
      });
      onOpenChange(false);
    } catch (err) {
      const errorMessage = formatErrorMessage(err, "Failed to update roles. ");
      setShowConfirmDialog(false);
      toast({
        title: "Failed to Update Roles",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatErrorMessage = (err: unknown, prefix: string = ""): string => {
    if (err instanceof ApiError) {
      if (err.status === 0) {
        // Network error or CORS issue
        return `${prefix}Network error: Unable to connect to the server. Please check your connection or contact support if the problem persists.`;
      }
      return `${prefix}${err.message}`;
    }
    if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
      return `${prefix}Network error: Unable to connect to the server. This could be due to CORS configuration or server connectivity issues.`;
    }
    if (err instanceof Error) {
      return `${prefix}${err.message}`;
    }
    return `${prefix}An unexpected error occurred. Please try again.`;
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const toggleSelectAll = () => {
    const allRoleIds = availableRoles.map((r) => r.id);
    const allSelected =
      allRoleIds.length > 0 &&
      allRoleIds.every((id) => selectedRoles.includes(id));

    setSelectedRoles(allSelected ? [] : allRoleIds);
  };

  const allRolesSelected =
    availableRoles.length > 0 &&
    availableRoles.every((role) => selectedRoles.includes(role.id));

  if (!user) {
    return null;
  }

  const handleClose = () => {
    onOpenChange(false);
  };

  // Calculate changes for confirmation dialog
  const currentRoleIds = userRoles.map((r) => r.id);
  const rolesToAdd = selectedRoles.filter((id) => !currentRoleIds.includes(id));
  const rolesToRemove = currentRoleIds.filter(
    (id) => !selectedRoles.includes(id)
  );
  const rolesToAddNames = rolesToAdd
    .map((id) => availableRoles.find((r) => r.id === id)?.name)
    .filter(Boolean) as string[];
  const rolesToRemoveNames = rolesToRemove
    .map((id) => userRoles.find((r) => r.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <FullScreenDialog
      open={open}
      onClose={handleClose}
      title={`Assign Roles to ${user.firstName || user.username || user.email}`}
      showCancelButton
      onCancel={handleClose}
      showSubmitButton
      onSubmit={() => {
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }}
      onEscape={handleClose}
      autoSubmitShortcut={true}
      autoClearShortcut={true}
      onClear={() => {
        setFilterQuery("");
        setSelectedRoles(userRoles.map((r) => r.id));
        if (formRef.current) {
          formRef.current.reset();
        }
      }}
      maxWidth="800px"
      loading={loading}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        id="assign-roles-form"
        className="space-y-6 w-full"
      >
        {/* Form Content */}
        <div
          className={cn(
            "bg-background border border-border rounded-lg shadow-sm mt-12",
            density.paddingContainer
          )}
        >
          <div className={cn("space-y-6", density.spacingFormSection)}>
            {/* Role Selection */}
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className={cn(density.textSizeLabel, "font-medium")}>
                  Assign Roles
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  disabled={loading || availableRoles.length === 0}
                  className={cn(
                    density.buttonHeightSmall,
                    density.paddingCell,
                    density.textSizeSmall,
                    "font-medium"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {allRolesSelected ? (
                      <CheckSquare className={density.iconSizeSmall} />
                    ) : (
                      <Square className={density.iconSizeSmall} />
                    )}
                    <span>
                      {allRolesSelected ? "Deselect All" : "Select All"}
                    </span>
                  </span>
                </Button>
              </div>
              <FormControl>
                {loadingRoles ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <>
                    {/* Filter Controls */}
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search
                          className={cn(
                            "absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground",
                            density.iconSizeSmall
                          )}
                        />
                        <Input
                          type="text"
                          placeholder="Search roles..."
                          value={filterQuery}
                          onChange={(e) => setFilterQuery(e.target.value)}
                          disabled={loading}
                          className={cn(
                            "pl-8",
                            density.inputHeight,
                            density.textSize
                          )}
                        />
                      </div>
                    </div>
                    <div
                      className={cn(
                        "space-y-2 rounded-md border max-h-[500px] overflow-y-auto",
                        density.paddingForm
                      )}
                    >
                      {availableRoles.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No custom roles available. Create a role first.
                        </div>
                      ) : filteredRoles.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          {filterQuery
                            ? "No roles match your search"
                            : "No roles available"}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                          {filteredRoles.map((role) => (
                            <label
                              key={role.id}
                              className="flex items-start gap-3 rounded-md border p-3 pl-4 hover:bg-muted/50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedRoles.includes(role.id)}
                                onChange={() => toggleRole(role.id)}
                                disabled={loading}
                                className="mt-0.5 h-4 w-4 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-sm font-medium truncate"
                                  title={role.name}
                                >
                                  {role.name}
                                </div>
                                {role.description && (
                                  <div
                                    className="text-xs text-muted-foreground truncate mt-0.5"
                                    title={role.description}
                                  >
                                    {role.description}
                                  </div>
                                )}
                                {role.permissions.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {role.permissions.length} permission
                                    {role.permissions.length !== 1 ? "s" : ""}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </FormControl>
              <FormDescription className={density.textSizeSmall}>
                Select custom roles for this user. System roles are assigned via
                the user's base role.
              </FormDescription>
            </FormItem>

            {/* Selected Roles Summary */}
            {selectedRoles.length > 0 && (
              <div className="rounded-md bg-muted/50 border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">
                    {selectedRoles.length}{" "}
                    {selectedRoles.length === 1 ? "role" : "roles"} selected
                  </div>
                </div>
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(140px, 1fr))",
                  }}
                >
                  {selectedRoles.map((roleId) => {
                    const role = availableRoles.find((r) => r.id === roleId);
                    return role ? (
                      <span
                        key={roleId}
                        className="group flex items-center justify-between gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary border border-primary/20 min-w-0 hover:bg-primary/15 transition-colors"
                        title={role.name}
                      >
                        <span className="truncate flex-1 text-left">
                          {role.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRole(roleId);
                          }}
                          disabled={loading}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-4 w-4 rounded hover:bg-destructive/20 flex items-center justify-center"
                          aria-label={`Remove ${role.name}`}
                          title={`Remove ${role.name}`}
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          setShowConfirmDialog(open);
        }}
        title="Confirm Role Assignment"
        description={
          <>
            <p className="mb-3 text-xs">
              Are you sure you want to update the roles for{" "}
              <span className="font-semibold">
                {user.firstName || user.username || user.email}
              </span>
              ?
            </p>
            {(rolesToAddNames.length > 0 || rolesToRemoveNames.length > 0) && (
              <div className="space-y-1.5">
                {rolesToAddNames.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-muted-foreground">
                      Adding {rolesToAddNames.length} role
                      {rolesToAddNames.length !== 1 ? "s" : ""}:
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {rolesToAddNames.map((name) => (
                        <div key={name} className="text-foreground pl-2">
                          • {name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rolesToRemoveNames.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-muted-foreground">
                      Removing {rolesToRemoveNames.length} role
                      {rolesToRemoveNames.length !== 1 ? "s" : ""}:
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {rolesToRemoveNames.map((name) => (
                        <div key={name} className="text-foreground pl-2">
                          • {name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {rolesToAddNames.length === 0 &&
              rolesToRemoveNames.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No changes to apply.
                </p>
              )}
          </>
        }
        confirmAction={{
          label: loading ? "Saving..." : "Confirm & Save",
          onClick: handleConfirmSubmit,
          loading: loading,
          disabled: loading || loadingRoles,
        }}
        cancelAction={{
          label: "Cancel",
          variant: "outline",
          disabled: loading,
        }}
      />
    </FullScreenDialog>
  );
}
