/**
 * User Detail Component
 *
 * Display detailed information about a user with optional edit and activity views.
 *
 * @author Phanny
 */

import React, { useState, useMemo } from "react";
import { Card } from "@truths/ui";
import { Button } from "@truths/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@truths/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@truths/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@truths/ui";
import { Badge } from "@truths/ui";
import { Avatar } from "@truths/ui";
import { Tabs } from "@truths/ui";
import { Input } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { AccountComponentMetadata } from "../registry";
import { User, UserActivity } from "../types";
import {
  MoreVertical,
  Edit,
  Key,
  Shield,
  Clock,
  User as UserIcon,
  History,
  Database,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Copy,
  Users,
  UsersRound,
  X,
  RefreshCw,
  Power,
  PowerOff,
  Ban,
  Unlock as UnlockIcon,
} from "lucide-react";
import { AssignRolesDialog } from "./user-entry/assign-roles-dialog";
import { AssignGroupsDialog } from "./user-entry/assign-groups-dialog";
import { ViewUserPermissionsSheet } from "./view-user-permissions-sheet";
import { RoleService } from "../roles/role-service";
import { GroupService } from "../groups/group-service";
import { api } from "@truths/api";
import { API_CONFIG } from "@truths/config";
import { useToast } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";

export interface UserDetailProps {
  className?: string;
  user?: User;
  loading?: boolean;
  error?: Error | null;
  activities?: UserActivity[];
  showActivity?: boolean;
  showMetadata?: boolean;
  editable?: boolean;
  onEdit?: (user: User) => void;
  onPasswordReset?: (user: User, temporaryPassword: string) => Promise<void>;
  onActivate?: (user: User) => Promise<void>;
  onDeactivate?: (user: User) => Promise<void>;
  onLock?: (user: User) => Promise<void>;
  onUnlock?: (user: User) => Promise<void>;
  customActions?: (user: User) => React.ReactNode;
  onBack?: () => void;
}

