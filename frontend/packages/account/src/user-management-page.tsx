/**
 * User Management Page Component
 *
 * Unified page combining Users, Roles, and Groups management with tabs
 */

import { useState, useMemo } from "react";
import { CustomTabs } from "@truths/custom-ui";
import { UserListContainer } from "./users/user-list/user-list-container";
import { RoleListContainer } from "./roles/role-list-container";
import { GroupListContainer } from "./groups/group-list-container";
import { RoleService } from "./roles/role-service";
import { GroupService } from "./groups/group-service";
import { Role, Group } from "./types";
import { api } from "@truths/api";
import { API_CONFIG } from "@truths/config";

export interface UserManagementPageProps {
  className?: string;
  defaultTab?: "users" | "roles" | "groups";
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
  onUserClick?: (userId: string) => void;
  onRoleClick?: (role: Role) => void;
  onGroupClick?: (group: Group) => void;
}

export function UserManagementPage({
  className,
  defaultTab = "users",
  onCreateDialogClose,
  onUserClick,
  onRoleClick,
  autoOpenCreate,
  onGroupClick,
}: UserManagementPageProps) {
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "groups">(
    defaultTab
  );

  // Initialize services
  const roleService = useMemo(
    () =>
      new RoleService({
        apiClient: api,
        endpoints: {
          roles: API_CONFIG.ENDPOINTS.ROLES,
        },
      }),
    []
  );

  const groupService = useMemo(
    () =>
      new GroupService({
        apiClient: api,
        endpoints: {
          groups: API_CONFIG.ENDPOINTS.GROUPS,
        },
      }),
    []
  );

  return (
    <div className={className}>
      <CustomTabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "users" | "roles" | "groups")
        }
        variant="default"
        items={[
          {
            value: "users",
            label: "Users",
            content: (
              <UserListContainer
                autoOpenCreate={autoOpenCreate}
                onCreateDialogClose={onCreateDialogClose}
                onNavigateToUser={onUserClick}
              />
            ),
          },
          {
            value: "roles",
            label: "Roles",
            content: (
              <RoleListContainer
                service={roleService}
                onRoleClick={onRoleClick}
                showCreateButton={true}
              />
            ),
          },
          {
            value: "groups",
            label: "Groups",
            content: (
              <GroupListContainer
                service={groupService}
                roleService={roleService}
                onGroupClick={onGroupClick}
                showCreateButton={true}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
