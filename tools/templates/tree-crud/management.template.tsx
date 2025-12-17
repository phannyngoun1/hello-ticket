/**
 * {{EntityName}} Management Page
 *
 * Comprehensive UI for managing {{entityPlural}} with hierarchy
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
import { {{EntityName}}Tree as {{EntityName}}TreeView } from "./{{entity-name}}-tree";
import { Create{{EntityName}}Dialog } from "./create-{{entity-name}}-dialog";
import { Edit{{EntityName}}Dialog } from "./edit-{{entity-name}}-dialog";
import {
  use{{EntityName}}Tree,
  useCreate{{EntityName}},
  useUpdate{{EntityName}},
  useDelete{{EntityName}},
} from "./use-{{entity-plural}}";
import {{{entityName}}Service } from "./index";
import type {
  {{EntityName}}Tree,
  Create{{EntityName}}Input,
  Update{{EntityName}}Input,
} from "./types";

interface {{EntityName}}ManagementProps {
  className?: string;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function {{EntityName}}Management({
  className,
  autoOpenCreate = false,
  onCreateDialogClose,
}: {{EntityName}}ManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] =
    useState<{{EntityName}}Tree | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<{{EntityName}}Tree | null>(null);
  const [itemToEdit, setItemToEdit] =
    useState<{{EntityName}}Tree | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<{{EntityName}}Tree | null>(null);

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
  } = use{{EntityName}}Tree({{entityName}}Service, debouncedSearch);

  // Mutations
  const createMutation = useCreate{{EntityName}}({{entityName}}Service);
  const updateMutation = useUpdate{{EntityName}}({{entityName}}Service);
  const deleteMutation = useDelete{{EntityName}}({{entityName}}Service);



  const handleCreate = async (input: Create{{EntityName}}Input) => {
    try {
      await createMutation.mutateAsync(input);
      toast({
        title: "Success",
        description: "{{EntityName}} created successfully",
      });
      setCreateDialogOpen(false);
      setSelectedParent(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create {{entity-name}}",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: {{EntityName}}Tree) => {
    setItemToEdit(item);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (
    id: string,
    input: Update{{EntityName}}Input
  ) => {
    try {
      await updateMutation.mutateAsync({ id, input });
      toast({
        title: "Success",
        description: "{{EntityName}} updated successfully",
      });
      setEditDialogOpen(false);
      setItemToEdit(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update {{entity-name}}",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = (item: {{EntityName}}Tree) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteMutation.mutateAsync(itemToDelete.id);
      toast({
        title: "Success",
        description: "{{EntityName}} deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete {{entity-name}}",
        variant: "destructive",
      });
    }
  };

  const handleAddRoot = () => {
    setSelectedParent(null);
    setCreateDialogOpen(true);
  };

  const handleAddChild = (parent: {{EntityName}}Tree) => {
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
              {{EntityPlural}}
            </h2>
            <p className="text-muted-foreground">
              Manage {{entityPlural}} hierarchically
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddRoot}>
              <Plus className="mr-2 h-4 w-4" />
              Add {{EntityName}}
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
                Loading {{entityPlural}}...
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-destructive">
                Error loading {{entityPlural}}: {(error as Error).message}
              </div>
            )}
            {!isLoading && !error && (
              <>
                {treeData && treeData.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No {{entityPlural}} found. Create your first one to get started.
                  </div>
                )}
                {treeData && treeData.length > 0 && (
                  <{{EntityName}}TreeView
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
        <Create{{EntityName}}Dialog
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
        <Edit{{EntityName}}Dialog
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
          title="Delete {{EntityName}}"
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
