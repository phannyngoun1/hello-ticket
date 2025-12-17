/**
 * Item Metadata Tab
 *
 * Displays raw item JSON data
 *
 * @author Phanny
 */

import type { Item } from "../../types";

export interface ItemMetadataTabProps {
  item: Item;
}

export function ItemMetadataTab({ item }: ItemMetadataTabProps) {
  return (
    <div className="space-y-2">
      <pre className="rounded-lg bg-muted p-4 text-sm">
        {JSON.stringify(item.attributes, null, 2)}
      </pre>
    </div>
  );
}
