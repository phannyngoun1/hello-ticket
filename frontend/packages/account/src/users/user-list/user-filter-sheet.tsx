/**
 * User Filter Sheet Component
 *
 * Advanced filter sheet for UserList that allows filtering by multiple criteria.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import { UserFilter, User, Role } from "../../types";
import { RoleService } from "../../roles/role-service";
import { Search, Check } from "lucide-react";

export interface UserFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter?: UserFilter;
  onApply: (filter: UserFilter) => void;
  onReset?: () => void;
  roleService?: RoleService;
}

export function UserFilterSheet({
  open,
  onOpenChange,
  filter: initialFilter = {},
  onApply,
  onReset,
  roleService,
}: UserFilterSheetProps) {
  const [filter, setFilter] = useState<UserFilter>(initialFilter);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Update internal state when prop changes
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  // Load roles when sheet opens and roleService is provided
  useEffect(() => {
    if (open && roleService) {
      loadRoles();
    } else {
      setAvailableRoles([]);
      setRoleSearchQuery("");
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

  // Filter roles based on search query
  const filteredRoles = useMemo(() => {
    if (!roleSearchQuery.trim()) {
      return availableRoles;
    }
    const query = roleSearchQuery.toLowerCase();
    return availableRoles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
    );
  }, [availableRoles, roleSearchQuery]);

  // Get selected role object
  const selectedRole = useMemo(() => {
    if (!filter.role) return null;
    return availableRoles.find(
      (role) => role.name === filter.role || role.id === filter.role
    );
  }, [filter.role, availableRoles]);

  const handleApply = () => {
    onApply(filter);
    onOpenChange(false);
  };

  const handleReset = () => {
    const emptyFilter: UserFilter = {};
    setFilter(emptyFilter);
    setRoleSearchQuery("");
    if (onReset) {
      onReset();
    } else {
      onApply(emptyFilter);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFilter(initialFilter); // Reset to initial state
    setRoleSearchQuery("");
    onOpenChange(false);
  };

  const updateFilter = <K extends keyof UserFilter>(
    key: K,
    value: UserFilter[K] | undefined
  ) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  const handleRoleSelect = (roleName: string) => {
    updateFilter("role", roleName);
    setIsRoleDropdownOpen(false);
    setRoleSearchQuery("");
  };

  const handleRoleClear = () => {
    updateFilter("role", undefined);
    setRoleSearchQuery("");
  };

  const hasActiveFilters = Object.values(filter).some(
    (value) => value !== undefined && value !== ""
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[700px] sm:w-[800px] flex flex-col p-0 h-full"
      >
        <SheetHeader className="px-4 pt-4 pb-3 flex-shrink-0">
          <SheetTitle className="text-base">Advanced Filters</SheetTitle>
          <SheetDescription className="text-xs">
            Add multiple criteria to filter users. All filters are combined with
            AND logic.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 min-h-0">
          <div className="space-y-4 pb-4">
            {/* Search Filter */}

            {/* Role Filter */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs">
                Role
              </Label>
              {roleService ? (
                // Searchable role selector with dynamic loading
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="role"
                      type="text"
                      placeholder="Search roles..."
                      value={roleSearchQuery}
                      onChange={(e) => {
                        setRoleSearchQuery(e.target.value);
                        setIsRoleDropdownOpen(true);
                      }}
                      onFocus={() => setIsRoleDropdownOpen(true)}
                      className="pl-8 h-8 text-xs pr-8"
                    />
                    {selectedRole && (
                      <button
                        type="button"
                        onClick={handleRoleClear}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear selection"
                      >
                        <span className="text-xs">×</span>
                      </button>
                    )}
                  </div>

                  {isRoleDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsRoleDropdownOpen(false)}
                      />
                      <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-[300px] overflow-y-auto">
                        {loadingRoles ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          </div>
                        ) : filteredRoles.length === 0 ? (
                          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                            {roleSearchQuery
                              ? "No roles found"
                              : "No roles available"}
                          </div>
                        ) : (
                          <>
                            {!roleSearchQuery && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleRoleClear();
                                  setIsRoleDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs hover:bg-accent flex items-center gap-2 ${
                                  !filter.role ? "bg-accent" : ""
                                }`}
                              >
                                {!filter.role && <Check className="h-3 w-3" />}
                                <span
                                  className={!filter.role ? "font-medium" : ""}
                                >
                                  All roles
                                </span>
                              </button>
                            )}
                            {filteredRoles.map((role) => (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => handleRoleSelect(role.name)}
                                className={`w-full px-3 py-2 text-left text-xs hover:bg-accent flex items-start gap-2 ${
                                  filter.role === role.name ? "bg-accent" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {filter.role === role.name && (
                                    <Check className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div
                                      className={`truncate ${filter.role === role.name ? "font-medium" : ""}`}
                                    >
                                      {role.name}
                                      {role.isSystem && (
                                        <span className="ml-1 text-muted-foreground">
                                          (System)
                                        </span>
                                      )}
                                    </div>
                                    {role.description && (
                                      <div className="text-muted-foreground truncate mt-0.5">
                                        {role.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {selectedRole && !isRoleDropdownOpen && (
                    <div className="mt-1.5 px-2 py-1.5 bg-muted rounded text-xs">
                      <div className="font-medium">{selectedRole.name}</div>
                      {selectedRole.description && (
                        <div className="text-muted-foreground truncate mt-0.5">
                          {selectedRole.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Fallback to simple select if roleService not provided
                <Select
                  value={filter.role || "all"}
                  onValueChange={(value) => {
                    if (value === "all") {
                      updateFilter("role", undefined);
                    } else {
                      updateFilter("role", value);
                    }
                  }}
                >
                  <SelectTrigger id="role" className="h-8 text-xs">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs">
                Status
              </Label>
              <Select
                value={filter.status || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    updateFilter("status", undefined);
                  } else {
                    updateFilter("status", value as User["status"]);
                  }
                }}
              >
                <SelectTrigger id="status" className="h-8 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-3">
              <Label className="text-xs">Created Date Range</Label>

              <div className="space-y-1.5">
                <Label
                  htmlFor="createdAfter"
                  className="text-xs text-muted-foreground"
                >
                  Created After
                </Label>
                <Input
                  id="createdAfter"
                  type="date"
                  className="h-8 text-xs"
                  value={
                    filter.createdAfter
                      ? new Date(filter.createdAfter)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    updateFilter(
                      "createdAfter",
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="createdBefore"
                  className="text-xs text-muted-foreground"
                >
                  Created Before
                </Label>
                <Input
                  id="createdBefore"
                  type="date"
                  className="h-8 text-xs"
                  value={
                    filter.createdBefore
                      ? new Date(filter.createdBefore)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    updateFilter(
                      "createdBefore",
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="px-4 py-3 border-t bg-background flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex-1 h-8 text-xs"
            >
              Cancel
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1 h-8 text-xs"
              >
                Reset
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1 h-8 text-xs"
            >
              Apply
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
