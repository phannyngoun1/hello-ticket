/**
 * Role List Component
 *
 * Display and manage roles with user counts and permissions.
 *
 * @author Phanny
 */

import React from "react";
import { Button } from "@truths/ui";
import { DataList, StatConfig, BadgeConfig } from "@truths/custom-ui";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AccountComponentMetadata } from "../registry";
import { Role } from "../types";

export interface RoleListProps {
  className?: string;
  roles?: Role[];
  loading?: boolean;
  error?: Error | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  showUserCount?: boolean;
  showPermissions?: boolean;
  showActions?: boolean;
  showCreateButton?: boolean;
  onCreate?: () => void;
  onRoleClick?: (role: Role) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onSearch?: (query: string) => void;
  customActions?: (role: Role) => React.ReactNode;
}

export function RoleList({
  className,
  roles = [],
  loading = false,
  error = null,
  searchable = true,
  searchPlaceholder = "Search roles...",
  showUserCount = true,
  showPermissions = true,
  showActions = true,
  showCreateButton = false,
  onCreate,
  onRoleClick,
  onEdit,
  onDelete,
  onSearch,
  customActions,
}: RoleListProps) {
  // Configure stats to display
  const stats: StatConfig<Role>[] = [];
  if (showUserCount) {
    stats.push({
      key: "users",
      label: "users",
      value: (role: Role) => role.userCount || 0,
    });
  }
  if (showPermissions) {
    stats.push({
      key: "permissions",
      label: "permissions",
      value: (role: Role) => role.permissions?.length || 0,
    });
  }

  // Configure badges
  const badges: BadgeConfig<Role>[] = [
    {
      key: "system",
      label: "System",
      condition: (role: Role) => !!role.isSystem,
      variant: "secondary",
    },
  ];

  // Custom actions renderer that hides Edit/Delete for system roles
  const actionsRenderer = (role: Role) => {
    if (customActions) {
      return customActions(role);
    }

    return (
      <>
        {onEdit && !role.isSystem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(role)}
            className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && !role.isSystem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(role)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </>
    );
  };

  return (
    <DataList
      className={className}
      items={roles}
      loading={loading}
      error={error}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      title="Roles"
      description="Manage roles and permissions"
      stats={stats}
      badges={badges}
      showActions={showActions}
      showCreateButton={showCreateButton}
      createButtonLabel={
        <>
          <Plus className="h-4 w-4 mr-2" />
          New
        </>
      }
      onCreate={onCreate}
      onItemClick={onRoleClick}
      onEdit={showActions ? onEdit : undefined}
      onDelete={showActions ? onDelete : undefined}
      onSearch={onSearch}
      customActions={showActions ? actionsRenderer : undefined}
      loadingMessage="Loading roles..."
      emptyMessage="No roles found"
      gridCols={{ default: 1, md: 2, lg: 3 }}
    />
  );
}

export function roleListMetadata(): AccountComponentMetadata {
  return {
    name: "Role List",
    description: "Display and manage roles with user counts and permissions",
    category: "roles",
    tags: ["roles", "permissions", "list", "management"],
    version: "1.0.0",
    dependencies: ["@truths/ui", "@truths/custom-ui"],
  };
}
