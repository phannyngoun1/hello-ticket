/**
 * Create Group Dialog Component
 *
 * Full-screen dialog for creating new groups with role assignment
 *
 * @author Phanny
 */

// @refresh reset

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Button, Badge } from "@truths/ui";
import { Input } from "@truths/ui";
import { Textarea } from "@truths/ui";
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
import { CreateGroupInput, Role } from "../types";
import { RoleService } from "../roles/role-service";

export interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateGroupInput, roleIds: string[]) => Promise<void>;
  roleService?: RoleService;
  loading?: boolean;
  error?: Error | null;
}

interface FormData {
  name: string;
  description: string;
}

const initialFormData: FormData = {
  name: "",
  description: "",
};

export function CreateGroupDialog({
  open,
  onOpenChange,
  onSubmit,
  roleService,
  loading = false,
  error = null,
}: CreateGroupDialogProps) {
  const density = useDensityStyles();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
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

  useEffect(() => {
    if (open && roleService) {
      loadRoles();
    } else if (!open) {
      setSelectedRoleIds([]);
      setAvailableRoles([]);
      setFilterQuery("");
    }
  }, [open, roleService]);

  const loadRoles = async () => {
    if (!roleService) return;

    setLoadingRoles(true);
    try {
      const roles = await roleService.fetchRoles(true);
      setAvailableRoles(roles);
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
    if (!validate()) return;
    setSaveConfirmOpen(true);
  };

  const handleSubmitConfirm = async () => {
    setSaveConfirmOpen(false);
    try {
      await onSubmit(
        {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        },
        selectedRoleIds
      );
      setFormData(initialFormData);
      setValidationErrors({});
      setSelectedRoleIds([]);
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
    setFormData(initialFormData);
    setValidationErrors({});
    setSelectedRoleIds([]);
    setLocalError(null);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFormData({ ...initialFormData });
    setValidationErrors({});
    setSelectedRoleIds([]);
    setLocalError(null);
    setFormKey((prev) => prev + 1);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
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
    if (open) {
      requestAnimationFrame(() => {
        firstInputRef.current?.focus();
      });
    }
  }, [open, formKey]);

  // Keyboard shortcuts: Cmd/Ctrl + Enter to submit, Shift + Cmd/Ctrl + Delete/Backspace to clear
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter submits
      if (
        (e.key === "Enter" || e.code === "Enter") &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();
        if (!loading && validate()) {
          handleSubmitClick(e as any);
        }
      }

      // Shift + Cmd/Ctrl + Delete/Backspace clears form
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const isDel = e.key === "Delete" || e.code === "Delete";
        const isBackspace = e.key === "Backspace" || e.code === "Backspace";
        if (isDel || isBackspace) {
          e.preventDefault();
          if (!loading) {
            handleClear();
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, formData]);

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

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title="Create Group"
        maxWidth="800px"
        loading={loading}
        showClearButton
        onClear={handleClear}
        shortcuts={keyboardShortcuts}
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
              {loading ? "Creating..." : "Create Group"}
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
                      {localError.message || "Failed to create group"}
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

              {/* Role Selection */}
              {roleService && (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">
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
                        <div className={cn(density.iconSize, "animate-spin rounded-full border-2 border-primary border-t-transparent")} />
                      </div>
                    ) : (
                      <>
                        {/* Filter and Sort Controls */}
                        <div className={cn("flex mb-3", density.gapButtonGroup)}>
                          <div className="relative flex-1">
                            <Search className={cn("absolute left-2.5 top-1/2 transform -translate-y-1/2", density.iconSize, "text-muted-foreground")} />
                            <Input
                              type="text"
                              placeholder="Search roles..."
                              value={filterQuery}
                              onChange={(e) => setFilterQuery(e.target.value)}
                              disabled={loading}
                              className={cn("pl-8", density.inputHeight, density.textSize)}
                            />
                          </div>
                          <Select
                            value={sortOption}
                            onValueChange={(
                              value: "name" | "system" | "selected"
                            ) => setSortOption(value)}
                            disabled={loading}
                          >
                            <SelectTrigger className={cn("w-[140px]", density.inputHeight, density.textSize)}>
                              <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent className={density.textSize}>
                              <SelectItem value="name" className={density.textSize}>Sort by Name</SelectItem>
                              <SelectItem value="system" className={density.textSize}>
                                System First
                              </SelectItem>
                              <SelectItem value="selected" className={density.textSize}>
                                Selected First
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className={cn(density.spacingFormSection, "rounded-md border", density.paddingContainer, "max-h-[500px] overflow-y-auto")}>
                          {Object.keys(groupedRoles).length === 0 ? (
                            <div className={cn("text-center py-8", density.textSize, "text-muted-foreground")}>
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
                                  <div key={category} className={density.spacingFormItem}>
                                    <div className="flex items-center justify-between">
                                      <h4 className={cn(density.textSize, "font-semibold capitalize")}>
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
                                        className={cn(
                                          density.buttonHeightSmall,
                                          "px-2",
                                          density.textSizeSmall,
                                          "font-medium"
                                        )}
                                      >
                                        {allCategorySelected
                                          ? "Deselect All"
                                          : "Select All"}
                                      </Button>
                                    </div>
                                    <div className={cn("grid grid-cols-1 md:grid-cols-2", density.gapButtonGroup)}>
                                      {roles.map((role) => (
                                        <label
                                          key={role.id}
                                          className={cn("flex items-start rounded-md border hover:bg-muted/50 cursor-pointer", density.gapForm, density.paddingContainer)}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selectedRoleIds.includes(
                                              role.id
                                            )}
                                            onChange={() => toggleRole(role.id)}
                                            disabled={loading}
                                            className={cn("mt-0.5 shrink-0", density.iconSize)}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className={cn("flex items-center", density.gapButtonGroup)}>
                                              <div className={cn(density.textSize, "font-medium")}>
                                                {role.name}
                                              </div>
                                              {role.isSystem && (
                                                <Badge
                                                  variant="secondary"
                                                  className={density.textSizeSmall}
                                                >
                                                  System
                                                </Badge>
                                              )}
                                            </div>
                                            {role.description && (
                                              <div className={cn(density.textSizeSmall, "text-muted-foreground mt-0.5")}>
                                                {role.description}
                                              </div>
                                            )}
                                            {role.permissions &&
                                              role.permissions.length > 0 && (
                                                <div className={cn(density.textSizeSmall, "text-muted-foreground mt-0.5")}>
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
                  <FormDescription className={density.textSizeSmall}>
                    Select roles to assign to this group. Users in this group
                    will inherit all selected roles.
                  </FormDescription>
                </FormItem>
              )}

              {/* Selected Roles Summary */}
              {selectedRoleIds.length > 0 && (
                <div className={cn("rounded-md bg-muted/50 border border-border", density.paddingContainer)}>
                  <div className={cn("flex items-center justify-between mb-3")}>
                    <div className={cn(density.textSize, "font-semibold")}>
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
                          className={cn("group flex items-center justify-between rounded-md bg-primary/10 font-medium text-primary border border-primary/20 min-w-0 hover:bg-primary/15 transition-colors", density.gapButtonGroup, "px-2.5 py-1.5", density.textSizeSmall)}
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
                            className={cn("opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded hover:bg-destructive/20 flex items-center justify-center", density.iconSize)}
                            aria-label={`Remove ${role.name}`}
                            title={`Remove ${role.name}`}
                          >
                            <X className={cn(density.iconSize, "text-destructive")} />
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
      <ConfirmationDialog
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title="Create Group"
        description={
          selectedRoleIds.length > 0
            ? `Are you sure you want to create the group "${formData.name.trim()}" with ${selectedRoleIds.length} role(s)? This will create a new group and assign the selected roles.`
            : `Are you sure you want to create the group "${formData.name.trim()}"? This will create a new group that you can use to organize users and assign roles.`
        }
        confirmAction={{
          label: "Create Group",
          onClick: handleSubmitConfirm,
          loading: loading,
        }}
      />
    </>
  );
}

export const createGroupDialogMetadata: AccountComponentMetadata = {
  name: "Create Group Dialog",
  description: "Dialog for creating new groups",
  category: "groups",
  tags: ["groups", "create", "dialog"],
  version: "1.0.0",
  dependencies: ["@truths/ui"],
};
