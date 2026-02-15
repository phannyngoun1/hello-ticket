import { Edit, Eye, Trash2 } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { MARKER_ACTION_BUTTON } from "./constants";

interface MarkerActionsSectionProps {
  markerName: string;
  isSection: boolean;
  readOnly: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function MarkerActionsSection({
  markerName,
  isSection,
  readOnly,
  onView,
  onEdit,
  onDelete,
}: MarkerActionsSectionProps) {
  return (
    <div className="flex items-center gap-1.5 ml-auto">
      <span className="text-xs font-medium text-foreground whitespace-nowrap px-2.5 py-1">
        {markerName}
      </span>
      {onView && (
        <button
          type="button"
          onClick={onView}
          className={MARKER_ACTION_BUTTON}
          title={isSection ? "Open section detail" : "View seat details"}
          aria-label={isSection ? "Open section detail" : "View seat details"}
        >
          <Eye className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
      {onEdit && !readOnly && (
        <button
          type="button"
          onClick={onEdit}
          className={MARKER_ACTION_BUTTON}
          title="Click to edit"
        >
          <Edit className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
      {onDelete && !readOnly && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className={cn(
            MARKER_ACTION_BUTTON,
            "hover:bg-destructive hover:border-destructive hover:text-destructive-foreground",
          )}
          title="Delete marker"
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </button>
      )}
    </div>
  );
}
