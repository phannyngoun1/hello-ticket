/**
 * {{EntityName}} Tree Component
 *
 * Displays {{entityPlural}} in a hierarchical tree view with expand/collapse
 */

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FolderTree,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
import { cn, Button, Badge } from "@truths/ui";
import type { {{EntityName}}Tree } from "./types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@truths/ui";

interface {{EntityName}}TreeProps {
  items: {{EntityName}}Tree[];
  onItemClick?: (item: {{EntityName}}Tree) => void;
  onAddChild?: (parent: {{EntityName}}Tree) => void;
  onEdit?: (item: {{EntityName}}Tree) => void;
  onDelete?: (item: {{EntityName}}Tree) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  className?: string;
}

interface TreeNodeProps {
  item: {{EntityName}}Tree;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onItemClick?: (item: {{EntityName}}Tree) => void;
  onAddChild?: (parent: {{EntityName}}Tree) => void;
  onEdit?: (item: {{EntityName}}Tree) => void;
  onDelete?: (item: {{EntityName}}Tree) => void;
}

interface RecursiveTreeNodeProps {
  item: {{EntityName}}Tree;
  level: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onItemClick?: (item: {{EntityName}}Tree) => void;
  onAddChild?: (parent: {{EntityName}}Tree) => void;
  onEdit?: (item: {{EntityName}}Tree) => void;
  onDelete?: (item: {{EntityName}}Tree) => void;
}

function RecursiveTreeNode({
  item,
  level,
  expandedIds,
  onToggle,
  onItemClick,
  onAddChild,
  onEdit,
  onDelete,
}: RecursiveTreeNodeProps) {
  const isExpanded = expandedIds.has(item.id);
  const hasChildren =
    item.has_children ||
    (item.children && item.children.length > 0);

  return (
    <div>
      <TreeNode
        item={item}
        level={level}
        isExpanded={isExpanded}
        onToggle={() => onToggle(item.id)}
        onItemClick={onItemClick}
        onAddChild={onAddChild}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {isExpanded &&
        hasChildren &&
        item.children &&
        item.children.length > 0 && (
          <div>
            {item.children.map((child) => (
              <RecursiveTreeNode
                key={child.id}
                item={child}
                level={level + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onItemClick={onItemClick}
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
  item,
  level,
  isExpanded,
  onToggle,
  onItemClick,
  onAddChild,
  onEdit,
  onDelete,
}: TreeNodeProps) {
  const hasChildren =
    item.has_children ||
    (item.children && item.children.length > 0);
  
  const isActive = item.is_active ?? true;

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
            onClick={() => onItemClick?.(item)}
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
            <FolderTree className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {item.name || item.code}
                </span>
                {!isActive && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    Inactive
                  </Badge>
                )}
              </div>
              {item.description && (
                <span className="text-xs text-muted-foreground truncate block">
                  {item.description}
                </span>
              )}
              {item.children_count > 0 && !item.description && (
                <span className="text-xs text-muted-foreground">
                  {item.children_count} child
                  {item.children_count !== 1 ? "ren" : ""}
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
                    onEdit(item);
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
                    onAddChild(item);
                  }}
                  className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Add Child"
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
                    onDelete(item);
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
          <ContextMenuItem onClick={() => onItemClick?.(item)}>
            View Details
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onEdit?.(item)}>
            Edit
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onAddChild?.(item)}>
            Add Child
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDelete?.(item)}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export function {{EntityName}}Tree({
  items,
  onItemClick,
  onAddChild,
  onEdit,
  onDelete,
  expandedIds: controlledExpandedIds,
  onToggleExpand: controlledOnToggleExpand,
  className,
}: {{EntityName}}TreeProps) {
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
      {items.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No {{entityPlural}} found
        </div>
      ) : (
        items.map((item) => (
          <RecursiveTreeNode
            key={item.id}
            item={item}
            level={0}
            expandedIds={expandedIds}
            onToggle={setExpanded}
            onItemClick={onItemClick}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
