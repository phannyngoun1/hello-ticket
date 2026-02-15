/**
 * Event Inventory Viewer – section drill-down breadcrumb with back button
 */

import { cn } from "@truths/ui/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { Section } from "../../layouts/types";

export interface EventInventoryBreadcrumbProps {
  section: Section;
  onBack: () => void;
  className?: string;
}

export function EventInventoryBreadcrumb({
  section,
  onBack,
  className,
}: EventInventoryBreadcrumbProps) {
  return (
    <div
      className={cn(
        "z-10 bg-background/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-md border border-border",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          title="Back to Sections"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <div className="text-xs font-medium text-foreground">
          {section.name}
        </div>
      </div>
    </div>
  );
}
