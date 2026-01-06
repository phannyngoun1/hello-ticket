/**
 * Employee List Container
 *
 * Integrates the list, dialogs, and service hooks to manage employees.
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput, EmployeeFilter } from "./types";
import { EmployeeList } from "./employee-list";
import { CreateEmployeeDialog } from "./create-employee-dialog";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "./use-employees";
import { useEmployeeService } from "./employee-provider";

export interface EmployeeListContainerProps {
  onNavigateToEmployee?: (id: string) => void;
  onNavigateToCreate?: () => void;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function EmployeeListContainer({
  onNavigateToEmployee,
  onNavigateToCreate,
  autoOpenCreate,
  onCreateDialogClose,
}: EmployeeListContainerProps) {
  const employeeService = useEmployeeService();

  const [filter, setFilter] = useState<EmployeeFilter>({});
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error } = useEmployees(employeeService, {
    filter,
    pagination,
  });

  const createMutation = useCreateEmployee(employeeService);
  const updateMutation = useUpdateEmployee(employeeService);
  const deleteMutation = useDeleteEmployee(employeeService);

  const employees = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  const handleEdit = useCallback((employee: Employee) => {
    setEmployeeToEdit(employee);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (employee: Employee) => {
      try {
        await deleteMutation.mutateAsync(employee.id);
        toast({ title: "Success", description: "Employee deleted successfully" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete employee",
          variant: "destructive",
        });
      }
    },
    [deleteMutation]
  );

  const handleSearch = useCallback((query: string) => {
    setFilter((prev) => ({ ...prev, search: query || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize });
  }, []);

  const handleCreateSubmit = useCallback(
    async (input: CreateEmployeeInput) => {
      try {
        await createMutation.mutateAsync(input);
        toast({ title: "Success", description: "Employee created successfully" });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to create employee",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createMutation, onCreateDialogClose]
  );

  const handleEditSubmit = useCallback(
    async (id: string, input: UpdateEmployeeInput) => {
      try {
        await updateMutation.mutateAsync({ id, input });
        toast({ title: "Success", description: "Employee updated successfully" });
        setEditDialogOpen(false);
        setEmployeeToEdit(null);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update employee",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation]
  );

  const handleNavigateToEmployee = useCallback(
    (employee: Employee) => {
      onNavigateToEmployee?.(employee.id);
    },
    [onNavigateToEmployee]
  );

  const serverPagination = useMemo(() => {
    if (!paginationData) return undefined;
    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: paginationData.total,
      totalPages: paginationData.totalPages,
    };
  }, [pagination, paginationData]);

  return (
    <>
      <EmployeeList
        employees={employees}
        loading={isLoading}
        error={error as Error | null}
        onEmployeeClick={handleNavigateToEmployee}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateSubmit}
      />

      <EditEmployeeDialog
        open={editDialogOpen && !!employeeToEdit}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEmployeeToEdit(null);
          }
        }}
        onSubmit={handleEditSubmit}
        employee={employeeToEdit}
      />
    </>
  );
}

