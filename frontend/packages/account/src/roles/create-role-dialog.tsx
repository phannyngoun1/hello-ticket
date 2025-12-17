/**
 * Create Role Dialog Component
 *
 * Full-screen dialog for creating new custom roles with permissions
 *
 * @author Phanny
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@truths/ui";
import { Input } from "@truths/ui";
import { Textarea } from "@truths/ui";
import {
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { FullScreenDialog } from "@truths/custom-ui";
import { useDensityStyles } from "@truths/utils";
import { AccountComponentMetadata } from "../registry";

export interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    permissions: string[];
  }) => Promise<void>;
  loading?: boolean;
  error?: Error | null;
  availablePermissions?: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
}

interface FormData {
  name: string;
  description: string;
  selectedPermissions: string[];
}

const initialFormData: FormData = {
  name: "",
  description: "",
  selectedPermissions: [],
};

// Common permission categories for better UX
const COMMON_PERMISSIONS = [
  // User management
  {
    value: "users:read",
    label: "Read Users",
    description: "View user information",
  },
  {
    value: "users:create",
    label: "Create Users",
    description: "Create new users",
  },
  {
    value: "users:update",
    label: "Update Users",
    description: "Modify user information",
  },
  { value: "users:delete", label: "Delete Users", description: "Remove users" },
  // Role management
  {
    value: "roles:read",
    label: "Read Roles",
    description: "View role information",
  },
  {
    value: "roles:create",
    label: "Create Roles",
    description: "Create new roles",
  },
  { value: "roles:update", label: "Update Roles", description: "Modify roles" },
  { value: "roles:delete", label: "Delete Roles", description: "Remove roles" },
  {
    value: "roles:assign",
    label: "Assign Roles",
    description: "Assign roles to users",
  },
  // Group management
  {
    value: "groups:read",
    label: "Read Groups",
    description: "View group information",
  },
  {
    value: "groups:create",
    label: "Create Groups",
    description: "Create new groups",
  },
  {
    value: "groups:update",
    label: "Update Groups",
    description: "Modify groups",
  },
  {
    value: "groups:delete",
    label: "Delete Groups",
    description: "Remove groups",
  },
  // Products
  {
    value: "products:read",
    label: "Read Products",
    description: "View products",
  },
  {
    value: "products:create",
    label: "Create Products",
    description: "Create products",
  },
  {
    value: "products:update",
    label: "Update Products",
    description: "Modify products",
  },
  {
    value: "products:delete",
    label: "Delete Products",
    description: "Remove products",
  },
  // Orders
  { value: "orders:read", label: "Read Orders", description: "View orders" },
  {
    value: "orders:create",
    label: "Create Orders",
    description: "Create orders",
  },
  {
    value: "orders:update",
    label: "Update Orders",
    description: "Modify orders",
  },
  {
    value: "orders:delete",
    label: "Delete Orders",
    description: "Remove orders",
  },
];

export function CreateRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  error = null,
  availablePermissions = COMMON_PERMISSIONS,
}: CreateRoleDialogProps) {
  const density = useDensityStyles();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof FormData, string>>
  >({});
  const [formKey, setFormKey] = useState(0);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [sortOption, setSortOption] = useState<
    "name" | "resource" | "selected"
  >("resource");
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  // Sync error from props
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = "Role name is required";
    } else if (formData.name.length > 100) {
      errors.name = "Role name cannot exceed 100 characters";
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
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        permissions: formData.selectedPermissions,
      });
      setFormData(initialFormData);
      setValidationErrors({});
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
    setLocalError(null);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFormData({ ...initialFormData });
    setValidationErrors({});
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
  // (Escape is handled by FullScreenDialog)
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

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permission)
        ? prev.selectedPermissions.filter((p) => p !== permission)
        : [...prev.selectedPermissions, permission],
    }));

    // Clear error when user interacts
    if (localError) {
      setLocalError(null);
    }
  };

  // Filter and sort permissions
  const filteredAndSortedPermissions = useMemo(() => {
    let filtered = availablePermissions;

    // Apply filter
    if (filterQuery.trim()) {
      const query = filterQuery.toLowerCase();
      filtered = availablePermissions.filter(
        (perm) =>
          perm.label.toLowerCase().includes(query) ||
          perm.description?.toLowerCase().includes(query) ||
          perm.value.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === "name") {
        return a.label.localeCompare(b.label);
      } else if (sortOption === "resource") {
        const aResource = a.value.split(":")[0] || "other";
        const bResource = b.value.split(":")[0] || "other";
        if (aResource !== bResource) {
          return aResource.localeCompare(bResource);
        }
        return a.label.localeCompare(b.label);
      } else if (sortOption === "selected") {
        const aSelected = formData.selectedPermissions.includes(a.value);
        const bSelected = formData.selectedPermissions.includes(b.value);
        if (aSelected !== bSelected) {
          return aSelected ? -1 : 1; // Selected first
        }
        return a.label.localeCompare(b.label);
      }
      return 0;
    });

    return sorted;
  }, [
    availablePermissions,
    filterQuery,
    sortOption,
    formData.selectedPermissions,
  ]);

  // Group permissions by resource for better organization
  const groupedPermissions = useMemo(() => {
    return filteredAndSortedPermissions.reduce(
      (acc, perm) => {
        const resource = perm.value.split(":")[0] || "other";
        if (!acc[resource]) {
          acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
      },
      {} as Record<string, typeof availablePermissions>
    );
  }, [filteredAndSortedPermissions]);

  const toggleSelectAll = () => {
    const allPermissionValues = availablePermissions.map((p) => p.value);
    const allSelected =
      allPermissionValues.length > 0 &&
      allPermissionValues.every((perm) =>
        formData.selectedPermissions.includes(perm)
      );

    setFormData((prev) => ({
      ...prev,
      selectedPermissions: allSelected ? [] : allPermissionValues,
    }));

    // Clear error when user interacts
    if (localError) {
      setLocalError(null);
    }
  };

  const toggleSelectAllForResource = (resource: string) => {
    const resourcePermissions = groupedPermissions[resource] || [];
    const resourcePermissionValues = resourcePermissions.map((p) => p.value);
    const allSelected =
      resourcePermissionValues.length > 0 &&
      resourcePermissionValues.every((perm) =>
        formData.selectedPermissions.includes(perm)
      );

    setFormData((prev) => ({
      ...prev,
      selectedPermissions: allSelected
        ? prev.selectedPermissions.filter(
            (p) => !resourcePermissionValues.includes(p)
          )
        : [
            ...prev.selectedPermissions.filter(
              (p) => !resourcePermissionValues.includes(p)
            ),
            ...resourcePermissionValues,
          ],
    }));

    // Clear error when user interacts
    if (localError) {
      setLocalError(null);
    }
  };

  // Check if all permissions are selected
  const allPermissionsSelected =
    availablePermissions.length > 0 &&
    availablePermissions.every((perm) =>
      formData.selectedPermissions.includes(perm.value)
    );

  // Helper to check if all permissions for a resource are selected
  const areAllResourcePermissionsSelected = (resource: string): boolean => {
    const resourcePermissions = groupedPermissions[resource] || [];
    return (
      resourcePermissions.length > 0 &&
      resourcePermissions.every((perm) =>
        formData.selectedPermissions.includes(perm.value)
      )
    );
  };

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title="Create Custom Role"
        maxWidth="800px"
        loading={loading}
        showClearButton
        onClear={handleClear}
        formSelector={formRef}
        onSubmit={() => {
          if (formRef.current) {
            formRef.current.requestSubmit();
          }
        }}
        autoSubmitShortcut={true}
        autoClearShortcut={true}
      >
        <form
          ref={formRef}
          key={formKey}
          onSubmit={handleSubmit}
          className={cn(density.spacingFormSection, "w-full")}
        >
          {/* Form Content */}
          <div
            className={cn(
              "bg-background border border-border rounded-lg shadow-sm mt-12",
              density.paddingForm
            )}
          >
            <div className={density.spacingFormSection}>
              {/* Error Message */}
              {localError && (
                <div
                  className={cn(
                    "rounded-md bg-destructive/10 border border-destructive/20",
                    density.paddingContainer,
                    density.textSizeSmall,
                    "text-destructive"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-destructive"></div>
                    <span className="font-semibold">ERROR:</span>
                    <span>{localError.message || "Failed to create role"}</span>
                  </div>
                </div>
              )}

              {/* Role Name */}
              <FormItem className={density.spacingFormItem}>
                <FormLabel className={cn(density.textSizeLabel, "font-medium")}>
                  Role Name *
                </FormLabel>
                <FormControl>
                  <Input
                    ref={firstInputRef}
                    placeholder="e.g., Sales Representative"
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
                  <FormMessage className={density.textSizeSmall}>
                    {validationErrors.name}
                  </FormMessage>
                )}
                <FormDescription className={density.textSizeSmall}>
                  A unique name for this role (max 100 characters)
                </FormDescription>
              </FormItem>

              {/* Description */}
              <FormItem className={density.spacingFormItem}>
                <FormLabel className={cn(density.textSizeLabel, "font-medium")}>
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the role's purpose and responsibilities..."
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
                  <FormMessage className={density.textSizeSmall}>
                    {validationErrors.description}
                  </FormMessage>
                )}
                <FormDescription className={density.textSizeSmall}>
                  Optional description (max 500 characters)
                </FormDescription>
              </FormItem>

              {/* Permissions */}
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel
                    className={cn(density.textSizeLabel, "font-medium")}
                  >
                    Permissions
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    disabled={loading}
                    className={cn(
                      density.buttonHeightSmall,
                      "px-2",
                      density.textSizeSmall,
                      "font-medium"
                    )}
                  >
                    {allPermissionsSelected ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <FormControl>
                  {/* Filter and Sort Controls */}
                  <div className={cn("flex mb-3", density.gapButtonGroup)}>
                    <div className="relative flex-1">
                      <Search
                        className={cn(
                          "absolute left-2.5 top-1/2 transform -translate-y-1/2",
                          density.iconSize,
                          "text-muted-foreground"
                        )}
                      />
                      <Input
                        type="text"
                        placeholder="Search permissions..."
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
                    <Select
                      value={sortOption}
                      onValueChange={(
                        value: "name" | "resource" | "selected"
                      ) => setSortOption(value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-sm">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resource">
                          Sort by Resource
                        </SelectItem>
                        <SelectItem value="name">Sort by Name</SelectItem>
                        <SelectItem value="selected">Selected First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4 rounded-md border p-4 max-h-[500px] overflow-y-auto">
                    {Object.keys(groupedPermissions).length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        {filterQuery
                          ? "No permissions match your search"
                          : "No permissions available"}
                      </div>
                    ) : (
                      Object.entries(groupedPermissions).map(
                        ([resource, perms]) => {
                          const allResourceSelected =
                            areAllResourcePermissionsSelected(resource);
                          return (
                            <div key={resource} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold capitalize">
                                  {resource}
                                </h4>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleSelectAllForResource(resource)
                                  }
                                  disabled={loading}
                                  className="h-6 px-2 text-xs font-medium"
                                >
                                  {allResourceSelected
                                    ? "Deselect All"
                                    : "Select All"}
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                {perms.map((perm) => (
                                  <label
                                    key={perm.value}
                                    className="flex items-start gap-4 rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.selectedPermissions.includes(
                                        perm.value
                                      )}
                                      onChange={() =>
                                        togglePermission(perm.value)
                                      }
                                      disabled={loading}
                                      className="mt-0.5 h-4 w-4 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium">
                                        {perm.label}
                                      </div>
                                      {perm.description && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                          {perm.description}
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
                </FormControl>
                <FormDescription>
                  Select the permissions this role should have. Users with this
                  role will be able to perform all selected actions.
                </FormDescription>
              </FormItem>

              {/* Selected Permissions Summary */}
              {formData.selectedPermissions.length > 0 && (
                <div className="rounded-md bg-muted/50 border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">
                      {formData.selectedPermissions.length}{" "}
                      {formData.selectedPermissions.length === 1
                        ? "permission"
                        : "permissions"}{" "}
                      selected
                    </div>
                  </div>
                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                    }}
                  >
                    {formData.selectedPermissions.map((perm) => {
                      const permInfo = availablePermissions.find(
                        (p) => p.value === perm
                      );
                      return (
                        <span
                          key={perm}
                          className="group flex items-center justify-between gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary border border-primary/20 min-w-0 hover:bg-primary/15 transition-colors"
                          title={permInfo?.label || perm}
                        >
                          <span className="truncate flex-1 text-left">
                            {permInfo?.label || perm}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePermission(perm);
                            }}
                            disabled={loading}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-4 w-4 rounded hover:bg-destructive/20 flex items-center justify-center"
                            aria-label={`Remove ${permInfo?.label || perm}`}
                            title={`Remove ${permInfo?.label || perm}`}
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </FullScreenDialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create the role "{formData.name.trim()}"?
              This will create a new role with{" "}
              {formData.selectedPermissions.length} permission
              {formData.selectedPermissions.length !== 1 ? "s" : ""} that can be
              assigned to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={handleSubmitConfirm} disabled={loading}>
                {loading ? "Creating..." : "Create Role"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function createRoleDialogMetadata(): AccountComponentMetadata {
  return {
    name: "Create Role Dialog",
    description:
      "Full-screen dialog for creating new custom roles with permissions",
    category: "roles",
    tags: ["roles", "create", "permissions", "dialog", "fullscreen"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
