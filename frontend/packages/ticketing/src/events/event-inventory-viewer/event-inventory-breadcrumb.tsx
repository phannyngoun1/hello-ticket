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
        "z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 transition-colors"
          title="Back to Sections"
        >
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </button>
        <div className="text-sm font-medium text-gray-900">
          Section: {section.name}
        </div>
      </div>
    </div>
  );
}
