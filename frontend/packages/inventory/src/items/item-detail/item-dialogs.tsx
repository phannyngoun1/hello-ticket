/**
 * Item Dialogs Component
 *
 * Dialogs for item actions
 *
 * @author Phanny
 */

import { EditItemDialog } from "../item-entry/edit-item-dialog";
import type { Item, UpdateItemInput } from "../../types";
import type { ItemCategoryTree } from "../../types";

export interface ItemEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (itemId: string, input: UpdateItemInput) => Promise<void>;
  item: Item | null;
  categoryTree: ItemCategoryTree[];
  isCategoryTreeLoading: boolean;
  categoryTreeError: Error | null;
  onReloadCategoryTree: () => void;
}

export function ItemEditDialog({
  open,
  onOpenChange,
  onSubmit,
  item,
  categoryTree,
  isCategoryTreeLoading,
  categoryTreeError,
  onReloadCategoryTree,
}: ItemEditDialogProps) {
  if (!item) return null;

  return (
    <EditItemDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      item={item}
      categoryTree={categoryTree}
      isCategoryTreeLoading={isCategoryTreeLoading}
      categoryTreeError={categoryTreeError}
      onReloadCategoryTree={onReloadCategoryTree}
    />
  );
}
