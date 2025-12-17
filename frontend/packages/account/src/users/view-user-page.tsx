/**
 * View User Page Component
 *
 * Full-featured page for viewing and managing a single user
 * Handles user details, activity, and all user actions (edit, activate, deactivate, lock, unlock, password reset)
 */

import { UserDetail } from "./user-detail";
import { EditUserDialog } from "./user-entry/edit-user-dialog";
import { useUserService } from "./user-provider";
import { User, UpdateUserInput } from "../types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@truths/ui";

// Helper function to parse permission errors and return user-friendly messages
function parsePermissionError(
  error: Error,
  action: string
): { title: string; message: string } {
  let errorMessage = `Failed to ${action}`;
  let errorTitle = "Error";

  try {
    // Try to parse error message as JSON (FastAPI format)
    const errorData = JSON.parse(error.message);
    const detail = errorData.detail || error.message;

    // Check if it's a permission error
    if (detail.includes("Permission") && detail.includes("required")) {
      errorTitle = "Permission Denied";
      errorMessage = `You don't have permission to ${action.toLowerCase()}. Please contact your administrator.`;
    } else if (detail) {
      errorMessage = detail;
    }
  } catch {
    // If not JSON, use the message directly
    if (
      error.message.includes("Permission") &&
      error.message.includes("required")
    ) {
      errorTitle = "Permission Denied";
      errorMessage = `You don't have permission to ${action.toLowerCase()}. Please contact your administrator.`;
    } else if (error.message) {
      errorMessage = error.message;
    }
  }

  return { title: errorTitle, message: errorMessage };
}

export interface ViewUserProps {
  userId: string;
  onBack?: () => void;
  onUpdateTabTitle?: (title: string, iconName?: string) => void;
}

