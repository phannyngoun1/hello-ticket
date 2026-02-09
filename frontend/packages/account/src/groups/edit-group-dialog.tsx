/**
 * Edit Group Dialog Component
 *
 * Full-screen dialog for editing existing groups with role assignment
 *
 * @author Phanny
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Button, Badge } from "@truths/ui";
import { Input } from "@truths/ui";
import { Textarea } from "@truths/ui";
import { Switch } from "@truths/ui";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import {
  FullScreenDialog,
  KeyboardShortcut,
  ConfirmationDialog,
} from "@truths/custom-ui";
import { useDensityStyles } from "@truths/utils";
import { AccountComponentMetadata } from "../registry";
import { Group, UpdateGroupInput, Role } from "../types";
import { RoleService } from "../roles/role-service";
import { GroupService } from "./group-service";

export interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onSubmit: (
    groupId: string,
    data: UpdateGroupInput,
    roleIds: string[]
  ) => Promise<void>;
  roleService?: RoleService;
  groupService?: GroupService;
  loading?: boolean;
  error?: Error | null;
}

interface FormData {
  name: string;
  description: string;
  isActive: boolean;
}

export function EditGroupDialog({
  open,
  onOpenChange,
  group,
  onSubmit,
  roleService,
  groupService,
  loading = false,
  error = null,
}: EditGroupDialogProps) {
  const density = useDensityStyles();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    isActive: true,
  });
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [currentGroupRoles, setCurrentGroupRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortOption, setSortOption] = useState<"name" | "system" | "selected">(
    "name"
  );
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Sync error from props
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  // Load role data when dialog opens or role changes
  useEffect(() => {
    if (group && open) {
      setFormData({
        name: group.name || "",
        description: group.description || "",
        isActive: group.isActive,
      });
      setValidationErrors({});
      setFormKey((prev) => prev + 1);
      if (roleService && groupService) {
        loadRoles();
      }
    } else if (!open) {
      setSelectedRoleIds([]);
      setAvailableRoles([]);
      setCurrentGroupRoles([]);
      setFilterQuery("");
    }
  }, [group, open, roleService, groupService]);

  const loadRoles = async () => {
    if (!roleService || !groupService || !group) return;

    setLoadingRoles(true);
    try {
      // Fetch all available roles
      const allRoles = await roleService.fetchRoles(true);
      setAvailableRoles(allRoles);

      // Fetch current group roles
      const groupRoles = await groupService.getGroupRoles(group.id);
      setCurrentGroupRoles(groupRoles);
      setSelectedRoleIds(groupRoles.map((r) => r.id));
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );

    // Clear error when user interacts
    if (localError) {
      setLocalError(null);
    }
  };

  // Filter and sort roles
  const filteredAndSortedRoles = useMemo(() => {
    let filtered = availableRoles;

    // Apply filter
    if (filterQuery.trim()) {
      const query = filterQuery.toLowerCase();
      filtered = availableRoles.filter(
        (role) =>
          role.name.toLowerCase().includes(query) ||
          role.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortOption === "system") {
        if (a.isSystem !== b.isSystem) {
          return a.isSystem ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      } else if (sortOption === "selected") {
        const aSelected = selectedRoleIds.includes(a.id);
        const bSelected = selectedRoleIds.includes(b.id);
        if (aSelected !== bSelected) {
          return aSelected ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return sorted;
  }, [availableRoles, filterQuery, sortOption, selectedRoleIds]);

  // Group roles by system/non-system
  const groupedRoles = useMemo(() => {
    return filteredAndSortedRoles.reduce(
      (acc, role) => {
        const category = role.isSystem ? "system" : "custom";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(role);
        return acc;
      },
      {} as Record<string, Role[]>
    );
  }, [filteredAndSortedRoles]);

  const toggleSelectAll = () => {
    const allRoleIds = availableRoles.map((r) => r.id);
    const allSelected =
      allRoleIds.length > 0 &&
      allRoleIds.every((id) => selectedRoleIds.includes(id));

    setSelectedRoleIds(allSelected ? [] : allRoleIds);

    // Clear error when user interacts
    if (localError) {
      setLocalError(null);
    }
  };

  const toggleSelectAllForCategory = (category: string) => {
    const categoryRoles = groupedRoles[category] || [];
    const categoryRoleIds = categoryRoles.map((r) => r.id);
    const allSelected =
      categoryRoleIds.length > 0 &&
      categoryRoleIds.every((id) => selectedRoleIds.includes(id));

    setSelectedRoleIds((prev) =>
      allSelected
        ? prev.filter((id) => !categoryRoleIds.includes(id))
        : [
            ...prev.filter((id) => !categoryRoleIds.includes(id)),
            ...categoryRoleIds,
          ]
    );

    // Clear error when user interacts
    if (localError) {
      setLocalError(null);
    }
  };

  // Check if all roles are selected
  const allRolesSelected =
    availableRoles.length > 0 &&
    availableRoles.every((role) => selectedRoleIds.includes(role.id));

  // Helper to check if all roles for a category are selected
  const areAllCategoryRolesSelected = (category: string): boolean => {
    const categoryRoles = groupedRoles[category] || [];
    return (
      categoryRoles.length > 0 &&
      categoryRoles.every((role) => selectedRoleIds.includes(role.id))
    );
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = "Group name is required";
    } else if (formData.name.length > 100) {
      errors.name = "Group name cannot exceed 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = "Description cannot exceed 500 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !group) return;
    setSaveConfirmOpen(true);
  };

  const handleSubmitConfirm = async () => {
    if (!group) return;
    setSaveConfirmOpen(false);
    try {
      await onSubmit(
        group.id,
        {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
        },
        selectedRoleIds
      );
      setValidationErrors({});
      setLocalError(null);
      setFormKey((prev) => prev + 1);
      onOpenChange(false);
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    handleSubmitClick(e);
  };

  const handleClose = () => {
    if (group) {
      setFormData({
        name: group.name || "",
        description: group.description || "",
        isActive: group.isActive,
      });
      // Reset to current group roles
      setSelectedRoleIds(currentGroupRoles.map((r) => r.id));
    }
    setValidationErrors({});
    setLocalError(null);
    onOpenChange(false);
  };

  const handleClear = () => {
    if (group) {
      setFormData({
        name: group.name || "",
        description: group.description || "",
        isActive: group.isActive,
      });
      // Reset to current group roles
      setSelectedRoleIds(currentGroupRoles.map((r) => r.id));
    }
    setValidationErrors({});
    setLocalError(null);
    setFilterQuery("");
    setFormKey((prev) => prev + 1);
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear error message when user starts typing
    if (localError) {
      setLocalError(null);
    }
  };

  // Focus the first field when dialog opens
  useEffect(() => {
    if (open && group) {
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
      });
    }
  }, [open, group, formKey]);

  // Keyboard shortcuts: Cmd/Ctrl + Enter to submit, Shift + Cmd/Ctrl + Delete/Backspace to clear
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter submits
      if (
        (e.key === "Enter" || e.code === "Enter") &&
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey
      ) {
        e.preventDefault();
        if (!loading && validate() && group) {
          handleSubmitClick(e as any);
        }
      }
      // Shift + Cmd/Ctrl + Delete/Backspace clears form
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey
      ) {
        e.preventDefault();
        if (!loading && group) {
          handleClear();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, formData, group]);

  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      label: "Submit",
      keys: ["Enter"],
      metaOrCtrl: true,
    },
    {
      label: "Clear",
      keys: ["Delete"],
      metaOrCtrl: true,
      shift: true,
    },
  ];

  if (!group) {
    return null;
  }

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title="Edit Group"
        maxWidth="800px"
        loading={loading}
        showClearButton
        onClear={handleClear}
        shortcuts={keyboardShortcuts}
        autoSubmitShortcut={false}
        autoClearShortcut={false}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className={cn(
                density.buttonHeightSmall,
                "px-3",
                density.textSizeSmall,
                "font-medium border-border hover:bg-muted"
              )}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                density.buttonHeightSmall,
                "px-3",
                density.textSizeSmall,
                "font-medium"
              )}
              onClick={handleSubmitClick}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        <Form
          key={formKey}
          onSubmit={handleSubmit}
          className={cn(density.spacingFormSection, "w-full")}
        >
          {/* Form Content */}
          <div className={cn("bg-background border border-border rounded-lg shadow-sm mt-12", density.paddingForm)}>
            <div className={density.spacingFormSection}>
              {/* Error Message */}
              {localError && (
                <div className={cn("rounded-md bg-destructive/10 border border-destructive/20", density.paddingContainer, density.textSizeSmall, "text-destructive")}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive"></div>
                    <span className="font-semibold">ERROR:</span>
                    <span>
                      {localError.message || "Failed to update group"}
                    </span>
                  </div>
                </div>
              )}

              {/* Group Name */}
              <FormItem className={density.spacingFormItem}>
                <FormLabel className={cn(density.textSizeLabel, "font-medium")}>
                  Group Name *
                </FormLabel>
                <FormControl>
                  <Input
                    ref={firstInputRef}
                    placeholder="e.g., Sales Team"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={cn(
                      density.inputHeight,
                      density.textSize,
                      validationErrors.name && "border-destructive"
                    )}
                    disabled={loading}
                  />
                </FormControl>
                {validationErrors.name && (
                  <FormMessage className={density.textSizeSmall}>{validationErrors.name}</FormMessage>
                )}
                <FormDescription className={density.textSizeSmall}>
                  A unique name for this group (max 100 characters)
                </FormDescription>
              </FormItem>

              {/* Description */}
              <FormItem className={density.spacingFormItem}>
                <FormLabel className={cn(density.textSizeLabel, "font-medium")}>
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the group's purpose..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    disabled={loading}
                    rows={3}
                    className={cn(
                      density.textSize,
                      validationErrors.description && "border-destructive"
                    )}
                  />
                </FormControl>
                {validationErrors.description && (
                  <FormMessage className={density.textSizeSmall}>{validationErrors.description}</FormMessage>
                )}
                <FormDescription className={density.textSizeSmall}>
                  Optional description (max 500 characters)
                </FormDescription>
              </FormItem>

              {/* Active Status */}
              <FormItem className={cn("flex items-center justify-between rounded-lg border", density.paddingContainer)}>
                <div className={density.spacingFormItem}>
                  <FormLabel className={cn(density.textSizeLabel, "font-medium")}>Active</FormLabel>
                  <FormDescription className={density.textSizeSmall}>
                    Inactive groups won't grant roles to their members
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleInputChange("isActive", checked)
                    }
                    disabled={loading}
                  />
                </FormControl>
              </FormItem>

              {/* Role Selection */}
              {roleService && groupService && (
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
                        "px-2",
                        density.textSizeSmall,
                        "font-medium"
                      )}
                    >
                      {allRolesSelected ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <FormControl>
                    {loadingRoles ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        {/* Filter and Sort Controls */}
                        <div className="flex gap-2 mb-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="Search roles..."
                              value={filterQuery}
                              onChange={(e) => setFilterQuery(e.target.value)}
                              disabled={loading}
                              className="pl-8 h-8 text-sm"
                            />
                          </div>
                          <Select
                            value={sortOption}
                            onValueChange={(
                              value: "name" | "system" | "selected"
                            ) => setSortOption(value)}
                            disabled={loading}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-sm">
                              <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">Sort by Name</SelectItem>
                              <SelectItem value="system">
                                System First
                              </SelectItem>
                              <SelectItem value="selected">
                                Selected First
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-4 rounded-md border p-4 max-h-[500px] overflow-y-auto">
                          {Object.keys(groupedRoles).length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                              {filterQuery
                                ? "No roles match your search"
                                : "No roles available"}
                            </div>
                          ) : (
                            Object.entries(groupedRoles).map(
                              ([category, roles]) => {
                                const allCategorySelected =
                                  areAllCategoryRolesSelected(category);
                                return (
                                  <div key={category} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-semibold capitalize">
                                        {category === "system"
                                          ? "System Roles"
                                          : "Custom Roles"}
                                      </h4>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          toggleSelectAllForCategory(category)
                                        }
                                        disabled={loading}
                                        className="h-6 px-2 text-xs font-medium"
                                      >
                                        {allCategorySelected
                                          ? "Deselect All"
                                          : "Select All"}
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                      {roles.map((role) => (
                                        <label
                                          key={role.id}
                                          className="flex items-start gap-4 rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selectedRoleIds.includes(
                                              role.id
                                            )}
                                            onChange={() => toggleRole(role.id)}
                                            disabled={loading}
                                            className="mt-0.5 h-4 w-4 shrink-0"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <div className="text-sm font-medium">
                                                {role.name}
                                              </div>
                                              {role.isSystem && (
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs"
                                                >
                                                  System
                                                </Badge>
                                              )}
                                            </div>
                                            {role.description && (
                                              <div className="text-xs text-muted-foreground mt-0.5">
                                                {role.description}
                                              </div>
                                            )}
                                            {role.permissions &&
                                              role.permissions.length > 0 && (
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                  {role.permissions.length}{" "}
                                                  permission
                                                  {role.permissions.length !== 1
                                                    ? "s"
                                                    : ""}
                                                </div>
                                              )}
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                            )
                          )}
                        </div>
                      </>
                    )}
                  </FormControl>
                  <FormDescription>
                    Select roles to assign to this group. Users in this group
                    will inherit all selected roles.
                  </FormDescription>
                </FormItem>
              )}

              {/* Selected Roles Summary */}
              {selectedRoleIds.length > 0 && (
                <div className="rounded-md bg-muted/50 border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">
                      {selectedRoleIds.length}{" "}
                      {selectedRoleIds.length === 1 ? "role" : "roles"} selected
                    </div>
                  </div>
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                    }}
                  >
                    {selectedRoleIds.map((roleId) => {
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
        </Form>
      </FullScreenDialog>

      {/* Save Confirmation Dialog */}
      {group && (
        <ConfirmationDialog
          open={saveConfirmOpen}
          onOpenChange={setSaveConfirmOpen}
          title="Save Changes"
          description={(() => {
            const currentRoleIds = currentGroupRoles.map((r) => r.id);
            const addedRoles = selectedRoleIds.filter(
              (id) => !currentRoleIds.includes(id)
            );
            const removedRoles = currentRoleIds.filter(
              (id) => !selectedRoleIds.includes(id)
            );

            if (addedRoles.length === 0 && removedRoles.length === 0) {
              return `Are you sure you want to save changes to the group "${group.name}"? This will update the group information and affect all members of this group.`;
            }

            const changes = [];
            if (addedRoles.length > 0) {
              changes.push(`add ${addedRoles.length} role(s)`);
            }
            if (removedRoles.length > 0) {
              changes.push(`remove ${removedRoles.length} role(s)`);
            }

            return `Are you sure you want to save changes to the group "${group.name}"? This will update the group information and ${changes.join(" and ")}. This will affect all members of this group.`;
          })()}
          confirmAction={{
            label: "Save Changes",
            onClick: handleSubmitConfirm,
            loading: loading,
          }}
        />
      )}
    </>
  );
}

export function editGroupDialogMetadata(): AccountComponentMetadata {
  return {
    name: "Edit Group Dialog",
    description: "Dialog for editing existing groups",
    category: "groups",
    tags: ["groups", "edit", "dialog"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
