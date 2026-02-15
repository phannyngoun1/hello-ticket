import React from "react";
import { ALIGN_BUTTONS, TOOLBAR_BUTTON_BASE } from "./constants";
import type { ShapeToolboxAlign } from "./types";

interface AlignmentToolbarSectionProps {
  onAlign?: (alignment: ShapeToolboxAlign) => void;
}

export function AlignmentToolbarSection({ onAlign }: AlignmentToolbarSectionProps) {
  return (
    <div className="flex items-center gap-1 border-l pl-2.5">
      <div className="text-xs font-medium text-muted-foreground shrink-0">
        Align:
      </div>
      <div className="flex gap-1">
        {ALIGN_BUTTONS.map(({ id, icon: Icon, title, separatorBefore }) => (
          <React.Fragment key={id}>
            {separatorBefore && (
              <div className="w-px h-5 bg-border shrink-0" aria-hidden />
            )}
            <button
              type="button"
              onClick={() => onAlign?.(id)}
              className={TOOLBAR_BUTTON_BASE}
              title={title}
            >
              <Icon className="h-3.5 w-3.5 transition-transform duration-200" />
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
