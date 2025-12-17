/**
 * Item Tabs Component
 *
 * Manages tab navigation for item detail view
 *
 * @author Phanny
 */

import React from "react";
import { cn } from "@truths/ui/lib/utils";
import { Info, Package, Settings, Database } from "lucide-react";
import type { Item } from "../../types";

export type ItemTab = "overview" | "classification" | "tracking" | "metadata";

export interface ItemTabsProps {
  activeTab: ItemTab;
  onTabChange: (tab: ItemTab) => void;
  item: Item;
  showMetadata?: boolean;
  hasMetadata: boolean;
}

export function ItemTabs({
  activeTab,
  onTabChange,
  item,
  showMetadata = false,
  hasMetadata,
}: ItemTabsProps) {
  return (
    <div className="border-b mb-4">
      <div className="flex gap-4">
        <button
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onTabChange("overview")}
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Overview
          </span>
        </button>
        <button
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "classification"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onTabChange("classification")}
        >
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Classification
          </span>
        </button>
        <button
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "tracking"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onTabChange("tracking")}
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Tracking & Configuration
          </span>
        </button>
        {(showMetadata || hasMetadata) && (
          <button
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "metadata"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onTabChange("metadata")}
          >
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Metadata
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
