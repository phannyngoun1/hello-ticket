/**
 * Item List Component
 *
 * Display and manage items in a table with search, filter, and actions.
 * Follows the same design philosophy as UserList using DataTable.
 *
 * @author Phanny
 */

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@truths/ui";
import {
  ConfirmationDialog,
  createTextColumn,
  createIdentifiedColumn,
  createActionsColumn,
  DataTable,
} from "@truths/custom-ui";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { useDensityStyles } from "@truths/utils";
import { Item, ItemFilter } from "../../types";
import { Pagination } from "@truths/shared";

export interface ItemListProps {
  className?: string;
  items?: Item[];
  loading?: boolean;
  error?: Error | null;
  filter?: ItemFilter;
  pagination?: Pagination;
  showCode?: boolean;
  showSKU?: boolean;
  showType?: boolean;
  showUsage?: boolean;
  showStatus?: boolean;
  showActions?: boolean;
  onItemClick?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filter: ItemFilter) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (item: Item) => React.ReactNode;
}

export function ItemList({
  className,
  items = [],
  loading = false,
  showCode = true,
  showSKU = true,
  showType = true,
  showUsage = true,
  showStatus = true,
  showActions = true,
  pagination,
  filter: initialFilter,
  onItemClick,
  onEdit,
  onDelete,
  onCreate,
  onSearch,
  onFilter,
  onPageChange,
  onPageSizeChange,
  customActions,
}: ItemListProps) {
  const [currentFilter, setCurrentFilter] = useState<ItemFilter>(
    initialFilter || {}
  );

  // Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleFilterReset = () => {
    const emptyFilter: ItemFilter = {};
    setCurrentFilter(emptyFilter);
    onFilter?.(emptyFilter);
  };

  const handleResetFilters = () => {
    handleFilterReset();
  };

  const handleFilterClick = () => {
    // TODO: Implement filter sheet when needed
  };

  const hasActiveFilters = Object.values(currentFilter).some(
    (value) => value !== undefined && value !== ""
  );

  const getItemInitials = (item: Item): string => {
    const name = item.name || "";
    const lettersOnly = name.replace(/[^a-zA-Z]/g, "");
    if (lettersOnly.length >= 2) return lettersOnly.slice(0, 2).toUpperCase();
    if (name.length >= 2) return name.slice(0, 2).toUpperCase();
    if (name.length === 1) return name[0].toUpperCase();
    return "?";
  };

  // Status badge component with density support
  const StatusBadge = ({ active }: { active: boolean }) => {
    const density = useDensityStyles();
    const colors: Record<string, string> = {
      active: "text-muted-foreground",
      inactive: "text-muted-foreground",
    };
    const status = active ? "active" : "inactive";
    return (
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "capitalize",
            colors[status],
            density.textSize,
            "font-normal"
          )}
        >
          {status}
        </span>
      </div>
    );
  };

  // Type badge component
  const TypeBadge = ({ type }: { type: string }) => {
    const density = useDensityStyles();
    return (
      <Badge
        variant="outline"
        className={cn(
          "capitalize",
          density.textSize,
          "text-muted-foreground",
          "font-normal"
        )}
      >
        {type.replace(/_/g, " ")}
      </Badge>
    );
  };

  // Usage badge component
  const UsageBadge = ({ usage }: { usage: string }) => {
    const density = useDensityStyles();
    return (
      <Badge
        variant="outline"
        className={cn(
          "capitalize",
          density.textSize,
          "text-muted-foreground",
          "font-normal"
        )}
      >
        {usage.replace(/_/g, " ")}
      </Badge>
    );
  };

  const density = useDensityStyles();

  // Create columns based on props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<Item, any>[] = [
    createIdentifiedColumn<Item>({
      getDisplayName: (item: Item) => item.code || "",
      getInitials: (item: Item) => getItemInitials(item),
      header: "Code",
      showAvatar: false,
      onClick: onItemClick
        ? (item: Item) => {
            onItemClick(item);
          }
        : undefined,
      size: 100,
      additionalOptions: {
        id: "code",
      },
    }),
    ...(showCode
      ? [
          createTextColumn<Item>({
            accessorKey: "name",
            header: "Name",

            cell: (info) => {
              const name = info.getValue() as string | undefined;
              return (
                <span className={cn("text-muted-foreground", density.textSize)}>
                  {name || "-"}
                </span>
              );
            },
          }),
        ]
      : []),
    ...(showSKU
      ? [
          createTextColumn<Item>({
            accessorKey: "sku",
            header: "SKU",
            size: 150,
            cell: (info) => {
              const sku = info.getValue() as string | undefined;
              return (
                <span className={cn("text-muted-foreground", density.textSize)}>
                  {sku || "-"}
                </span>
              );
            },
          }),
        ]
      : []),
    ...(showType
      ? [
          createTextColumn<Item>({
            accessorKey: "item_type",
            header: "Type",
            size: 130,
            cell: (info) => {
              const type = info.getValue() as string;
              return <TypeBadge type={type} />;
            },
          }),
        ]
      : []),
    ...(showUsage
      ? [
          createTextColumn<Item>({
            accessorKey: "item_usage",
            header: "Usage",
            size: 120,
            cell: (info) => {
              const usage = info.getValue() as string;
              return <UsageBadge usage={usage} />;
            },
          }),
        ]
      : []),
    createTextColumn<Item>({
      accessorKey: "default_uom",
      header: "UoM",
      size: 80,
      cell: (info) => {
        const uom = info.getValue() as string;
        return (
          <span className={cn("text-muted-foreground", density.textSize)}>
            {uom}
          </span>
        );
      },
    }),
    ...(showStatus
      ? [
          createTextColumn<Item>({
            accessorKey: "active",
            header: "Status",
            size: 100,
            cell: (info) => {
              const active = info.getValue() as boolean;
              return <StatusBadge active={active} />;
            },
          }),
        ]
      : []),
    ...(showActions
      ? [
          createActionsColumn<Item>({
            customActions: customActions,
            actions: [
              ...(onEdit
                ? [
                    {
                      icon: Edit,
                      onClick: (item: Item) => {
                        onEdit(item);
                      },
                      title: "Edit",
                      className:
                        "h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors",
                    },
                  ]
                : []),
              ...(onDelete
                ? [
                    {
                      icon: Trash2,
                      onClick: (item: Item) => {
                        setSelectedItem(item);
                        setDeleteConfirmOpen(true);
                      },
                      title: "Delete",
                      className:
                        "h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors",
                    },
                  ]
                : []),
            ],
          }),
        ]
      : []),
  ];

  // Use DataTable with custom columns
  return (
    <div className={cn("w-full", className)}>
      <DataTable<Item>
        data={items}
        columns={columns}
        useDefaultColumns={false}
        title="Items"
        description="Manage and view inventory items"
        onCreate={onCreate}
        onFilterClick={handleFilterClick}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        onSearch={onSearch}
        manualFiltering={true}
        loading={loading}
        // Enable server-side pagination in the table and wire handlers
        manualPagination={Boolean(pagination && onPageChange)}
        serverPagination={
          pagination
            ? {
                page: pagination.page,
                pageSize: pagination.pageSize,
                total: pagination.total,
                totalPages: pagination.totalPages,
              }
            : undefined
        }
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Item"
        description={
          selectedItem
            ? `Are you sure you want to delete "${selectedItem.name || selectedItem.sku || selectedItem.id}"? This action cannot be undone.`
            : "Are you sure you want to delete this item?"
        }
        confirmAction={{
          label: "Delete",
          onClick: () => {
            if (selectedItem && onDelete) {
              onDelete(selectedItem);
            }
            setDeleteConfirmOpen(false);
            setSelectedItem(null);
          },
          variant: "destructive",
        }}
        cancelAction={{
          label: "Cancel",
          onClick: () => {
            setDeleteConfirmOpen(false);
            setSelectedItem(null);
          },
        }}
      />
    </div>
  );
}
