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
import {
  useEmployees,
  useCreateEmployee,
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
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error, refetch, isFetching } = useEmployees(
    employeeService,
    { filter, pagination }
  );

  const createMutation = useCreateEmployee(employeeService);

  const employees = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);



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
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefresh={() => refetch()}
        isRefetching={isFetching}
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
    </>
  );
}