export function UserDetail({
  className,
  user,
  loading = false,
  error = null,
  activities = [],
  showActivity = true,
  showMetadata = false,
  editable = true,
  onEdit,
  onPasswordReset,
  onActivate,
  onDeactivate,
  onLock,
  onUnlock,
  customActions,
  onBack,
}: UserDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "login" | "activity" | "metadata"
  >("profile");
  const [passwordResetConfirmOpen, setPasswordResetConfirmOpen] =
    useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
  const [isAssignRolesOpen, setIsAssignRolesOpen] = useState(false);
  const [isAssignGroupsOpen, setIsAssignGroupsOpen] = useState(false);
  const [isViewPermissionsOpen, setIsViewPermissionsOpen] = useState(false);
  const { toast } = useToast();
  const density = useDensityStyles();

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

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  if (error || !user) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error?.message || "User not found"}
        </div>
      </Card>
    );
  }

  const getUserDisplayName = () => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.username || user.email;
  };

  const getStatusBadge = () => {
    const variants: Record<
      User["status"],
      "default" | "secondary" | "destructive" | "outline"
    > = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
      pending: "outline",
    };
    return <Badge variant={variants[user.status]}>{user.status}</Badge>;
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return "N/A";
    try {
      // Parse the date - API returns ISO 8601 strings with timezone (UTC)
      // JavaScript's Date constructor correctly interprets these and converts to local time
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "Invalid date";

      // Always show full date and time in user's local timezone
      // This automatically converts UTC timestamps from the database to local time
      return dateObj.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true, // 12-hour format with AM/PM
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Generate a secure temporary password
  const generateTemporaryPassword = (): string => {
    const length = 16;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values)
      .map((x) => charset[x % charset.length])
      .join("");
  };

  const handlePasswordResetClick = () => {
    setPasswordResetConfirmOpen(true);
  };

  const handlePasswordResetConfirmClick = () => {
    setPasswordResetConfirmOpen(false);
    const tempPassword = generateTemporaryPassword();
    setTemporaryPassword(tempPassword);
    setPasswordResetOpen(true);
    setPasswordCopied(false);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };

  const handlePasswordResetConfirm = async () => {
    if (!user || !onPasswordReset) return;

    setResetLoading(true);
    try {
      await onPasswordReset(user, temporaryPassword);
      setPasswordResetOpen(false);
    } catch (error) {
      console.error("Password reset failed:", error);
    } finally {
      setResetLoading(false);
    }
  };

  const isUserActive = user.status === "active";
  const isUserLocked =
    user.lockedUntil && new Date(user.lockedUntil) > new Date();

  return (
    <Card className={cn("p-6", className)}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {user.avatar ? (
                <img src={user.avatar} alt={getUserDisplayName()} />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-medium">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{getUserDisplayName()}</h2>
              {user.username && (
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              )}
              {isUserLocked && (
                <p className="text-sm font-medium text-destructive mt-1 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Account locked until {formatDate(user.lockedUntil)}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                {getStatusBadge()}
                <Badge variant="outline">
                  {user.role || user.baseRole || "User"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">{customActions?.(user)}</div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Edit Action */}
                {editable && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(user!)}>
                    <Edit className="mr-2 h-3.5 w-3.5" /> Edit user
                  </DropdownMenuItem>
                )}

                {/* Password Reset */}
                {onPasswordReset && (
                  <DropdownMenuItem onClick={handlePasswordResetClick}>
                    <Key className="mr-2 h-3.5 w-3.5" /> Reset password
                  </DropdownMenuItem>
                )}

                {/* Assign Roles */}
                <DropdownMenuItem onClick={() => setIsAssignRolesOpen(true)}>
                  <Users className="mr-2 h-3.5 w-3.5" /> Assign roles
                </DropdownMenuItem>

                {/* Assign Groups */}
                <DropdownMenuItem onClick={() => setIsAssignGroupsOpen(true)}>
                  <UsersRound className="mr-2 h-3.5 w-3.5" /> Assign groups
                </DropdownMenuItem>

                {/* Separator before status actions */}
                {((editable && onEdit) || onPasswordReset) &&
                  (onActivate || onDeactivate || onLock || onUnlock) && (
                    <DropdownMenuSeparator />
                  )}

                {/* Activate/Deactivate - toggle button */}
                {(onActivate || onDeactivate) && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (!user) return;
                      if (isUserActive && onDeactivate) {
                        setDeactivateConfirmOpen(true);
                      } else if (!isUserActive && onActivate) {
                        setActivateConfirmOpen(true);
                      }
                    }}
                    disabled={
                      (isUserActive && !onDeactivate) ||
                      (!isUserActive && !onActivate)
                    }
                  >
                    {isUserActive ? (
                      <>
                        <XCircle className="mr-2 h-3.5 w-3.5" /> Deactivate user
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-3.5 w-3.5" /> Activate
                        user
                      </>
                    )}
                  </DropdownMenuItem>
                )}

                {/* Lock/Unlock - toggle button */}
                {(onLock || onUnlock) && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (!user) return;
                      if (isUserLocked && onUnlock && isUserActive) {
                        setUnlockConfirmOpen(true);
                      } else if (!isUserLocked && onLock && isUserActive) {
                        setLockConfirmOpen(true);
                      }
                    }}
                    disabled={
                      !isUserActive ||
                      (isUserLocked && !onUnlock) ||
                      (!isUserLocked && (!onLock || !isUserActive))
                    }
                  >
                    {isUserLocked ? (
                      <>
                        <Unlock className="mr-2 h-3.5 w-3.5" /> Unlock account
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-3.5 w-3.5" /> Lock account
                      </>
                    )}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <div className="border-b mb-4">
            <div className="flex gap-4">
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("profile")}
              >
                <span className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Profile
                </span>
              </button>
              <button
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "login"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab("login")}
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Login & Security
                </span>
              </button>
              {showActivity && (
                <button
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "activity"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("activity")}
                >
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Activity
                  </span>
                </button>
              )}
              {showMetadata && user.metadata && (
                <button
                  className={cn(
                    "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "metadata"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("metadata")}
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Metadata
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-0">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Contact Information
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium">Email</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {user.email}
                        </dd>
                      </div>
                      {user.username && (
                        <div>
                          <dt className="text-sm font-medium">Username</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            @{user.username}
                          </dd>
                        </div>
                      )}
                      {user.firstName || user.lastName ? (
                        <div>
                          <dt className="text-sm font-medium">Full Name</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {getUserDisplayName()}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  {(user.tenantId ||
                    (user.permissions && user.permissions.length > 0)) && (
                    <div>
                      <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                        Account Details
                      </h3>
                      <dl className="space-y-3">
                        {user.tenantId && (
                          <div>
                            <dt className="text-sm font-medium">Tenant ID</dt>
                            <dd className="mt-1 text-xs text-muted-foreground font-mono">
                              {user.tenantId}
                            </dd>
                          </div>
                        )}
                        {user.permissions && user.permissions.length > 0 && (
                          <div>
                            <dt className="text-sm font-medium">Permissions</dt>
                            <dd className="mt-1">
                              <div className="flex flex-wrap gap-1">
                                {user.permissions.slice(0, 3).map((perm) => (
                                  <Badge
                                    key={perm}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {perm}
                                  </Badge>
                                ))}
                                {user.permissions.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.permissions.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                      Timeline
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium">Member Since</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </dd>
                      </div>
                      {user.updatedAt && (
                        <div>
                          <dt className="text-sm font-medium">Last Updated</dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(user.updatedAt)}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium">User ID</dt>
                        <dd className="mt-1 text-xs text-muted-foreground font-mono">
                          {user.id}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Actions moved to top-right dropdown */}
              </div>
            )}

            {/* Login & Security Tab */}
            {activeTab === "login" && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Authentication Status
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium">Email Verified</dt>
                        <dd className="mt-1">
                          <Badge
                            variant={user.isVerified ? "default" : "secondary"}
                          >
                            {user.isVerified ? "Verified" : "Not Verified"}
                          </Badge>
                        </dd>
                      </div>
                      {user.isVerified !== undefined && !user.isVerified && (
                        <div>
                          <dt className="text-sm font-medium">
                            Verification Status
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            This user has not verified their email address
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium">
                          Password Change Required
                        </dt>
                        <dd className="mt-1">
                          {user.mustChangePassword ? (
                            <Badge variant="destructive">
                              Yes - Required on next login
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Login History
                    </h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium">Last Login</dt>
                        <dd className="mt-1 text-sm text-muted-foreground">
                          {user.lastLogin ? (
                            <span className="flex items-center gap-2">
                              <span>{formatDate(user.lastLogin)}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Never logged in
                            </span>
                          )}
                        </dd>
                      </div>
                      {user.lastPasswordChange && (
                        <div>
                          <dt className="text-sm font-medium">
                            Last Password Change
                          </dt>
                          <dd className="mt-1 text-sm text-muted-foreground">
                            {formatDate(user.lastPasswordChange)}
                          </dd>
                        </div>
                      )}
                      {user.failedLoginAttempts !== undefined && (
                        <div>
                          <dt className="text-sm font-medium">
                            Failed Login Attempts
                          </dt>
                          <dd className="mt-1">
                            {user.failedLoginAttempts > 0 ? (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    user.failedLoginAttempts >= 5
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {user.failedLoginAttempts}{" "}
                                  {user.failedLoginAttempts === 1
                                    ? "attempt"
                                    : "attempts"}
                                </Badge>
                                {user.failedLoginAttempts >= 5 && (
                                  <span className="text-xs text-destructive">
                                    Warning: High number of failed attempts
                                  </span>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline">None</Badge>
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* View Permissions Button */}
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewPermissionsOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    View All Groups, Roles & Permissions
                  </Button>
                </div>

                {/* Security Recommendations */}
                {(user.mustChangePassword ||
                  (user.failedLoginAttempts !== undefined &&
                    user.failedLoginAttempts > 0) ||
                  user.lockedUntil ||
                  user.isVerified === false) && (
                  <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                    <h4 className="mb-2 text-sm font-medium text-amber-900 dark:text-amber-100">
                      Security Recommendations
                    </h4>
                    <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
                      {user.isVerified === false && (
                        <li>
                          • Email verification is pending - user should verify
                          their email
                        </li>
                      )}
                      {user.mustChangePassword && (
                        <li>• User must change password on next login</li>
                      )}
                      {user.failedLoginAttempts !== undefined &&
                        user.failedLoginAttempts >= 3 && (
                          <li>
                            • Multiple failed login attempts detected - consider
                            reviewing account security
                          </li>
                        )}
                      {user.lockedUntil && (
                        <li>
                          • Account is currently locked - will unlock
                          automatically
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No activity found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recent user activity will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activities.map((activity) => {
                      const getEventIcon = () => {
                        const eventType =
                          activity.eventType?.toLowerCase() || "";
                        if (eventType.includes("login"))
                          return <Shield className="h-4 w-4 text-green-600" />;
                        if (eventType.includes("logout"))
                          return <Shield className="h-4 w-4 text-gray-600" />;
                        if (eventType.includes("password"))
                          return <Key className="h-4 w-4 text-orange-600" />;
                        if (eventType.includes("lock"))
                          return <Lock className="h-4 w-4 text-red-600" />;
                        if (eventType.includes("unlock"))
                          return <Unlock className="h-4 w-4 text-blue-600" />;
                        if (eventType.includes("activate"))
                          return (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          );
                        if (eventType.includes("deactivate"))
                          return <XCircle className="h-4 w-4 text-red-600" />;
                        if (eventType.includes("create"))
                          return (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          );
                        if (eventType.includes("update"))
                          return <Edit className="h-4 w-4 text-yellow-600" />;
                        if (eventType.includes("delete"))
                          return <XCircle className="h-4 w-4 text-red-600" />;
                        return (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        );
                      };

                      const getSeverityBadge = () => {
                        const severity = activity.severity?.toLowerCase();
                        if (!severity) return null;

                        const variants: Record<
                          string,
                          "default" | "secondary" | "destructive" | "outline"
                        > = {
                          critical: "destructive",
                          high: "destructive",
                          medium: "default",
                          low: "secondary",
                        };

                        return (
                          <Badge
                            variant={variants[severity] || "outline"}
                            className="text-xs"
                          >
                            {severity}
                          </Badge>
                        );
                      };

                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            {getEventIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-medium">
                                {activity.action}
                              </p>
                              {getSeverityBadge()}
                            </div>
                            {activity.details && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {activity.details}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {activity.timestamp
                                  ? formatDate(activity.timestamp)
                                  : "N/A"}
                              </span>
                              {activity.resource && (
                                <span className="flex items-center gap-1">
                                  <Database className="h-3 w-3" />
                                  {activity.resource}
                                  {activity.resourceId && (
                                    <span className="font-mono">
                                      #{activity.resourceId.slice(0, 8)}
                                    </span>
                                  )}
                                </span>
                              )}
                              {activity.ipAddress && (
                                <span className="font-mono">
                                  {activity.ipAddress}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Metadata Tab */}
            {activeTab === "metadata" && user.metadata && (
              <div className="space-y-2">
                <pre className="rounded-lg bg-muted p-4 text-sm">
                  {JSON.stringify(user.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetOpen} onOpenChange={setPasswordResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              A temporary password has been generated for {getUserDisplayName()}
              . Make sure to copy it before closing this dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Temporary Password</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={temporaryPassword}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                  title="Copy password"
                >
                  {passwordCopied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordCopied && (
                <p className="text-xs text-green-600">
                  Password copied to clipboard!
                </p>
              )}
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <p className="font-medium mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>This password will be set for the user</li>
                <li>The user must change it on next login</li>
                <li>
                  Save this password securely - it cannot be retrieved again
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordResetOpen(false)}
              disabled={resetLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordResetConfirm}
              disabled={resetLoading || !temporaryPassword}
            >
              {resetLoading ? "Resetting..." : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog
        open={passwordResetConfirmOpen}
        onOpenChange={setPasswordResetConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for{" "}
              {getUserDisplayName()}? A new temporary password will be generated
              that they must use on their next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <X className={density.iconSizeSmall} />
                <span>Cancel</span>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={handlePasswordResetConfirmClick}
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <RefreshCw className={density.iconSizeSmall} />
                <span>Generate New Password</span>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog
        open={activateConfirmOpen}
        onOpenChange={setActivateConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate {getUserDisplayName()}? This
              will restore their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <X className={density.iconSizeSmall} />
                <span>Cancel</span>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={async () => {
                  if (user && onActivate) {
                    await onActivate(user);
                    setActivateConfirmOpen(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <Power className={density.iconSizeSmall} />
                <span>Activate</span>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog
        open={deactivateConfirmOpen}
        onOpenChange={setDeactivateConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {getUserDisplayName()}? This
              will prevent them from accessing the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <X className={density.iconSizeSmall} />
                <span>Cancel</span>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (user && onDeactivate) {
                    await onDeactivate(user);
                    setDeactivateConfirmOpen(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <PowerOff className={density.iconSizeSmall} />
                <span>Deactivate</span>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock Confirmation Dialog */}
      <AlertDialog open={lockConfirmOpen} onOpenChange={setLockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lock Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to lock {getUserDisplayName()}'s account?
              The account will be locked for 60 minutes, preventing login
              access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <X className={density.iconSizeSmall} />
                <span>Cancel</span>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (user && onLock) {
                    await onLock(user);
                    setLockConfirmOpen(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <Ban className={density.iconSizeSmall} />
                <span>Lock Account</span>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlock Confirmation Dialog */}
      <AlertDialog open={unlockConfirmOpen} onOpenChange={setUnlockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlock {getUserDisplayName()}'s account?
              This will immediately restore their login access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <X className={density.iconSizeSmall} />
                <span>Cancel</span>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={async () => {
                  if (user && onUnlock) {
                    await onUnlock(user);
                    setUnlockConfirmOpen(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5",
                  density.textSizeSmall
                )}
              >
                <UnlockIcon className={density.iconSizeSmall} />
                <span>Unlock Account</span>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Roles Dialog */}
      <AssignRolesDialog
        open={isAssignRolesOpen}
        onOpenChange={setIsAssignRolesOpen}
        user={user}
        roleService={roleService}
        onSubmit={async (userId: string, roleIds: string[]) => {
          toast({
            title: "Success",
            description: "Roles assigned successfully",
          });
        }}
      />

      {/* Assign Groups Dialog */}
      <AssignGroupsDialog
        open={isAssignGroupsOpen}
        onOpenChange={setIsAssignGroupsOpen}
        user={user}
        groupService={groupService}
        onSubmit={async (userId: string, groupIds: string[]) => {
          toast({
            title: "Success",
            description: "Groups assigned successfully",
          });
        }}
      />

      {/* View Permissions Sheet */}
      <ViewUserPermissionsSheet
        open={isViewPermissionsOpen}
        onOpenChange={setIsViewPermissionsOpen}
        user={user}
        roleService={roleService}
        groupService={groupService}
      />
    </Card>
  );
}

export function userDetailMetadata(): AccountComponentMetadata {
  return {
    name: "User Detail",
    description: "Display detailed information about a user",
    category: "users",
    tags: ["users", "detail", "profile", "view"],
    version: "1.0.0",
    dependencies: ["@truths/ui"],
  };
}
