import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Input,
  Separator,
  Skeleton,
  cn,
} from "@truths/ui";
import { ChevronRight, ChevronDown, X, Check } from "lucide-react";

export interface TreeSelectNode<T = unknown> {
  id: string;
  label: string;
  description?: string;
  children?: TreeSelectNode<T>[];
  data?: T;
  searchText?: string;
}

interface FlattenedTreeNode<T = unknown> {
  id: string;
  depth: number;
  pathLabels: string[];
  parentId?: string;
  hasChildren: boolean;
  node: TreeSelectNode<T>;
}

export interface TreeSelectRenderNodeArgs<T = unknown> {
  node: TreeSelectNode<T>;
  depth: number;
  isSelected: boolean;
  isFocused: boolean;
  matchesHighlight: boolean;
}

export interface TreeSelectProps<T = unknown> {
  value?: string | null;
  onChange?: (value: string | undefined, node?: TreeSelectNode<T>) => void;
  nodes?: TreeSelectNode<T>[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  allowClear?: boolean;
  searchPlaceholder?: string;
  renderNodeContent?: (args: TreeSelectRenderNodeArgs<T>) => ReactNode;
  renderSelectedValue?: (
    node: TreeSelectNode<T>,
    meta: FlattenedTreeNode<T>
  ) => ReactNode;
  getNodeSearchText?: (node: TreeSelectNode<T>) => string;
  defaultExpandedIds?: string[];
  triggerClassName?: string;
  contentClassName?: string;
  maxHeight?: number;
}

const flattenTree = <T,>(
  nodes: TreeSelectNode<T>[] | undefined,
  depth = 0,
  parentPath: string[] = [],
  parentId?: string
): Array<FlattenedTreeNode<T>> => {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  return nodes.flatMap((node) => {
    const pathLabels = [...parentPath, node.label];

    return [
      {
        id: node.id,
        depth,
        pathLabels,
        parentId,
        hasChildren: (node.children?.length ?? 0) > 0,
        node,
      },
      ...flattenTree(node.children, depth + 1, pathLabels, node.id),
    ];
  });
};

interface InternalTreeNodeProps<T = unknown> {
  node: TreeSelectNode<T>;
  depth: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  selectedId?: string | null;
  disabled?: boolean;
  highlight?: string;
  renderNodeContent?: (args: TreeSelectRenderNodeArgs<T>) => ReactNode;
  registerNodeRef: (id: string, node: HTMLButtonElement | null) => void;
  onFocusNode: (id: string) => void;
  focusedId?: string | null;
  lookup: Record<string, FlattenedTreeNode<T>>;
  getNodeSearchText: (node: TreeSelectNode<T>) => string;
}

function InternalTreeNode<T>({
  node,
  depth,
  expandedIds,
  toggleExpand,
  onSelect,
  selectedId,
  disabled,
  highlight,
  renderNodeContent,
  registerNodeRef,
  onFocusNode,
  focusedId,
  lookup,
  getNodeSearchText,
}: InternalTreeNodeProps<T>) {
  const meta = lookup[node.id];
  const hasChildren = meta?.hasChildren ?? false;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isFocused = focusedId === node.id;
  const matchesHighlight = highlight
    ? getNodeSearchText(node).toLowerCase().includes(highlight)
    : false;

  const handleRef = useCallback(
    (ref: HTMLButtonElement | null) => {
      registerNodeRef(node.id, ref);
    },
    [node.id, registerNodeRef]
  );

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center rounded-md transition-colors",
          (isSelected || isFocused) && "bg-muted",
          disabled && "opacity-60"
        )}
        style={{
          paddingLeft: depth * 16 + 8,
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="mr-1 flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
            onClick={() => toggleExpand(node.id)}
            disabled={disabled}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="mr-1 h-6 w-6" />
        )}

        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm",
            !disabled && "hover:bg-accent",
            matchesHighlight && !isSelected && "bg-accent/60"
          )}
          onClick={() => onSelect(node.id)}
          disabled={disabled}
          ref={handleRef}
          onFocus={() => onFocusNode(node.id)}
          aria-current={isSelected ? "true" : undefined}
        >
          <div className="flex flex-col">
            {renderNodeContent ? (
              renderNodeContent({
                node,
                depth,
                isSelected,
                isFocused,
                matchesHighlight,
              })
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {node.label}
                </span>
                {node.description ? (
                  <span className="text-xs text-muted-foreground">
                    {node.description}
                  </span>
                ) : null}
              </>
            )}
          </div>
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.children?.map((child) => (
            <InternalTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onSelect={onSelect}
              selectedId={selectedId}
              disabled={disabled}
              highlight={highlight}
              renderNodeContent={renderNodeContent}
              registerNodeRef={registerNodeRef}
              onFocusNode={onFocusNode}
              focusedId={focusedId}
              lookup={lookup}
              getNodeSearchText={getNodeSearchText}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeSelect<T = unknown>({
  value,
  onChange,
  nodes = [],
  isLoading,
  error,
  onRetry,
  placeholder = "Select",
  emptyMessage = "No options found",
  disabled,
  allowClear = true,
  searchPlaceholder = "Search...",
  renderNodeContent,
  renderSelectedValue,
  getNodeSearchText,
  defaultExpandedIds,
  triggerClassName,
  contentClassName,
  maxHeight = 256,
}: TreeSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds)
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const nodeRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const registerNodeRef = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) {
        nodeRefs.current.set(id, node);
      } else {
        nodeRefs.current.delete(id);
      }
    },
    []
  );

  const flattenedNodes = useMemo(() => flattenTree(nodes), [nodes]);

  const lookup = useMemo(() => {
    return flattenedNodes.reduce<Record<string, FlattenedTreeNode<T>>>(
      (acc, item) => {
        acc[item.id] = item;
        return acc;
      },
      {}
    );
  }, [flattenedNodes]);

  const effectiveGetNodeSearchText = useCallback(
    (node: TreeSelectNode<T>) => {
      if (getNodeSearchText) {
        return getNodeSearchText(node);
      }
      const base = [node.label, node.description].filter(Boolean).join(" ");
      if (node.searchText) {
        return `${base} ${node.searchText}`.trim();
      }
      return base;
    },
    [getNodeSearchText]
  );

  useEffect(() => {
    if (!nodes || nodes.length === 0) {
      return;
    }

    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (!defaultExpandedIds || defaultExpandedIds.length === 0) {
        nodes.forEach((node) => {
          next.add(node.id);
        });
      }

      return next;
    });
  }, [nodes, defaultExpandedIds]);

  useEffect(() => {
    if (!open) {
      setFocusedId(null);
    }
  }, [open]);

  const selectedMeta = value ? lookup[value] : undefined;

  const selectedLabel = useMemo(() => {
    if (!value || !selectedMeta) {
      return undefined;
    }

    if (renderSelectedValue) {
      return renderSelectedValue(selectedMeta.node, selectedMeta);
    }

    return selectedMeta.pathLabels.join(" / ");
  }, [renderSelectedValue, selectedMeta, value]);

  const handleSelect = useCallback(
    (nodeId: string) => {
      const meta = lookup[nodeId];
      onChange?.(nodeId, meta?.node);
      setOpen(false);
    },
    [lookup, onChange]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const collapseNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const highlight = search.trim().toLowerCase();
  const hasSearch = highlight.length > 0;

  const filteredIds = useMemo(() => {
    if (!hasSearch) return new Set<string>();

    return new Set(
      flattenedNodes
        .filter((item) =>
          effectiveGetNodeSearchText(item.node)
            .toLowerCase()
            .includes(highlight)
        )
        .map((item) => item.id)
    );
  }, [effectiveGetNodeSearchText, flattenedNodes, highlight, hasSearch]);

  const doesNodeMatchFilter = useCallback(
    (node: TreeSelectNode<T>): boolean => {
      if (filteredIds.has(node.id)) {
        return true;
      }

      return (
        node.children?.some((child) => doesNodeMatchFilter(child)) ?? false
      );
    },
    [filteredIds]
  );

  const shouldDisplayNode = useCallback(
    (node: TreeSelectNode<T>) => {
      return hasSearch ? doesNodeMatchFilter(node) : true;
    },
    [doesNodeMatchFilter, hasSearch]
  );

  const visibleNodes = useMemo(() => {
    const results: Array<{ id: string; depth: number }> = [];

    const walk = (tree: TreeSelectNode<T>[] | undefined, depth: number) => {
      if (!tree) return;

      tree.forEach((node) => {
        if (!shouldDisplayNode(node)) {
          return;
        }

        results.push({ id: node.id, depth });

        if (expandedIds.has(node.id)) {
          walk(node.children, depth + 1);
        }
      });
    };

    walk(nodes, 0);
    return results;
  }, [expandedIds, nodes, shouldDisplayNode]);

  useEffect(() => {
    if (!hasSearch) return;

    setExpandedIds((prev) => {
      const next = new Set(prev);

      const expandMatchingBranches = (tree?: TreeSelectNode<T>[]) => {
        if (!tree) return;

        tree.forEach((node) => {
          if (doesNodeMatchFilter(node)) {
            next.add(node.id);
          }
          if (node.children?.length) {
            expandMatchingBranches(node.children);
          }
        });
      };

      expandMatchingBranches(nodes);
      return next;
    });
  }, [nodes, doesNodeMatchFilter, hasSearch]);

  useEffect(() => {
    if (!open) {
      setFocusedId(null);
      return;
    }

    if (!visibleNodes.length) {
      setFocusedId(null);
      return;
    }

    setFocusedId((current) => {
      if (current && visibleNodes.some((node) => node.id === current)) {
        return current;
      }

      if (value && visibleNodes.some((node) => node.id === value)) {
        return value;
      }

      return visibleNodes[0]?.id ?? null;
    });
  }, [open, visibleNodes, value]);

  useEffect(() => {
    if (!open || !focusedId) return;
    const node = nodeRefs.current.get(focusedId);
    if (node) {
      node.focus();
    }
  }, [open, focusedId]);

  const clearSelection = useCallback(() => {
    onChange?.(undefined, undefined);
    setOpen(false);
  }, [onChange]);

  const focusSearchInput = useCallback(() => {
    const input = searchInputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const end = input.value.length;
    if (typeof input.setSelectionRange === "function") {
      input.setSelectionRange(end, end);
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.getAttribute("contenteditable") === "true");

      if (!visibleNodes.length) {
        return;
      }

      const currentIndex = focusedId
        ? visibleNodes.findIndex((node) => node.id === focusedId)
        : -1;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
        const clamped = Math.min(nextIndex, visibleNodes.length - 1);
        const targetNode = visibleNodes[clamped];
        if (targetNode) {
          setFocusedId(targetNode.id);
        }
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const prevIndex =
          currentIndex >= 0 ? currentIndex - 1 : visibleNodes.length - 1;
        const clamped = Math.max(prevIndex, 0);
        const targetNode = visibleNodes[clamped];
        if (targetNode) {
          setFocusedId(targetNode.id);
        }
        return;
      }

      if (isTextInput) {
        return;
      }

      if (event.key === "ArrowRight" && focusedId) {
        const meta = lookup[focusedId];
        if (!meta) return;
        if (meta.hasChildren) {
          if (!expandedIds.has(focusedId)) {
            event.preventDefault();
            expandNode(focusedId);
            const firstChild = meta.node.children?.find((child) =>
              shouldDisplayNode(child)
            );
            if (firstChild) {
              setFocusedId(firstChild.id);
            }
          } else {
            const firstChild = meta.node.children?.find((child) =>
              shouldDisplayNode(child)
            );
            if (firstChild) {
              event.preventDefault();
              setFocusedId(firstChild.id);
            }
          }
        }
        return;
      }

      if (event.key === "ArrowLeft" && focusedId) {
        const meta = lookup[focusedId];
        if (!meta) return;
        if (expandedIds.has(focusedId)) {
          event.preventDefault();
          collapseNode(focusedId);
          return;
        }
        if (meta.parentId) {
          event.preventDefault();
          setFocusedId(meta.parentId);
        }
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        focusSearchInput();
        setSearch((prev) => prev.slice(0, -1));
        return;
      }

      const isPrintableKey =
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        event.key !== " ";

      if (isPrintableKey) {
        event.preventDefault();
        focusSearchInput();
        setSearch((prev) => `${prev}${event.key}`);
        return;
      }

      if ((event.key === "Enter" || event.key === " ") && focusedId) {
        event.preventDefault();
        handleSelect(focusedId);
      }
    },
    [
      focusSearchInput,
      collapseNode,
      expandNode,
      expandedIds,
      focusedId,
      handleSelect,
      lookup,
      shouldDisplayNode,
      visibleNodes,
    ]
  );

  const renderTree = useCallback(
    (tree: TreeSelectNode<T>[] | undefined, depth = 0): ReactNode => {
      if (!tree || tree.length === 0) return null;

      return tree.map((node) => {
        const shouldRender = shouldDisplayNode(node);

        if (!shouldRender) {
          return <div key={node.id} className="hidden" aria-hidden="true" />;
        }

        return (
          <InternalTreeNode
            key={node.id}
            node={node}
            depth={depth}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            onSelect={handleSelect}
            selectedId={value ?? undefined}
            disabled={disabled}
            highlight={highlight}
            renderNodeContent={renderNodeContent}
            registerNodeRef={registerNodeRef}
            onFocusNode={setFocusedId}
            focusedId={focusedId}
            lookup={lookup}
            getNodeSearchText={effectiveGetNodeSearchText}
          />
        );
      });
    },
    [
      shouldDisplayNode,
      expandedIds,
      toggleExpand,
      handleSelect,
      value,
      disabled,
      highlight,
      renderNodeContent,
      registerNodeRef,
      focusedId,
      lookup,
      effectiveGetNodeSearchText,
    ]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedLabel && "text-muted-foreground",
            triggerClassName
          )}
          disabled={disabled}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          {value && !disabled && allowClear ? (
            <span
              role="button"
              tabIndex={-1}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                clearSelection();
              }}
              className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-accent"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : (
            <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[320px] p-0", contentClassName)}
        sideOffset={4}
        align="start"
        onKeyDown={handleKeyDown}
      >
        <div className="p-3">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-3"
            autoFocus
            ref={searchInputRef}
          />

          <Separator className="mb-3" />

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : error ? (
            <div className="space-y-2 text-sm text-destructive">
              <p>Failed to load data.</p>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={() => onRetry()}>
                  Retry
                </Button>
              )}
            </div>
          ) : nodes && nodes.length > 0 ? (
            <div className="overflow-y-auto pr-1" style={{ maxHeight }}>
              {renderTree(nodes)}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{emptyMessage}</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

TreeSelect.displayName = "TreeSelect";
