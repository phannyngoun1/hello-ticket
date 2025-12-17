/**
 * Assign Role Component
 *
 * Form to assign roles to users.
 */

import React, { useState } from "react";
import { Card } from "@truths/ui";
import { Button } from "@truths/ui";
import { Label } from "@truths/ui";
import { Select } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { AccountComponentMetadata } from "../registry";
import { Role, User, AssignRoleInput } from "../types";

export interface AssignRoleProps {
  className?: string;
  user?: User;
  roles?: Role[];
  onSubmit: (data: AssignRoleInput) => Promise<void> | void;
  onCancel?: () => void;
  onSuccess?: () => void;
  loading?: boolean;
  showExpiration?: boolean;
}

export function AssignRole({
  className,
  user,
  roles = [],
  onSubmit,
  onCancel,
  onSuccess,
  loading = false,
  showExpiration = false,
}: AssignRoleProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    if (!user) {
      setError("User information is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const data: AssignRoleInput = {
        userId: user.id,
        roleId: selectedRole,
      };

      if (showExpiration && expiresAt) {
        data.expiresAt = new Date(expiresAt);
      }

      await onSubmit(data);
      onSuccess?.();
    } catch (err) {
      setError("Failed to assign role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableRoles = user
    ? roles.filter((role) => role.id !== user.role && role.id !== user.baseRole)
    : roles;

  return (
    <Card className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Assign Role</h3>
          <p className="text-sm text-muted-foreground">
            {user
              ? `Assign a role to ${user.firstName || user.username || user.email}`
              : "Select a user to assign a role"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {user && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {user.firstName || user.lastName
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : user.username || user.email}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              {(user.role || user.baseRole) && (
                <div className="text-sm text-muted-foreground">
                  Current role:{" "}
                  <span className="font-medium">
                    {user.role || user.baseRole}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Role Selection */}
        <div className="space-y-2">
          <Label htmlFor="role">
            Select Role <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedRole}
            onValueChange={setSelectedRole}
            disabled={isSubmitting || loading || !user}
            required
          >
            <option value="">Choose a role...</option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
                {role.description && ` - ${role.description}`}
              </option>
            ))}
          </Select>
          {selectedRole && (
            <p className="text-xs text-muted-foreground">
              {roles.find((r) => r.id === selectedRole)?.permissions?.length ||
                0}{" "}
              permissions
            </p>
          )}
        </div>

        {/* Expiration Date (Optional) */}
        {showExpiration && (
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={isSubmitting || loading}
              title="Role expiration date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for permanent role assignment
            </p>
          </div>
        )}

        {/* Selected Role Preview */}
        {selectedRole && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">Role Details</h4>
            {roles
              .filter((r) => r.id === selectedRole)
              .map((role) => (
                <div key={role.id} className="space-y-2">
                  <p className="text-sm">{role.description}</p>
                  <div className="text-xs text-muted-foreground">
                    <p>Permissions: {role.permissions?.length || 0}</p>
                    <p>Users with this role: {role.userCount || 0}</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || loading || !user || !selectedRole}
          >
            {isSubmitting || loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Assigning...
              </>
            ) : (
              "Assign Role"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function assignRoleMetadata(): AccountComponentMetadata {
  return {
    name: "Assign Role",
    description: "Form to assign roles to users",
    category: "roles",
    tags: ["roles", "form", "assign", "management"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
