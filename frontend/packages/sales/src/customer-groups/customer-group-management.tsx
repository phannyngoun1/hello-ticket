/**
 * CustomerGroup Management Page
 *
 * Comprehensive UI for managing customerGroups with hierarchy
 */

import { useEffect, useState, useMemo } from "react";
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
import { cn } from "@truths/ui/lib/utils";
import { CustomerGroupTree as CustomerGroupTreeView } from "./customer-group-tree";
import { CreateCustomerGroupDialog } from "./create-customer-group-dialog";
import { EditCustomerGroupDialog } from "./edit-customer-group-dialog";
import {
  useCustomerGroupTree,
  useCreateCustomerGroup,
  useUpdateCustomerGroup,
  useDeleteCustomerGroup,
} from "./use-customer-groups";
import { customerGroupService } from "./index";
import type {
  CustomerGroupTree,
  CreateCustomerGroupInput,
  UpdateCustomerGroupInput,
} from "./types";

interface CustomerGroupManagementProps {
  className?: string;
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function CustomerGroupManagement({
  className,
  autoOpenCreate = false,
  onCreateDialogClose,
}: CustomerGroupManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] =
    useState<CustomerGroupTree | null>(null);
  const [selectedItem, setSelectedItem] = useState<CustomerGroupTree | null>(
    null
  );
  const [itemToEdit, setItemToEdit] = useState<CustomerGroupTree | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CustomerGroupTree | null>(
    null
  );

  useEffect(() => {
    if (autoOpenCreate && !createDialogOpen) {
      setCreateDialogOpen(true);
    }
  }, [autoOpenCreate, createDialogOpen]);

  // Fetch tree
  const {
    data: treeData,
    isLoading,
    error,
  } = useCustomerGroupTree(customerGroupService);

  // Mutations
  const createMutation = useCreateCustomerGroup(customerGroupService);
  const updateMutation = useUpdateCustomerGroup(customerGroupService);
  const deleteMutation = useDeleteCustomerGroup(customerGroupService);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!treeData) return [];

    const filterItems = (items: CustomerGroupTree[]): CustomerGroupTree[] => {
      return items
        .map((item) => {
          const matchesSearch =
            !searchQuery ||
            item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.name &&
              item.name.toLowerCase().includes(searchQuery.toLowerCase()));

          const children = filterItems(item.children || []);

          if (matchesSearch || children.length > 0) {
            return {
              ...item,
              children,
            };
          }
          return null;
        })
        .filter((item): item is CustomerGroupTree => item !== null);
    };

    return filterItems(treeData);
  }, [treeData, searchQuery]);

  const handleCreate = async (input: CreateCustomerGroupInput) => {
    try {
      await createMutation.mutateAsync(input);
      toast({
        title: "Success",
        description: "CustomerGroup created successfully",
      });
      setCreateDialogOpen(false);
      setSelectedParent(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer-group",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: CustomerGroupTree) => {
    setItemToEdit(item);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (id: string, input: UpdateCustomerGroupInput) => {
    try {
      await updateMutation.mutateAsync({ id, input });
      toast({
        title: "Success",
        description: "CustomerGroup updated successfully",
      });
      setEditDialogOpen(false);
      setItemToEdit(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer-group",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = (item: CustomerGroupTree) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteMutation.mutateAsync(itemToDelete.id);
      toast({
        title: "Success",
        description: "CustomerGroup deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer-group",
        variant: "destructive",
      });
    }
  };

  const handleAddRoot = () => {
    setSelectedParent(null);
    setCreateDialogOpen(true);
  };

  const handleAddChild = (parent: CustomerGroupTree) => {
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
              CustomerGroups
            </h2>
            <p className="text-muted-foreground">
              Manage customerGroups hierarchically
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              onClick={handleAddRoot}
              size="sm"
              className={cn("h-8 px-2 text-xs")}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Customer Group
            </Button>
          </div>
        </div>

        {/* Tree View */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardDescription>
                  Click on items to expand/collapse. Right-click for more
                  options.
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
                Loading customerGroups...
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-destructive">
                Error loading customerGroups: {(error as Error).message}
              </div>
            )}
            {!isLoading && !error && (
              <>
                {treeData && treeData.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No customerGroups found. Create your first one to get
                    started.
                  </div>
                )}
                {filteredItems.length > 0 && (
                  <CustomerGroupTreeView
                    items={filteredItems}
                    onItemClick={(item) => setSelectedItem(item)}
                    onAddChild={handleAddChild}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                )}
                {treeData &&
                  treeData.length > 0 &&
                  filteredItems.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No customerGroups match your search criteria.
                    </div>
                  )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <CreateCustomerGroupDialog
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
        <EditCustomerGroupDialog
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
          title="Delete CustomerGroup"
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
