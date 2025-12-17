/**
 * Item List Container
 *
 * Container component that integrates ItemList with data fetching and mutations
 *
 * @author Phanny
 */

import React, { useState, useCallback, useMemo } from "react";
import { ItemList } from "./item-list";
import {
  useItems,
  useDeleteItem,
  useCreateItem,
  useUpdateItem,
} from "../use-items";
import { useItemService } from "../item-provider";
import { ItemFilter, Item } from "../../types";
import { Pagination } from "@truths/shared";
import { CreateItemDialog } from "../item-entry/create-item-dialog";
import { EditItemDialog } from "../item-entry/edit-item-dialog";
import { toast } from "@truths/ui";
import { CategoryService } from "../../categories/category-service";
import { useCategoryTree } from "../../categories/use-categories";
import { api } from "@truths/api";

export interface ItemListContainerProps {
  onNavigateToItem?: (itemId: string) => void;
  onNavigateToCreate?: () => void;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function ItemListContainer({
  onNavigateToItem,
  onNavigateToCreate,
  autoOpenCreate,
  onCreateDialogClose,
}: ItemListContainerProps) {
  const itemService = useItemService();
  const categoryService = useMemo(
    () =>
      new CategoryService({
        apiClient: api,
        endpoints: {
          categories: "/api/v1/inventory/categories",
        },
      }),
    []
  );

  const {
    data: categoryTreeData,
    isLoading: isCategoryTreeLoading,
    error: categoryTreeError,
    refetch: refetchCategoryTree,
  } = useCategoryTree(categoryService);

  const categoryTree = categoryTreeData ?? [];
  const [filter, setFilter] = useState<ItemFilter>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  const { data, isLoading, error } = useItems(itemService, {
    filter,
    pagination,
  });

  const createMutation = useCreateItem(itemService);
  const updateMutation = useUpdateItem(itemService);
  const deleteMutation = useDeleteItem(itemService);

  const items = data?.data || [];
  const paginationData = data?.pagination;

  const handleCreate = useCallback(() => {
    if (onNavigateToCreate) {
      onNavigateToCreate();
    } else {
      // Update URL to include action=create without reloading
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
    setCreateDialogOpen(true);
  }, [onNavigateToCreate]);

  // Open the create dialog only when autoOpenCreate transitions from false -> true
  const prevAutoOpenRef = React.useRef(false);
  React.useEffect(() => {
    const wasAutoOpen = prevAutoOpenRef.current;
    if (autoOpenCreate && !wasAutoOpen) {
      setCreateDialogOpen(true);
    }
    prevAutoOpenRef.current = !!autoOpenCreate;
  }, [autoOpenCreate]);

  const handleEdit = useCallback((item: Item) => {
    setItemToEdit(item);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (item: Item) => {
      try {
        await deleteMutation.mutateAsync(item.id);
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to delete item",
          variant: "destructive",
        });
      }
    },
    [deleteMutation]
  );

  const handleSearch = useCallback((query: string) => {
    setFilter((prev) => ({ ...prev, search: query || undefined }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
  }, []);

  const handleFilter = useCallback((newFilter: ItemFilter) => {
    setFilter(newFilter);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const handleCreateSubmit = useCallback(
    async (input: Parameters<typeof itemService.createItem>[0]) => {
      try {
        await createMutation.mutateAsync(input);
        toast({
          title: "Success",
          description: "Item created successfully",
        });
        // Clear ?action=create if present, then close
        try {
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.get("action") === "create") {
            currentUrl.searchParams.delete("action");
            const newUrl = `${currentUrl.pathname}${currentUrl.searchParams.toString() ? `?${currentUrl.searchParams.toString()}` : ""}`;
            window.history.replaceState({}, "", newUrl);
          }
        } catch {
          // ignore URL errors
        }
        setCreateDialogOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to create item",
          variant: "destructive",
        });
        throw error; // Re-throw to let dialog handle it
      }
    },
    [createMutation]
  );

  const handleEditSubmit = useCallback(
    async (id: string, input: Parameters<typeof itemService.updateItem>[1]) => {
      try {
        await updateMutation.mutateAsync({ id, input });
        toast({
          title: "Success",
          description: "Item updated successfully",
        });
        setEditDialogOpen(false);
        setItemToEdit(null);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to update item",
          variant: "destructive",
        });
        throw error; // Re-throw to let dialog handle it
      }
    },
    [updateMutation]
  );

  return (
    <>
      <ItemList
        items={items}
        loading={isLoading}
        error={error}
        onItemClick={(item) => onNavigateToItem?.(item.id)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onSearch={handleSearch}
        onFilter={handleFilter}
        filter={filter}
        pagination={
          paginationData
            ? {
                page: pagination.page,
                pageSize: pagination.pageSize,
                total: paginationData.total,
                totalPages: paginationData.totalPages,
              }
            : undefined
        }
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        showSKU
        showType
        showUsage
        showStatus
        showActions
      />

      <CreateItemDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          // Update local state first to avoid immediate reopen loops
          setCreateDialogOpen(open);

          if (!open) {
            // Clear ?action=create if present, then notify parent
            try {
              const currentUrl = new URL(window.location.href);
              if (currentUrl.searchParams.get("action") === "create") {
                currentUrl.searchParams.delete("action");
                const newUrl = `${currentUrl.pathname}${currentUrl.searchParams.toString() ? `?${currentUrl.searchParams.toString()}` : ""}`;
                window.history.replaceState({}, "", newUrl);
              }
            } catch {
              // ignore URL errors
            }

            onCreateDialogClose?.();
          }
        }}
        onSubmit={handleCreateSubmit}
        categoryTree={categoryTree}
        isCategoryTreeLoading={isCategoryTreeLoading}
        categoryTreeError={categoryTreeError as Error | null}
        onReloadCategoryTree={refetchCategoryTree}
      />

      {itemToEdit && (
        <EditItemDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setItemToEdit(null);
          }}
          onSubmit={handleEditSubmit}
          item={itemToEdit}
          categoryTree={categoryTree}
          isCategoryTreeLoading={isCategoryTreeLoading}
          categoryTreeError={categoryTreeError as Error | null}
          onReloadCategoryTree={refetchCategoryTree}
        />
      )}
    </>
  );
}
