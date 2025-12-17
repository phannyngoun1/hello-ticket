/**
 * Group List Component
 *
 * Display and manage groups with member counts and roles
 *
 * @author Phanny
 */

import React from "react";
import { DataList, StatConfig, BadgeConfig } from "@truths/custom-ui";
import { Plus } from "lucide-react";
import { AccountComponentMetadata } from "../registry";
import { Group } from "../types";

export interface GroupListProps {
  className?: string;
  groups?: Group[];
  loading?: boolean;
  error?: Error | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  showMemberCount?: boolean;
  showRoleCount?: boolean;
  showActions?: boolean;
  showCreateButton?: boolean;
  onCreate?: () => void;
  onGroupClick?: (group: Group) => void;
  onEdit?: (group: Group) => void;
  onDelete?: (group: Group) => void;
  onSearch?: (query: string) => void;
  customActions?: (group: Group) => React.ReactNode;
}

export function GroupList({
  className,
  groups = [],
  loading = false,
  error = null,
  searchable = true,
  searchPlaceholder = "Search groups...",
  showMemberCount = true,
  showRoleCount = true,
  showActions = true,
  showCreateButton = false,
  onCreate,
  onGroupClick,
  onEdit,
  onDelete,
  onSearch,
  customActions,
}: GroupListProps) {
  // Configure stats to display
  const stats: StatConfig<Group>[] = [];
  if (showMemberCount) {
    stats.push({
      key: "members",
      label: "members",
      value: (group: Group) => group.memberCount || 0,
    });
  }
  if (showRoleCount) {
    stats.push({
      key: "roles",
      label: "roles",
      value: (group: Group) => group.roleCount || 0,
    });
  }

  // Configure badges
  const badges: BadgeConfig<Group>[] = [
    {
      key: "inactive",
      label: "Inactive",
      condition: (group: Group) => !group.isActive,
      variant: "secondary",
    },
  ];

  return (
    <DataList
      className={className}
      items={groups}
      loading={loading}
      error={error}
      searchable={searchable}
      searchPlaceholder={searchPlaceholder}
      title="Groups"
      description="Manage groups and assign roles"
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
      onItemClick={onGroupClick}
      onEdit={showActions ? onEdit : undefined}
      onDelete={showActions ? onDelete : undefined}
      onSearch={onSearch}
      customActions={showActions ? customActions : undefined}
      loadingMessage="Loading groups..."
      emptyMessage="No groups found"
      gridCols={{ default: 1, md: 2, lg: 3 }}
    />
  );
}

export function groupListMetadata(): AccountComponentMetadata {
  return {
    name: "Group List",
    description: "Display and manage groups with member counts and roles",
    category: "groups",
    tags: ["groups", "members", "list", "management"],
    version: "1.0.0",
    dependencies: ["@truths/ui", "@truths/custom-ui"],
  };
}
