/**
 * Customer List Container
 *
 * Integrates the list, dialogs, and service hooks to manage customers.
 *
 * @author Phanny
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilter,
} from "../types";
import { CustomerList } from "./customer-list";
import { CreateCustomerDialog } from "./create-customer-dialog";
import { EditCustomerDialog } from "./edit-customer-dialog";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "./use-customers";
import { useCustomerService } from "./customer-provider";

export interface CustomerListContainerProps {
  onNavigateToCustomer?: (id: string) => void;
  onNavigateToCreate?: () => void;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function CustomerListContainer({
  onNavigateToCustomer,
  onNavigateToCreate,
  autoOpenCreate,
  onCreateDialogClose,
}: CustomerListContainerProps) {
  const customerService = useCustomerService();

  const [filter, setFilter] = useState<CustomerFilter>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const prevAutoOpenRef = React.useRef(false);
  const [searchInput, setSearchInput] = useState<string>("");

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error } = useCustomers(customerService, {
    filter,
    pagination,
  });

  const createMutation = useCreateCustomer(customerService);
  const updateMutation = useUpdateCustomer(customerService);
  const deleteMutation = useDeleteCustomer(customerService);

  const customers = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  const handleEdit = useCallback((customer: Customer) => {
    setCustomerToEdit(customer);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (customer: Customer) => {
      try {
        await deleteMutation.mutateAsync(customer.id);
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        });
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to delete customer",
          variant: "destructive",
        });
      }
    },
    [deleteMutation]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchInput(query ?? "");
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilter((prev) => ({ ...prev, search: searchInput || undefined }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize });
  }, []);

  const handleCreateSubmit = useCallback(
    async (input: CreateCustomerInput) => {
      try {
        await createMutation.mutateAsync(input);
        toast({
          title: "Success",
          description: "Customer created successfully",
        });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to create customer",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createMutation, onCreateDialogClose]
  );

  const handleEditSubmit = useCallback(
    async (id: string, input: UpdateCustomerInput) => {
      try {
        await updateMutation.mutateAsync({ id, input });
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
        setEditDialogOpen(false);
        setCustomerToEdit(null);
      } catch (err) {
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to update customer",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation]
  );

  const handleNavigateToCustomer = useCallback(
    (customer: Customer) => {
      onNavigateToCustomer?.(customer.id);
    },
    [onNavigateToCustomer]
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
      <CustomerList
        customers={customers}
        loading={isLoading}
        error={error as Error | null}
        onCustomerClick={handleNavigateToCustomer}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <CreateCustomerDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateSubmit}
      />

      <EditCustomerDialog
        open={editDialogOpen && !!customerToEdit}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setCustomerToEdit(null);
          }
        }}
        onSubmit={handleEditSubmit}
        customer={customerToEdit}
      />
    </>
  );
}
