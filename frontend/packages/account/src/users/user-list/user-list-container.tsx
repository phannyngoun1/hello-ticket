/**
 * User List Container
 *
 * Container component that integrates UserList with data fetching and mutations
 * Uses the UserService and hooks to handle all operations
 *
 * @author Phanny
 */

import { useEffect, useState, useCallback } from "react";
import { UserList } from "./user-list";
import { CreateUserDialog } from "../user-entry/create-user-dialog";
import { useUserService } from "../user-provider";
import {
  useUsers,
  useDeleteUser,
  useCreateUser,
  useLockUser,
  useUnlockUser,
  useActivateUser,
  useDeactivateUser,
} from "../use-users";
import { useToast } from "@truths/ui";
import { CreateUserInput, UserFilter } from "../../types";
import { Pagination } from "@truths/shared";

export interface UserListContainerProps {
  /** When true, opens the create user dialog on mount or when toggled on */
  autoOpenCreate?: boolean;
  /** Called when the create dialog is closed (cancel/close after open) */
  onCreateDialogClose?: () => void;
  /** Navigation function to navigate to create user route */
  onNavigateToCreate?: () => void;
  /** Navigation function to navigate to a user detail route */
  onNavigateToUser?: (userId: string) => void;
}

export function UserListContainer({
  autoOpenCreate = false,
  onCreateDialogClose,
  onNavigateToCreate,
  onNavigateToUser,
}: UserListContainerProps) {
  const userService = useUserService();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filter and pagination state
  const [filter, setFilter] = useState<UserFilter>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });
  const [globalSearch, setGlobalSearch] = useState("");

  // Fetch users with filters and pagination
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useUsers(userService, {
    filter: {
      ...filter,
      search: globalSearch || filter.search,
    },
    pagination,
  });
  const users = usersResponse?.data || [];
  const serverPagination = usersResponse?.pagination;

  // Sync total and totalPages when server returns them
  useEffect(() => {
    if (
      serverPagination?.total !== undefined ||
      serverPagination?.totalPages !== undefined
    ) {
      setPagination((prev) => ({
        ...prev,
        total: serverPagination?.total,
        totalPages: serverPagination?.totalPages,
      }));
    }
  }, [serverPagination?.total, serverPagination?.totalPages]);

  // Delete mutation
  const deleteMutation = useDeleteUser(userService);

  // Create mutation
  const createMutation = useCreateUser(userService);

  // Lock/Unlock mutations
  const lockMutation = useLockUser(userService);
  const unlockMutation = useUnlockUser(userService);

  // Activate/Deactivate mutations
  const activateMutation = useActivateUser(userService);
  const deactivateMutation = useDeactivateUser(userService);

  const handleDelete = useCallback(
    async (user: any) => {
      if (window.confirm(`Are you sure you want to delete ${user.email}?`)) {
        try {
          await deleteMutation.mutateAsync(user.id);
          toast({
            title: "Success",
            description: "User deleted successfully",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to delete user",
            variant: "destructive",
          });
        }
      }
    },
    [deleteMutation, toast]
  );

  const handleEdit = useCallback((user: any) => {
    // TODO: Navigate to edit page or open edit dialog
  }, []);

  const handleLock = useCallback(
    async (user: any) => {
      try {
        await lockMutation.mutateAsync(user.id);
        toast({
          title: "User Locked",
          description: `User ${user.email} has been locked for 60 minutes`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to lock user",
          variant: "destructive",
        });
      }
    },
    [lockMutation, toast]
  );

  const handleUnlock = useCallback(
    async (user: any) => {
      try {
        await unlockMutation.mutateAsync(user.id);
        toast({
          title: "User Unlocked",
          description: `User ${user.email} has been unlocked`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to unlock user",
          variant: "destructive",
        });
      }
    },
    [unlockMutation, toast]
  );

  const handleActivate = useCallback(
    async (user: any) => {
      try {
        await activateMutation.mutateAsync(user.id);
        toast({
          title: "User Activated",
          description: `User ${user.email} has been activated`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to activate user",
          variant: "destructive",
        });
      }
    },
    [activateMutation, toast]
  );

  const handleDeactivate = useCallback(
    async (user: any) => {
      try {
        await deactivateMutation.mutateAsync(user.id);
        toast({
          title: "User Deactivated",
          description: `User ${user.email} has been deactivated`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to deactivate user",
          variant: "destructive",
        });
      }
    },
    [deactivateMutation, toast]
  );

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    } else {
      // Update URL to include action=create without reloading or depending on router types
      try {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("action", "create");
        const newUrl = `${currentUrl.pathname}?${currentUrl.searchParams.toString()}`;
        window.history.pushState({}, "", newUrl);
      } catch {
        // no-op if URL manipulation fails
      }
    }
    // Open dialog immediately for responsive UX
    setIsCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  // Open the create dialog when requested by parent (e.g., via URL param)
  useEffect(() => {
    if (autoOpenCreate && !isCreateDialogOpen) {
      setIsCreateDialogOpen(true);
    }
  }, [autoOpenCreate, isCreateDialogOpen]);

  const handleCreateUser = useCallback(
    async (userData: CreateUserInput) => {
      try {
        await createMutation.mutateAsync(userData);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create user",
          variant: "destructive",
        });
        throw error; // Re-throw to let the dialog handle it
      }
    },
    [createMutation, toast]
  );

  const handleUserClick = useCallback(
    (user: any) => {
      try {
        if (onNavigateToUser) {
          onNavigateToUser(user.id);
          return;
        }
        const currentUrl = new URL(window.location.href);
        const base = `${currentUrl.origin}`;
        const next = `/users/${user.id}`;
        window.history.pushState({}, "", `${base}${next}`);
      } catch {
        // fallback
        window.location.href = `/users/${user.id}`;
      }
    },
    [onNavigateToUser]
  );

  const handleSearch = useCallback((query: string) => {
    setGlobalSearch(query);
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleFilter = useCallback((newFilter: UserFilter) => {
    setFilter(newFilter);
    // Reset to first page when filtering
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handleStatusFilterChange = useCallback(
    (status: "active" | "inactive" | "suspended" | "pending" | undefined) => {
      // Update filter with status
      setFilter((prev) => ({
        ...prev,
        status: status,
      }));
      // Reset to first page when filtering
      setPagination((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  return (
    <>
      <UserList
        users={users}
        loading={isLoading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onUserClick={handleUserClick}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onStatusFilterChange={handleStatusFilterChange}
        filter={filter}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onLock={handleLock}
        onUnlock={handleUnlock}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onRefresh={() => refetch()}
        isRefetching={isFetching}
        searchable
        showAvatar
        showRole
        showStatus
        showActions
      />

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateUser}
        loading={createMutation.isPending}
        error={createMutation.error}
      />
    </>
  );
}
