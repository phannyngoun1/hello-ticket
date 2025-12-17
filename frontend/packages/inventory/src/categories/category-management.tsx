/**
 * Category Management Page
 *
 * Comprehensive UI for managing item categories with hierarchy
 */

import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
} from "@truths/ui";
import { Plus, Search, FolderTree } from "lucide-react";
import { toast } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import { CategoryTree } from "./category-tree";
import { CreateCategoryDialog } from "./create-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import {
  useCategoryTree,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "./use-categories";
import { CategoryService } from "./category-service";
import type {
  ItemCategoryTree,
  CreateItemCategoryInput,
  UpdateItemCategoryInput,
} from "../types";
import { api } from "@truths/api";

interface CategoryManagementProps {
  className?: string;
  service: CategoryService;
}

export function CategoryManagement({
  className,
  service,
}: CategoryManagementProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ItemCategoryTree | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] =
    useState<ItemCategoryTree | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<ItemCategoryTree | null>(
    null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ItemCategoryTree | null>(null);

  // Fetch category tree
  const { data: categoryTree, isLoading, error } = useCategoryTree(service);

  // Debug: Log the data
  useEffect(() => {
    if (categoryTree) {
    }
    if (error) {
      console.error("Category tree error:", error);
    }
  }, [categoryTree, error]);

  // Mutations
  const createMutation = useCreateCategory(service);
  const updateMutation = useUpdateCategory(service);
  const deleteMutation = useDeleteCategory(service);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categoryTree) {
      return [];
    }

    const filterCategories = (
      categories: ItemCategoryTree[]
    ): ItemCategoryTree[] => {
      if (!Array.isArray(categories)) {
        return [];
      }

      return categories
        .map((cat) => {
          const matchesSearch =
            !searchQuery ||
            cat.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cat.name &&
              cat.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (cat.description &&
              cat.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()));

          const children = filterCategories(cat.children || []);

          if (matchesSearch || children.length > 0) {
            return {
              ...cat,
              children,
            };
          }
          return null;
        })
        .filter((cat): cat is ItemCategoryTree => cat !== null);
    };

    return filterCategories(categoryTree);
  }, [categoryTree, searchQuery]);

  const handleCreateCategory = async (input: CreateItemCategoryInput) => {
    try {
      await createMutation.mutateAsync(input);
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setCreateDialogOpen(false);
      setSelectedParent(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: ItemCategoryTree) => {
    setCategoryToEdit(category);
    setEditDialogOpen(true);
  };

  const handleUpdateCategory = async (
    id: string,
    input: UpdateItemCategoryInput
  ) => {
    try {
      await updateMutation.mutateAsync({ id, input });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      setEditDialogOpen(false);
      setCategoryToEdit(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
      throw error; // Re-throw to prevent dialog from closing
    }
  };

  const handleDeleteCategory = (category: ItemCategoryTree) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleAddRootCategory = () => {
    setSelectedParent(null);
    setCreateDialogOpen(true);
  };

  const handleAddChild = (parent: ItemCategoryTree) => {
    setSelectedParent(parent);
    setCreateDialogOpen(true);
  };

  const categoryStats = useMemo(() => {
    if (!categoryTree) return { total: 0, active: 0, inactive: 0 };

    const countCategories = (
      categories: ItemCategoryTree[]
    ): { total: number; active: number; inactive: number } => {
      let stats = { total: 0, active: 0, inactive: 0 };

      categories.forEach((cat) => {
        stats.total++;
        if (cat.is_active) {
          stats.active++;
        } else {
          stats.inactive++;
        }

        const childStats = countCategories(cat.children || []);
        stats.total += childStats.total;
        stats.active += childStats.active;
        stats.inactive += childStats.inactive;
      });

      return stats;
    };

    return countCategories(categoryTree);
  }, [categoryTree]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Category Management
              </CardTitle>
              <CardDescription>
                Manage item categories with hierarchical structure
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddRootCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading categories...
            </div>
          )}
          {error && (
            <div className="text-center py-8 text-destructive">
              Error loading categories: {(error as Error).message}
            </div>
          )}
          {!isLoading && !error && (
            <>
              {categoryTree && categoryTree.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No categories found. Create your first root category to get
                  started.
                </div>
              )}
              {filteredCategories.length > 0 && (
                <CategoryTree
                  categories={filteredCategories}
                  onCategoryClick={(category) => setSelectedCategory(category)}
                  onAddChild={handleAddChild}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                />
              )}
              {categoryTree &&
                categoryTree.length > 0 &&
                filteredCategories.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No categories match your search criteria.
                  </div>
                )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateCategoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateCategory}
        parentCategoryId={selectedParent?.id}
        parentCategoryName={selectedParent?.name}
        forceRoot={!selectedParent}
      />

      {/* Edit Dialog */}
      {categoryToEdit && (
        <EditCategoryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleUpdateCategory}
          category={categoryToEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Category"
        description={
          categoryToDelete
            ? `Are you sure you want to delete the category "${categoryToDelete.name}"? This action cannot be undone and will only succeed if the category has no children and no items.`
            : undefined
        }
        confirmAction={{
          label: "Delete",
          variant: "destructive",
          onClick: confirmDelete,
        }}
      />
    </div>
  );
}
