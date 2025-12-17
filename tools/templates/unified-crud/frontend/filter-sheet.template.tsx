/**
 * {{EntityName}} Filter Sheet
 *
 * Component for filtering {{entity-plural}} with advanced filters
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Button,
  Input,
  Label,
} from "@truths/ui";
import { Filter, X } from "lucide-react";
import { {{EntityName}}Filter } from "./types";
import { useState, useEffect } from "react";

export interface {{EntityName}}FilterSheetProps {
  open: boolean;
  filter: {{EntityName}}Filter;
  onFilterChange: (filter: {{EntityName}}Filter) => void;
  onClose: () => void;
}

export function {{EntityName}}FilterSheet({
  open,
  filter,
  onFilterChange,
  onClose,
}: {{EntityName}}FilterSheetProps) {
  const [localFilter, setLocalFilter] = useState<{{EntityName}}Filter>(filter);

  // Sync local filter with prop changes
  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  const handleFilterChange = (updates: Partial<{{EntityName}}Filter>) => {
    const newFilter = { ...localFilter, ...updates };
    setLocalFilter(newFilter);
  };

  const handleApply = () => {
    onFilterChange(localFilter);
    onClose();
  };

  const handleClear = () => {
    const clearedFilter: {{EntityName}}Filter = {};
    setLocalFilter(clearedFilter);
    onFilterChange(clearedFilter);
  };

  {{#fields}}
  {{#if isDate}}
  {{#unless isSystemField}}
  const handle{{camelNameCapitalized}}Change = (value: string) => {
    handleFilterChange({
      {{name}}: value || undefined,
    });
  };
  {{/unless}}
  {{/if}}
  {{/fields}}

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter {{EntityNamePlural}}
          </SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your search results
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Search Filter */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by {{#fields}}{{#if isFirst}}{{label}}{{else}}, {{label}}{{/if}}{{/fields}}..."
              value={localFilter.search || ""}
              onChange={(e) =>
                handleFilterChange({ search: e.target.value || undefined })
              }
            />
          </div>

          {{#fields}}
          {{#if isDate}}
          {{#unless isSystemField}}
          {/* {{Label}} Filter */}
          <div className="space-y-2">
            <Label htmlFor="{{name}}">{{Label}}</Label>
            <Input
              id="{{name}}"
              type="date"
              value={localFilter.{{name}} || ""}
              onChange={(e) =>
                handle{{camelNameCapitalized}}Change(e.target.value)
              }
            />
          </div>
          {{/unless}}
          {{/if}}
          {{#if isString}}
          {{#unless isCodeField}}
          {{#unless isDisplayField}}
          {/* {{Label}} Filter */}
          <div className="space-y-2">
            <Label htmlFor="{{name}}">{{Label}}</Label>
            <Input
              id="{{name}}"
              placeholder="Filter by {{label}}..."
              value={localFilter.{{name}} || ""}
              onChange={(e) =>
                handleFilterChange({ {{name}}: e.target.value || undefined })
              }
            />
          </div>
          {{/unless}}
          {{/unless}}
          {{/if}}
          {{/fields}}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClear}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply}>Apply Filters</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

