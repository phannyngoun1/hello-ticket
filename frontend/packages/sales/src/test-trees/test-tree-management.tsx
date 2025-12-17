/**
 * TestTree Management Page
 *
 * Comprehensive UI for managing testTrees with hierarchy
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@truths/ui";
import { Plus, Search, Filter } from "lucide-react";
import { toast } from "@truths/ui";
import { ConfirmationDialog } from "@truths/custom-ui";
import { TestTreeTree as TestTreeTreeView } from "./test-tree-tree";
import { CreateTestTreeDialog } from "./create-test-tree-dialog";
import { EditTestTreeDialog } from "./edit-test-tree-dialog";
import {
  useTestTreeTree,
  useCreateTestTree,
  useUpdateTestTree,
  useDeleteTestTree,
} from "./use-test-trees";
import {testTreeService } from "./index";
import type {
  TestTreeTree,
  CreateTestTreeInput,
  UpdateTestTreeInput,
} from "./types";

interface TestTreeManagementProps {
  className?: string;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function TestTreeManagement({
  className,
  autoOpenCreate = false,
  onCreateDialogClose,
}: TestTreeManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] =
    useState<TestTreeTree | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<TestTreeTree | null>(null);
  const [itemToEdit, setItemToEdit] =
    useState<TestTreeTree | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<TestTreeTree | null>(null);

  useEffect(() => {
    if (autoOpenCreate && !createDialogOpen) {
      setCreateDialogOpen(true);
    }
  }, [autoOpenCreate, createDialogOpen]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch tree with search
  const {
    data: treeData,
    isLoading,
    error,
  } = useTestTreeTree(testTreeService, debouncedSearch);

  // Mutations
  const createMutation = useCreateTestTree(testTreeService);
  const updateMutation = useUpdateTestTree(testTreeService);
  const deleteMutation = useDeleteTestTree(testTreeService);



  const handleCreate = async (input: CreateTestTreeInput) => {
    try {
      await createMutation.mutateAsync(input);
      toast({
        title: "Success",
        description: "TestTree created successfully",
      });
      setCreateDialogOpen(false);
      setSelectedParent(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create test-tree",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: TestTreeTree) => {
    setItemToEdit(item);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (
    id: string,
    input: UpdateTestTreeInput
  ) => {
    try {
      await updateMutation.mutateAsync({ id, input });
      toast({
        title: "Success",
        description: "TestTree updated successfully",
      });
      setEditDialogOpen(false);
      setItemToEdit(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update test-tree",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = (item: TestTreeTree) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteMutation.mutateAsync(itemToDelete.id);
      toast({
        title: "Success",
        description: "TestTree deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test-tree",
        variant: "destructive",
      });
    }
  };

  const handleAddRoot = () => {
    setSelectedParent(null);
    setCreateDialogOpen(true);
  };

  const handleAddChild = (parent: TestTreeTree) => {
    setSelectedParent(parent);
    setCreateDialogOpen(true);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              TestTrees
            </h2>
            <p className="text-muted-foreground">
              Manage testTrees hierarchically
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddRoot}>
              <Plus className="mr-2 h-4 w-4" />
              Add TestTree
            </Button>
          </div>
        </div>

        {/* Tree View */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardDescription>
                  Click on items to expand/collapse. Right-click for more options.
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  placeholder="Search by code or name..."
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
                Loading testTrees...
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-destructive">
                Error loading testTrees: {(error as Error).message}
              </div>
            )}
            {!isLoading && !error && (
              <>
                {treeData && treeData.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No testTrees found. Create your first one to get started.
                  </div>
                )}
                {treeData && treeData.length > 0 && (
                  <TestTreeTreeView
                    items={treeData}
                    onItemClick={(item) => setSelectedItem(item)}
                    onAddChild={handleAddChild}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <CreateTestTreeDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              setSelectedParent(null);
              onCreateDialogClose?.();
            }
          }}
          onSubmit={handleCreate}
          parentId={selectedParent?.id}
          parentName={selectedParent?.name || selectedParent?.code || undefined}
        />

        {/* Edit Dialog */}
        <EditTestTreeDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setItemToEdit(null);
            }
          }}
          onSubmit={handleUpdate}
          item={itemToEdit}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteConfirmOpen}
          onOpenChange={(open) => {
            setDeleteConfirmOpen(open);
            if (!open) {
              setItemToDelete(null);
            }
          }}
          title="Delete TestTree"
          description={
            itemToDelete
              ? `Are you sure you want to delete "${itemToDelete.name || itemToDelete.code}"? This action cannot be undone.`
              : ""
          }
          confirmAction={{
            label: "Delete",
            variant: "destructive",
            onClick: confirmDelete,
            loading: deleteMutation.isPending,
            disabled: deleteMutation.isPending,
          }}
          cancelAction={{
            label: "Cancel",
            variant: "outline",
            disabled: deleteMutation.isPending,
          }}
        />
      </div>
    </div>
  );
}
