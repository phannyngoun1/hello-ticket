/**
 * Test List Container
 *
 * Integrates the list, dialogs, and service hooks to manage tests.
 *
 * @author Phanny
 */

import React, { useCallback, useMemo, useState } from "react";
import { toast } from "@truths/ui";
import type { Pagination } from "@truths/shared";
import type { Test, CreateTestInput, UpdateTestInput, TestFilter } from "./types";
import { TestList } from "./test-list";
import { CreateTestDialog } from "./create-test-dialog";
import { EditTestDialog } from "./edit-test-dialog";
import {
  useTests,
  useCreateTest,
  useUpdateTest,
  useDeleteTest,
} from "./use-tests";
import { useTestService } from "./test-provider";

export interface TestListContainerProps {
  onNavigateToTest?: (id: string) => void;
  onNavigateToCreate?: () => void;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function TestListContainer({
  onNavigateToTest,
  onNavigateToCreate,
  autoOpenCreate,
  onCreateDialogClose,
}: TestListContainerProps) {
  const testService = useTestService();

  const [filter, setFilter] = useState<TestFilter>({});
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [testToEdit, setTestToEdit] = useState<Test | null>(null);
  const prevAutoOpenRef = React.useRef(false);

  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const { data, isLoading, error } = useTests(testService, {
    filter,
    pagination,
  });

  const createMutation = useCreateTest(testService);
  const updateMutation = useUpdateTest(testService);
  const deleteMutation = useDeleteTest(testService);

  const tests = data?.data ?? [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    }
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  const handleEdit = useCallback((test: Test) => {
    setTestToEdit(test);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (test: Test) => {
      try {
        await deleteMutation.mutateAsync(test.id);
        toast({ title: "Success", description: "Test deleted successfully" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete test",
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
    async (input: CreateTestInput) => {
      try {
        await createMutation.mutateAsync(input);
        toast({ title: "Success", description: "Test created successfully" });
        setCreateDialogOpen(false);
        onCreateDialogClose?.();
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to create test",
          variant: "destructive",
        });
        throw err;
      }
    },
    [createMutation, onCreateDialogClose]
  );

  const handleEditSubmit = useCallback(
    async (id: string, input: UpdateTestInput) => {
      try {
        await updateMutation.mutateAsync({ id, input });
        toast({ title: "Success", description: "Test updated successfully" });
        setEditDialogOpen(false);
        setTestToEdit(null);
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update test",
          variant: "destructive",
        });
        throw err;
      }
    },
    [updateMutation]
  );

  const handleNavigateToTest = useCallback(
    (test: Test) => {
      onNavigateToTest?.(test.id);
    },
    [onNavigateToTest]
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
      <TestList
        tests={tests}
        loading={isLoading}
        error={error as Error | null}
        onTestClick={handleNavigateToTest}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onSearch={handleSearch}
        pagination={serverPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <CreateTestDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateSubmit}
      />

      <EditTestDialog
        open={editDialogOpen && !!testToEdit}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setTestToEdit(null);
          }
        }}
        onSubmit={handleEditSubmit}
        test={testToEdit}
      />
    </>
  );
}

