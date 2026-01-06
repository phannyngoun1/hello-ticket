/**
 * User List Component
 *
 * Display and manage users in a table with search, filter, and actions.
 *
 * @author Phanny
 */

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@truths/ui";
import {
  ConfirmationDialog,
  createTextColumn,
  createIdentifiedColumn,
  createActionsColumn,
} from "@truths/custom-ui";
import { Lock, Unlock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import { AccountComponentMetadata } from "../../registry";
import { User, UserFilter } from "../../types";
import { Pagination } from "@truths/shared";
import { DataTable } from "@truths/custom-ui";
import { UserFilterSheet } from "./user-filter-sheet";

export interface UserListProps {
  className?: string;
  users?: User[];
  loading?: boolean;
  error?: Error | null;
  filter?: UserFilter;
  pagination?: Pagination;
  searchable?: boolean;
  searchPlaceholder?: string;
  showAvatar?: boolean;
  showRole?: boolean;
  showStatus?: boolean;
  showActions?: boolean;
  onUserClick?: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filter: UserFilter) => void;
  onStatusFilterChange?: (status: User["status"] | undefined) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (user: User) => React.ReactNode;
  onLock?: (user: User) => void;
  onUnlock?: (user: User) => void;
  onActivate?: (user: User) => void;
  onDeactivate?: (user: User) => void;
}