export function ViewUser({ userId, onBack, onUpdateTabTitle }: ViewUserProps) {
  const userService = useUserService();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch user by ID
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userService.fetchUser(userId),
    enabled: typeof userId === "string" && userId.length > 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 30_000,
  });

  // Update the top tab title once the user is loaded
  useEffect(() => {
    if (!userId || !user || !onUpdateTabTitle) return;
    const parts = [user.firstName, user.lastName].filter(Boolean);
    const displayName =
      parts.length > 0
        ? parts.join(" ")
        : user.username || user.email || "User";
    onUpdateTabTitle(displayName, "User");
  }, [userId, user, onUpdateTabTitle]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  const handleEdit = useCallback((_user: User) => {
    setEditDialogOpen(true);
  }, []);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserInput }) =>
      userService.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Invalidate activity cache to show new audit events (e.g., user update)
      queryClient.invalidateQueries({ queryKey: ["user-activity", userId] });
      toast({
        title: "User Updated",
        description: "User information has been successfully updated",
      });
    },
    onError: (error: Error) => {
      const { title, message } = parsePermissionError(error, "update user");
      toast({
        title,
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateUser = useCallback(
    async (userId: string, data: UpdateUserInput) => {
      await updateUserMutation.mutateAsync({ userId, data });
    },
    [updateUserMutation]
  );

  // Password reset mutation
  const passwordResetMutation = useMutation({
    mutationFn: ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => userService.resetPassword(userId, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      // Invalidate activity cache to show password reset audit event
      queryClient.invalidateQueries({ queryKey: ["user-activity", userId] });
      toast({
        title: "Password Reset",
        description: "User password has been successfully reset",
      });
    },
    onError: (error: Error) => {
      const { title, message } = parsePermissionError(error, "reset password");
      toast({
        title,
        description: message,
        variant: "destructive",
      });
    },
  });

  const handlePasswordReset = useCallback(
    async (user: User, temporaryPassword: string) => {
      await passwordResetMutation.mutateAsync({
        userId: user.id,
        newPassword: temporaryPassword,
      });
    },
    [passwordResetMutation]
  );

  // Activate user mutation
  const activateMutation = useMutation({
    mutationFn: (userId: string) => userService.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      // Invalidate activity cache to show account activation audit event
      queryClient.invalidateQueries({ queryKey: ["user-activity", userId] });
      toast({
        title: "User Activated",
        description: "User has been successfully activated",
      });
    },
    onError: (error: Error) => {
      const { title, message } = parsePermissionError(error, "activate user");
      toast({
        title,
        description: message,
        variant: "destructive",
      });
    },
  });

  // Deactivate user mutation
  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => userService.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      // Invalidate activity cache to show account deactivation audit event
      queryClient.invalidateQueries({ queryKey: ["user-activity", userId] });
      toast({
        title: "User Deactivated",
        description: "User has been successfully deactivated",
      });
    },
    onError: (error: Error) => {
      const { title, message } = parsePermissionError(error, "deactivate user");
      toast({
        title,
        description: message,
        variant: "destructive",
      });
    },
  });

  // Lock user mutation
  const lockMutation = useMutation({
    mutationFn: (userId: string) => userService.lockUser(userId, 60),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      // Invalidate activity cache to immediately show account lock audit event
      queryClient.invalidateQueries({ queryKey: ["user-activity", userId] });
      toast({
        title: "Account Locked",
        description: "User account has been locked for 60 minutes",
      });
    },
    onError: (error: Error) => {
      const { title, message } = parsePermissionError(
        error,
        "lock user account"
      );
      toast({
        title,
        description: message,
        variant: "destructive",
      });
    },
  });

  // Unlock user mutation
  const unlockMutation = useMutation({
    mutationFn: (userId: string) => userService.unlockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      // Invalidate activity cache to immediately show account unlock audit event
      queryClient.invalidateQueries({ queryKey: ["user-activity", userId] });
      toast({
        title: "Account Unlocked",
        description: "User account has been unlocked",
      });
    },
    onError: (error: Error) => {
      const { title, message } = parsePermissionError(
        error,
        "unlock user account"
      );
      toast({
        title,
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleActivate = useCallback(
    async (user: User) => {
      await activateMutation.mutateAsync(user.id);
    },
    [activateMutation]
  );

  const handleDeactivate = useCallback(
    async (user: User) => {
      await deactivateMutation.mutateAsync(user.id);
    },
    [deactivateMutation]
  );

  const handleLock = useCallback(
    async (user: User) => {
      await lockMutation.mutateAsync(user.id);
    },
    [lockMutation]
  );

  const handleUnlock = useCallback(
    async (user: User) => {
      await unlockMutation.mutateAsync(user.id);
    },
    [unlockMutation]
  );

  // Fetch user activity - queries by entity_id to get all activities for this user
  // This includes login, logout, account changes, etc. - all activities related to the user
  const { data: activities = [] } = useQuery({
    queryKey: ["user-activity", userId], // Activity for the viewed user
    queryFn: () => {
      // Query by entity_id to get all activities related to this user
      // This will return login, logout, account changes, and other activities
      return userService.fetchUserActivity(userId, 100, 24); // Last 24 hours
    },
    enabled: typeof userId === "string" && userId.length > 0,
    retry: false,
    // Enable refetch on window focus to get latest activities when user returns to tab
    refetchOnWindowFocus: true,
    // Shorter stale time for activity logs to ensure freshness
    // Activities change frequently (login, logout, account actions), so we want recent data
    staleTime: 30_000, // 30 seconds - activities are time-sensitive
    // Also refetch on reconnect to get latest data after network issues
    refetchOnReconnect: true,
  });

  // If no valid userId, render nothing to avoid loops
  if (typeof userId !== "string" || userId.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <UserDetail
        user={user}
        loading={isLoading}
        error={error as Error | null}
        activities={activities}
        showActivity={true}
        showMetadata={false}
        editable={true}
        onEdit={handleEdit}
        onPasswordReset={handlePasswordReset}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onLock={handleLock}
        onUnlock={handleUnlock}
        onBack={handleBack}
      />
      {user && (
        <EditUserDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={user}
          onSubmit={handleUpdateUser}
          loading={updateUserMutation.isPending}
        />
      )}
    </div>
  );
}
