/**
 * Category Tree Component
 *
 * Displays item categories in a hierarchical tree view with expand/collapse
 */

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderTree,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
import { cn, Button } from "@truths/ui";
import type { ItemCategoryTree } from "../types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@truths/ui";

interface CategoryTreeProps {
  categories: ItemCategoryTree[];
  onCategoryClick?: (category: ItemCategoryTree) => void;
  onAddChild?: (parent: ItemCategoryTree) => void;
  onEdit?: (category: ItemCategoryTree) => void;
  onDelete?: (category: ItemCategoryTree) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  className?: string;
}

const getCategoryIcon = () => {
  return FolderTree;
};

interface TreeNodeProps {
  category: ItemCategoryTree;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onCategoryClick?: (category: ItemCategoryTree) => void;
  onAddChild?: (parent: ItemCategoryTree) => void;
  onEdit?: (category: ItemCategoryTree) => void;
  onDelete?: (category: ItemCategoryTree) => void;
}

interface RecursiveTreeNodeProps {
  category: ItemCategoryTree;
  level: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onCategoryClick?: (category: ItemCategoryTree) => void;
  onAddChild?: (parent: ItemCategoryTree) => void;
  onEdit?: (category: ItemCategoryTree) => void;
  onDelete?: (category: ItemCategoryTree) => void;
}

function RecursiveTreeNode({
  category,
  level,
  expandedIds,
  onToggle,
  onCategoryClick,
  onAddChild,
  onEdit,
  onDelete,
}: RecursiveTreeNodeProps) {
  const isExpanded = expandedIds.has(category.id);
  const hasChildren =
    category.has_children ||
    (category.children && category.children.length > 0);

  return (
    <div>
      <TreeNode
        category={category}
        level={level}
        isExpanded={isExpanded}
        onToggle={() => onToggle(category.id)}
        onCategoryClick={onCategoryClick}
        onAddChild={onAddChild}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {isExpanded &&
        hasChildren &&
        category.children &&
        category.children.length > 0 && (
          <div>
            {category.children.map((child) => (
              <RecursiveTreeNode
                key={child.id}
                category={child}
                level={level + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onCategoryClick={onCategoryClick}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
    </div>
  );
}

function TreeNode({
  category,
  level,
  isExpanded,
  onToggle,
  onCategoryClick,
  onAddChild,
  onEdit,
  onDelete,
}: TreeNodeProps) {
  const Icon = getCategoryIcon();
  const hasChildren =
    category.has_children ||
    (category.children && category.children.length > 0);

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group",
              level > 0 && "ml-4"
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => onCategoryClick?.(category)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="p-0.5 hover:bg-accent rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}
            <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {category.name || category.code}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({category.code})
                </span>
                {category.level > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    Level {category.level}
                  </span>
                )}
                {!category.is_active && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <span className="text-xs text-muted-foreground truncate block">
                  {category.description}
                </span>
              )}
              {category.children_count > 0 && (
                <span className="text-xs text-muted-foreground">
                  {category.children_count} child
                  {category.children_count !== 1 ? "ren" : ""}
                </span>
              )}
            </div>
            {/* Action buttons - shown on hover */}
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(category);
                  }}
                  className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              )}
              {onAddChild && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChild(category);
                  }}
                  className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Add Child Category"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(category);
                  }}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onCategoryClick?.(category)}>
            View Details
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onEdit?.(category)}>
            Edit
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onAddChild?.(category)}>
            Add Child Category
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDelete?.(category)}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export function CategoryTree({
  categories,
  onCategoryClick,
  onAddChild,
  onEdit,
  onDelete,
  expandedIds: controlledExpandedIds,
  onToggleExpand: controlledOnToggleExpand,
  className,
}: CategoryTreeProps) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    new Set()
  );

  const expandedIds = controlledExpandedIds ?? internalExpanded;
  const setExpanded = controlledOnToggleExpand
    ? (id: string) => controlledOnToggleExpand(id)
    : (id: string) => {
        setInternalExpanded((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      };

  return (
    <div className={cn("space-y-1", className)}>
      {categories.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No categories found
        </div>
      ) : (
        categories.map((category) => (
          <RecursiveTreeNode
            key={category.id}
            category={category}
            level={0}
            expandedIds={expandedIds}
            onToggle={setExpanded}
            onCategoryClick={onCategoryClick}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}

