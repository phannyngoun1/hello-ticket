/**
 * Role List Container Component
 *
 * Container component that manages role data fetching and state
 *
 * @author Phanny
 */

import { useState, useEffect } from "react";
import { RoleList } from "./role-list";
import { CreateRoleDialog } from "./create-role-dialog";
import { EditRoleDialog } from "./edit-role-dialog";
import { RoleDetail } from "./role-detail";
import { Button } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import { RoleService } from "./role-service";
import { Role } from "../types";

export interface RoleListContainerProps {
  service: RoleService;
  className?: string;
  onRoleClick?: (role: Role) => void;
  showCreateButton?: boolean;
}

export function RoleListContainer({
  service,
  className,
  onRoleClick,
  showCreateButton = true,
}: RoleListContainerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [detailViewRole, setDetailViewRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [includeSystemRoles] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.fetchRoles(includeSystemRoles);
      setRoles(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeSystemRoles]);


  const handleCreate = async (data: {
    name: string;
    description?: string;
    permissions: string[];
  }) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await service.createRole(data);
      await fetchRoles();
      setCreateDialogOpen(false);
    } catch (err) {
      setSubmitError(err as Error);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (role: Role) => {
    setEditRole(role);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (
    roleId: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
    }
  ) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await service.updateRole(roleId, data);
      await fetchRoles();
      setEditDialogOpen(false);
      setEditRole(null);
    } catch (err) {
      setSubmitError(err as Error);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    try {
      await service.deleteRole(roleToDelete.id);
      await fetchRoles();
      if (detailViewRole?.id === roleToDelete.id) {
        setDetailViewRole(null);
      }
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete role");
    }
  };

  const handleRoleClick = (role: Role) => {
    if (onRoleClick) {
      onRoleClick(role);
    } else {
      setDetailViewRole(role);
    }
  };

  if (detailViewRole) {
    return (
      <div className={className}>
        <Button
          variant="ghost"
          onClick={() => setDetailViewRole(null)}
          className="mb-4"
        >
          ← Back to Roles
        </Button>
        <RoleDetail
          role={detailViewRole}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUserClick={(user) => {
            // Could navigate to user detail page
          }}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <RoleList
        roles={roles}
        loading={loading}
        error={error}
        onRoleClick={handleRoleClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showActions
        showCreateButton={showCreateButton}
        onCreate={() => setCreateDialogOpen(true)}
      />

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        loading={submitting}
        error={submitError}
      />

      {editRole && (
        <EditRoleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          role={editRole}
          onSubmit={handleUpdate}
          loading={submitting}
          error={submitError}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Role"
        description={
          roleToDelete
            ? `Are you sure you want to delete the role "${roleToDelete.name}"? This action cannot be undone and will remove the role from all users who have it assigned.`
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