export function UserList({
  className,
  users = [],
  loading = false,
  error = null,
  searchable = true,
  searchPlaceholder = "Search users...",
  showAvatar = true,
  showRole = true,
  showStatus = true,
  showActions = true,
  pagination,
  filter: initialFilter,
  onUserClick,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onFilter,
  onStatusFilterChange,
  onPageChange,
  onPageSizeChange,
  customActions,
  onLock,
  onUnlock,
  onActivate,
  onDeactivate,
}: UserListProps) {
  const density = useDensityStyles();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<UserFilter>(
    initialFilter || {}
  );

  // Confirmation dialog states
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleFilterApply = (filter: UserFilter) => {
    setCurrentFilter(filter);
    onFilter?.(filter);
  };

  const handleFilterReset = () => {
    const emptyFilter: UserFilter = {};
    setCurrentFilter(emptyFilter);
    onFilter?.(emptyFilter);
  };

  const handleResetFilters = () => {
    // Reset advanced filters
    handleFilterReset();
    // Note: Global filter and status filter will be reset by the table toolbar
  };

  const handleFilterClick = () => {
    setFilterSheetOpen(true);
  };

  const hasActiveFilters = Object.values(currentFilter).some(
    (value) => value !== undefined && value !== ""
  );

  const getUserDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.username || user.email;
  };

  const getUserInitials = (user: User): string => {
    const first = (user.firstName || "").trim();
    const last = (user.lastName || "").trim();
    if (first || last) {
      const firstInitial = first ? first[0] : "";
      const lastInitial = last ? last[0] : "";
      const combined = `${firstInitial}${lastInitial || (first.length > 1 ? first[1] : "")}`;
      return combined.toUpperCase();
    }
    const fallback = (user.username || user.email || "").trim();
    const lettersOnly = fallback.replace(/[^a-zA-Z]/g, "");
    if (lettersOnly.length >= 2) return lettersOnly.slice(0, 2).toUpperCase();
    if (fallback.length >= 2) return fallback.slice(0, 2).toUpperCase();
    if (fallback.length === 1) return fallback[0].toUpperCase();
    return "?";
  };

  // Status badge component with density support
  const StatusBadge = ({
    status,
    lockedUntil,
  }: {
    status: User["status"];
    lockedUntil?: Date;
  }) => {
    const density = useDensityStyles();
    const colors: Record<User["status"], string> = {
      active: "text-muted-foreground",
      inactive: "text-muted-foreground",
      suspended: "text-muted-foreground",
      pending: "text-muted-foreground",
    };
    const isLocked = lockedUntil && new Date(lockedUntil) > new Date();
    return (
      <div className="flex items-center gap-1">
        <span className={cn("capitalize", colors[status], density.textSize)}>
          {status}
        </span>
        {isLocked && <Lock className={cn("text-red-500", density.iconSize)} />}
      </div>
    );
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  };

  // Create columns based on props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<User, any>[] = [
    createIdentifiedColumn<User>({
      getDisplayName: (user: User) => {
        const fullName =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : getUserDisplayName(user);
        return fullName;
      },
      getAvatar: (user: User) => user.avatar,
      getInitials: (user: User) => getUserInitials(user),
      header: showAvatar ? "User" : "Name",
      showAvatar: showAvatar,
      onClick: onUserClick
        ? (user: User) => {
            onUserClick(user);
          }
        : undefined,
      // Indicators can be added here in the future
      // renderIndicators: (user) => (
      //   <>
      //     {user.isVerified && <CheckCircle className="h-3 w-3 text-green-500" />}
      //     {user.isLocked && <Lock className="h-3 w-3 text-red-500" />}
      //   </>
      // ),
      size: showAvatar ? 250 : 200,
      additionalOptions: {
        id: showAvatar ? "user" : "name",
      },
    }),
    createTextColumn<User>({
      accessorKey: "username",
      header: "Username",
      size: 150,
    }),
    createTextColumn<User>({
      accessorKey: "email",
      header: "Email",
      size: 250,
    }),
    ...(showRole
      ? [
          createTextColumn<User>({
            accessorKey: "role" as any, // Will be overridden by accessorFn
            header: "Role",
            size: 120,
            cell: (info) => {
              const user = info.row.original;
              const role = user.role || user.baseRole || "User";
              return (
                <Badge variant="outline" className="text-[10px]">
                  {role}
                </Badge>
              );
            },
            additionalOptions: {
              id: "role",
              accessorFn: (row) => row.role || row.baseRole || "User",
            },
          }),
        ]
      : []),
    ...(showStatus
      ? [
          createTextColumn<User>({
            accessorKey: "status",
            header: "Status",
            size: 110,
            cell: (info) => {
              const user = info.row.original;
              return (
                <StatusBadge
                  status={info.getValue() as User["status"]}
                  lockedUntil={user.lockedUntil}
                />
              );
            },
          }),
        ]
      : []),
    createTextColumn<User>({
      accessorKey: "lastLogin" as any, // Will be overridden by accessorFn
      header: "Last Login",
      size: 130,
      cell: (info) => (
        <span className={cn("text-muted-foreground", density.textSize)}>
          {formatDate(info.getValue() as Date | undefined)}
        </span>
      ),
      additionalOptions: {
        id: "lastLogin",
        accessorFn: (row) => row.lastLogin,
      },
    }),
    ...(showActions
      ? [
          createActionsColumn<User>({
            customActions: customActions,
            actions: [
              // Unlock action (shown when user is locked)
              ...(onUnlock
                ? [
                    {
                      icon: Unlock,
                      onClick: (user: User) => {
                        setSelectedUser(user);
                        setUnlockConfirmOpen(true);
                      },
                      showWhen: (user: User) => {
                        const isLocked = Boolean(
                          user.lockedUntil &&
                            new Date(user.lockedUntil) > new Date()
                        );
                        return isLocked;
                      },
                      disabledWhen: (user: User) => user.status !== "active",
                      title: (user: User) =>
                        user.status !== "active"
                          ? "Cannot unlock inactive user"
                          : "Unlock",
                      className:
                        "h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    },
                  ]
                : []),
              // Lock action (shown when user is not locked)
              ...(onLock
                ? [
                    {
                      icon: Lock,
                      onClick: (user: User) => {
                        setSelectedUser(user);
                        setLockConfirmOpen(true);
                      },
                      showWhen: (user: User) => {
                        const isLocked = Boolean(
                          user.lockedUntil &&
                            new Date(user.lockedUntil) > new Date()
                        );
                        return !isLocked;
                      },
                      disabledWhen: (user: User) => user.status !== "active",
                      title: (user: User) =>
                        user.status !== "active"
                          ? "Cannot lock inactive user"
                          : "Lock",
                      className:
                        "h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    },
                  ]
                : []),
              // Deactivate action (shown when user is active)
              ...(onDeactivate
                ? [
                    {
                      icon: XCircle,
                      onClick: (user: User) => {
                        setSelectedUser(user);
                        setDeactivateConfirmOpen(true);
                      },
                      showWhen: (user: User) => user.status === "active",
                      title: "Deactivate",
                      className:
                        "h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    },
                  ]
                : []),
              // Activate action (shown when user is not active)
              ...(onActivate
                ? [
                    {
                      icon: CheckCircle,
                      onClick: (user: User) => {
                        setSelectedUser(user);
                        setActivateConfirmOpen(true);
                      },
                      showWhen: (user: User) => user.status !== "active",
                      title: "Activate",
                      className:
                        "h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    },
                  ]
                : []),
            ],
          }),
        ]
      : []),
  ];

  // Use DataTable with custom columns
  return (
    <div className={cn("w-full", className)}>
      <DataTable<User>
        data={users}
        columns={columns}
        useDefaultColumns={false}
        title="Users"
        description="Manage and view user accounts"
        onCreate={onCreate}
        onFilterClick={handleFilterClick}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        onSearch={onSearch}
        viewId="user-list"
        filterDefs={[
            {
                columnId: "status",
                title: "Status",
                options: [
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                  { label: "Pending", value: "pending" },
                  { label: "Suspended", value: "suspended" },
                ]
            }
        ]}
        onStatusFilterChange={(val) => onStatusFilterChange?.(val as any)} 
        manualFiltering={true}
        loading={loading}
        // Enable server-side pagination in the table and wire handlers
        manualPagination={Boolean(pagination && onPageChange)}
        serverPagination={
          pagination
            ? {
                page: pagination.page,
                pageSize: pagination.pageSize,
                total: pagination.total,
                totalPages: pagination.totalPages,
              }
            : undefined
        }
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <UserFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filter={currentFilter}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />

      {/* Lock Confirmation Dialog */}
      <ConfirmationDialog
        open={lockConfirmOpen}
        onOpenChange={setLockConfirmOpen}
        title="Lock Account"
        description={
          selectedUser
            ? `Are you sure you want to lock ${selectedUser.firstName || selectedUser.email}'s account? The account will be locked for 60 minutes, preventing login access.`
            : undefined
        }
        confirmAction={{
          label: "Lock Account",
          variant: "destructive",
          onClick: async () => {
            if (selectedUser && onLock) {
              await onLock(selectedUser);
              setLockConfirmOpen(false);
            }
          },
        }}
      />

      {/* Unlock Confirmation Dialog */}
      <ConfirmationDialog
        open={unlockConfirmOpen}
        onOpenChange={setUnlockConfirmOpen}
        title="Unlock Account"
        description={
          selectedUser
            ? `Are you sure you want to unlock ${selectedUser.firstName || selectedUser.email}'s account? This will immediately restore their login access.`
            : undefined
        }
        confirmAction={{
          label: "Unlock Account",
          variant: "default",
          onClick: async () => {
            if (selectedUser && onUnlock) {
              await onUnlock(selectedUser);
              setUnlockConfirmOpen(false);
            }
          },
        }}
      />

      {/* Activate Confirmation Dialog */}
      <ConfirmationDialog
        open={activateConfirmOpen}
        onOpenChange={setActivateConfirmOpen}
        title="Activate User"
        description={
          selectedUser
            ? `Are you sure you want to activate ${selectedUser.firstName || selectedUser.email}? This will restore their access to the system.`
            : undefined
        }
        confirmAction={{
          label: "Activate",
          variant: "default",
          onClick: async () => {
            if (selectedUser && onActivate) {
              await onActivate(selectedUser);
              setActivateConfirmOpen(false);
            }
          },
        }}
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmationDialog
        open={deactivateConfirmOpen}
        onOpenChange={setDeactivateConfirmOpen}
        title="Deactivate User"
        description={
          selectedUser
            ? `Are you sure you want to deactivate ${selectedUser.firstName || selectedUser.email}? This will prevent them from accessing the system.`
            : undefined
        }
        confirmAction={{
          label: "Deactivate",
          variant: "destructive",
          onClick: async () => {
            if (selectedUser && onDeactivate) {
              await onDeactivate(selectedUser);
              setDeactivateConfirmOpen(false);
            }
          },
        }}
      />
    </div>
  );
}

export function userListMetadata(): AccountComponentMetadata {
  return {
    name: "User List",
    description:
      "Enterprise-grade user management table with advanced filtering, sorting, pagination, and export capabilities",
    category: "users",
    tags: ["users", "table", "list", "management", "enterprise", "data-table"],
    version: "2.0.0",
    dependencies: ["@truths/ui", "@tanstack/react-table"],
  };
}
