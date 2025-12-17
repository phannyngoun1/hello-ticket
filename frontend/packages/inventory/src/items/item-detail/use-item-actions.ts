/**
 * Item Actions Hook
 *
 * Determines which actions are available for an item based on its state
 *
 * @author Phanny
 */

import type { Item } from "../../types";

export interface ItemActions {
  canEdit: boolean;
  hasActions: boolean;
}

/**
 * Hook to determine available actions for an item
 */
export function useItemActions(
  item: Item | undefined,
  editable: boolean = true
): ItemActions {
  if (!item) {
    return {
      canEdit: false,
      hasActions: false,
    };
  }

  const canEdit = editable;

  const hasActions = canEdit;

  return {
    canEdit,
    hasActions,
  };
}
