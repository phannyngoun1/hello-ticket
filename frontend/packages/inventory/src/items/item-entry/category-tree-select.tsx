import { useMemo, useCallback } from "react";
import {
  TreeSelect,
  type TreeSelectNode,
  type TreeSelectRenderNodeArgs,
  type TreeSelectProps,
} from "@truths/custom-ui";
import type { ItemCategoryTree } from "../../types";

interface CategoryTreeSelectProps {
  value?: string | null;
  onChange?: (value: string | undefined) => void;
  categories?: ItemCategoryTree[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

const mapCategoriesToNodes = (
  categories: ItemCategoryTree[] | undefined
): TreeSelectNode<ItemCategoryTree>[] => {
  if (!categories || categories.length === 0) {
    return [];
  }

  return categories.map((category) => ({
    id: category.id,
    label: category.name || category.code,
    description: category.code,
    data: category,
    searchText: [category.name, category.code].filter(Boolean).join(" "),
    children: mapCategoriesToNodes(category.children),
  }));
};

const renderCategoryNodeContent = ({
  node,
}: TreeSelectRenderNodeArgs<ItemCategoryTree>) => {
  const category = node.data;
  const title = category?.name || category?.code || node.label;
  const code = category?.code || node.description;

  return (
    <>
      <span className="font-medium text-foreground">{title}</span>
      {code ? (
        <span className="text-xs text-muted-foreground">{code}</span>
      ) : null}
    </>
  );
};

export function CategoryTreeSelect({
  value,
  onChange,
  categories = [],
  isLoading,
  error,
  onRetry,
  placeholder = "Select category",
  emptyMessage = "No categories found",
  disabled,
}: CategoryTreeSelectProps) {
  const nodes = useMemo(() => mapCategoriesToNodes(categories), [categories]);

  const renderSelectedValue = useCallback<
    NonNullable<TreeSelectProps<ItemCategoryTree>["renderSelectedValue"]>
  >((node, meta) => {
    const category = node.data;
    const code = category?.code || node.description;
    const pathLabel = meta.pathLabels.join(" / ");

    return code ? `${pathLabel} (${code})` : pathLabel;
  }, []);

  return (
    <TreeSelect<ItemCategoryTree>
      value={value ?? undefined}
      onChange={(nodeId) => onChange?.(nodeId)}
      nodes={nodes}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      disabled={disabled}
      searchPlaceholder="Search categories..."
      renderNodeContent={renderCategoryNodeContent}
      renderSelectedValue={renderSelectedValue}
      allowClear
      maxHeight={256}
    />
  );
}
