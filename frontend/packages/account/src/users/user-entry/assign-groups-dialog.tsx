/**
 * Assign Groups Dialog Component
 *
 * Dialog for assigning groups to a user (Method 2 - user inherits all group roles)
 *
 * @author Phanny
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, CheckSquare, Square } from "lucide-react";
import { Button } from "@truths/ui";
import { Badge } from "@truths/ui";
import { Input } from "@truths/ui";
import { FormItem, FormLabel, FormControl, FormDescription } from "@truths/ui";
import { useToast, cn } from "@truths/ui";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { useDensityStyles, useDensity } from "@truths/utils";
import { GroupService } from "../../groups/group-service";
import { Group, User } from "../../types";
import { ApiError } from "@truths/api";

export interface AssignGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  groupService: GroupService;
  onSubmit: (userId: string, groupIds: string[]) => Promise<void>;
  loading?: boolean;
  error?: Error | null;
}

export function AssignGroupsDialog({
  open,
  onOpenChange,
  user,
  groupService,
  onSubmit,
  loading = false,
}: AssignGroupsDialogProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const { isCompact } = useDensity();
  const density = useDensityStyles();

  useEffect(() => {
    if (open && user) {
      loadGroups();
    } else {
      setSelectedGroups([]);
      setUserGroups([]);
      setFilterQuery("");
    }
  }, [open, user]);

  // Filter groups based on search query
  const filteredGroups = useMemo(() => {
    if (!filterQuery.trim()) {
      return availableGroups;
    }
    const query = filterQuery.toLowerCase();
    return availableGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
    );
  }, [availableGroups, filterQuery]);

  const loadGroups = async () => {
    if (!user) return;

    setLoadingGroups(true);
    try {
      // Fetch all available groups
      const allGroups = await groupService.fetchGroups(true);
      setAvailableGroups(allGroups);

      // Fetch user's current groups using the optimized endpoint
      const userGroupsList = await groupService.getUserGroups(user.id);
      setUserGroups(userGroupsList);
      setSelectedGroups(userGroupsList.map((g) => g.id));
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoadingGroups(false);
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
      // Get current group IDs
      const currentGroupIds = userGroups.map((g) => g.id);
      const newGroupIds = selectedGroups;

      // Find groups to add and remove
      const groupsToAdd = newGroupIds.filter(
        (id) => !currentGroupIds.includes(id)
      );
      const groupsToRemove = currentGroupIds.filter(
        (id) => !newGroupIds.includes(id)
      );

      // Remove user from groups
      for (const groupId of groupsToRemove) {
        try {
          await groupService.removeUserFromGroup(user.id, groupId);
        } catch (err) {
          const errorMessage = formatErrorMessage(
            err,
            `Failed to remove user from group. `
          );
          setShowConfirmDialog(false);
          toast({
            title: "Failed to Remove User from Group",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
      }

      // Add user to groups
      for (const groupId of groupsToAdd) {
        try {
          await groupService.addUserToGroup(user.id, groupId);
        } catch (err) {
          const errorMessage = formatErrorMessage(
            err,
            `Failed to add user to group. `
          );
          setShowConfirmDialog(false);
          toast({
            title: "Failed to Add User to Group",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
      }

      await onSubmit(user.id, selectedGroups);
      setShowConfirmDialog(false);
      toast({
        title: "Groups Updated",
        description: "User groups have been successfully updated",
      });
      onOpenChange(false);
    } catch (err) {
      const errorMessage = formatErrorMessage(err, "Failed to update groups. ");
      setShowConfirmDialog(false);
      toast({
        title: "Failed to Update Groups",
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

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleSelectAll = () => {
    const allGroupIds = availableGroups.map((g) => g.id);
    const allSelected =
      allGroupIds.length > 0 &&
      allGroupIds.every((id) => selectedGroups.includes(id));

    setSelectedGroups(allSelected ? [] : allGroupIds);
  };

  const allGroupsSelected =
    availableGroups.length > 0 &&
    availableGroups.every((group) => selectedGroups.includes(group.id));

  if (!user) {
    return null;
  }

  const handleClose = () => {
    onOpenChange(false);
  };

  // Calculate changes for confirmation dialog
  const currentGroupIds = userGroups.map((g) => g.id);
  const groupsToAdd = selectedGroups.filter(
    (id) => !currentGroupIds.includes(id)
  );
  const groupsToRemove = currentGroupIds.filter(
    (id) => !selectedGroups.includes(id)
  );
  const groupsToAddNames = groupsToAdd
    .map((id) => availableGroups.find((g) => g.id === id)?.name)
    .filter(Boolean) as string[];
  const groupsToRemoveNames = groupsToRemove
    .map((id) => userGroups.find((g) => g.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <FullScreenDialog
      open={open}
      onClose={handleClose}
      title={`Assign Groups to ${user.firstName || user.username || user.email}`}
      showCancelButton
      onCancel={handleClose}
      showSubmitButton
      onSubmit={() => {
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }}
      maxWidth="800px"
      loading={loading}
      onEscape={showConfirmDialog ? handleConfirmSubmit : handleClose}
      autoSubmitShortcut={true}
      autoClearShortcut={true}
      onClear={() => {
        if (formRef.current) {
          formRef.current.reset();
        }
      }}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        id="assign-groups-form"
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
            {/* Group Selection */}
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className={cn(density.textSizeLabel, "font-medium")}>
                  Assign Groups
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  disabled={loading || availableGroups.length === 0}
                  className={cn(
                    density.buttonHeightSmall,
                    density.paddingCell,
                    density.textSizeSmall,
                    "font-medium"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {allGroupsSelected ? (
                      <CheckSquare className={density.iconSizeSmall} />
                    ) : (
                      <Square className={density.iconSizeSmall} />
                    )}
                    <span>
                      {allGroupsSelected ? "Deselect All" : "Select All"}
                    </span>
                  </span>
                </Button>
              </div>
              <FormControl>
                {loadingGroups ? (
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
                          placeholder="Search groups..."
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
                      {availableGroups.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No groups available. Create a group first.
                        </div>
                      ) : filteredGroups.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          {filterQuery
                            ? "No groups match your search"
                            : "No groups available"}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                          {filteredGroups.map((group) => (
                            <label
                              key={group.id}
                              className="flex items-start gap-3 rounded-md border p-3 pl-4 hover:bg-muted/50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedGroups.includes(group.id)}
                                onChange={() => toggleGroup(group.id)}
                                disabled={loading || !group.isActive}
                                className="mt-0.5 h-4 w-4 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="text-sm font-medium truncate"
                                    title={group.name}
                                  >
                                    {group.name}
                                  </div>
                                  {!group.isActive && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                {group.description && (
                                  <div
                                    className="text-xs text-muted-foreground truncate mt-0.5"
                                    title={group.description}
                                  >
                                    {group.description}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {group.memberCount !== undefined && (
                                    <span>
                                      {group.memberCount} member
                                      {group.memberCount !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {group.memberCount !== undefined &&
                                    group.roleCount !== undefined &&
                                    " • "}
                                  {group.roleCount !== undefined && (
                                    <span>
                                      {group.roleCount} role
                                      {group.roleCount !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
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
                Select groups for this user. The user will inherit all roles
                from these groups.
              </FormDescription>
            </FormItem>

            {/* Selected Groups Summary */}
            {selectedGroups.length > 0 && (
              <div className="rounded-md bg-muted/50 border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">
                    {selectedGroups.length}{" "}
                    {selectedGroups.length === 1 ? "group" : "groups"} selected
                  </div>
                </div>
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(140px, 1fr))",
                  }}
                >
                  {selectedGroups.map((groupId) => {
                    const group = availableGroups.find((g) => g.id === groupId);
                    return group ? (
                      <span
                        key={groupId}
                        className="group flex items-center justify-between gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary border border-primary/20 min-w-0 hover:bg-primary/15 transition-colors"
                        title={group.name}
                      >
                        <span className="truncate flex-1 text-left">
                          {group.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(groupId);
                          }}
                          disabled={loading}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-4 w-4 rounded hover:bg-destructive/20 flex items-center justify-center"
                          aria-label={`Remove ${group.name}`}
                          title={`Remove ${group.name}`}
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
        title="Confirm Group Assignment"
        description={
          <>
            <p className="mb-3 text-xs">
              Are you sure you want to update the groups for{" "}
              <span className="font-semibold">
                {user.firstName || user.username || user.email}
              </span>
              ? The user will inherit all roles from the assigned groups.
            </p>
            {(groupsToAddNames.length > 0 ||
              groupsToRemoveNames.length > 0) && (
              <div className="space-y-1.5">
                {groupsToAddNames.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-muted-foreground">
                      Adding {groupsToAddNames.length} group
                      {groupsToAddNames.length !== 1 ? "s" : ""}:
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {groupsToAddNames.map((name) => (
                        <div key={name} className="text-foreground pl-2">
                          • {name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {groupsToRemoveNames.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-muted-foreground">
                      Removing {groupsToRemoveNames.length} group
                      {groupsToRemoveNames.length !== 1 ? "s" : ""}:
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {groupsToRemoveNames.map((name) => (
                        <div key={name} className="text-foreground pl-2">
                          • {name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {groupsToAddNames.length === 0 &&
              groupsToRemoveNames.length === 0 && (
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
          disabled: loading || loadingGroups,
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
