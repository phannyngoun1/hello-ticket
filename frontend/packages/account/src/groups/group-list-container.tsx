/**
 * Group List Container Component
 *
 * Container component that manages group data fetching and state
 *
 * @author Phanny
 */

import { useState, useEffect } from "react";
import { GroupList } from "./group-list";
import { CreateGroupDialog } from "./create-group-dialog";
import { EditGroupDialog } from "./edit-group-dialog";
import { GroupService } from "./group-service";
import { RoleService } from "../roles/role-service";
import { Group, UpdateGroupInput, CreateGroupInput } from "../types";
import { ConfirmationDialog } from "@truths/custom-ui";

export interface GroupListContainerProps {
  service: GroupService;
  roleService?: RoleService;
  className?: string;
  onGroupClick?: (group: Group) => void;
  showCreateButton?: boolean;
}

export function GroupListContainer({
  service,
  roleService,
  className,
  onGroupClick,
  showCreateButton = true,
}: GroupListContainerProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.fetchGroups();
      setGroups(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async (data: CreateGroupInput, roleIds: string[]) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Create the group first
      const newGroup = await service.createGroup(data);

      // Assign roles if any are selected
      if (roleIds.length > 0) {
        for (const roleId of roleIds) {
          await service.addRoleToGroup(newGroup.id, roleId);
        }
      }

      await fetchGroups();
      setCreateDialogOpen(false);
    } catch (err) {
      setSubmitError(err as Error);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (group: Group) => {
    setEditGroup(group);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (
    groupId: string,
    data: UpdateGroupInput,
    roleIds: string[]
  ) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Update the group first
      await service.updateGroup(groupId, data);

      // Sync role assignments
      if (roleService) {
        // Get current group roles
        const currentRoles = await service.getGroupRoles(groupId);
        const currentRoleIds = currentRoles.map((r) => r.id);

        // Find roles to add and remove
        const rolesToAdd = roleIds.filter((id) => !currentRoleIds.includes(id));
        const rolesToRemove = currentRoleIds.filter(
          (id) => !roleIds.includes(id)
        );

        // Remove roles
        for (const roleId of rolesToRemove) {
          await service.removeRoleFromGroup(groupId, roleId);
        }

        // Add roles
        for (const roleId of rolesToAdd) {
          await service.addRoleToGroup(groupId, roleId);
        }
      }

      await fetchGroups();
      setEditDialogOpen(false);
      setEditGroup(null);
    } catch (err) {
      setSubmitError(err as Error);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (group: Group) => {
    setGroupToDelete(group);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    try {
      await service.deleteGroup(groupToDelete.id);
      await fetchGroups();
      setDeleteConfirmOpen(false);
      setGroupToDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete group");
    }
  };

  return (
    <div className={className}>
      <GroupList
        groups={groups}
        loading={loading}
        error={error}
        onGroupClick={onGroupClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showActions
        showCreateButton={showCreateButton}
        onCreate={() => setCreateDialogOpen(true)}
      />

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        roleService={roleService}
        loading={submitting}
        error={submitError}
      />

      {editGroup && (
        <EditGroupDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          group={editGroup}
          onSubmit={handleUpdate}
          roleService={roleService}
          groupService={service}
          loading={submitting}
          error={submitError}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Group"
        description={
          groupToDelete
            ? `Are you sure you want to delete the group "${groupToDelete.name}"? This action cannot be undone and will remove all members from the group.`
            : undefined
        }
        confirmAction={{
          label: "Delete",
          variant: "destructive",
          onClick: handleDeleteConfirm,
        }}
      />
    </div>
  );
}
