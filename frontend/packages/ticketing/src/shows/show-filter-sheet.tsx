/**
 * Show Filter Sheet
 *
 * Component for filtering shows with advanced filters
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
import { ShowFilter } from "./types";
import { useState, useEffect } from "react";

export interface ShowFilterSheetProps {
  open: boolean;
  filter: ShowFilter;
  onFilterChange: (filter: ShowFilter) => void;
  onClose: () => void;
}

export function ShowFilterSheet({
  open,
  filter,
  onFilterChange,
  onClose,
}: ShowFilterSheetProps) {
  const [localFilter, setLocalFilter] = useState<ShowFilter>(filter);

  // Sync local filter with prop changes
  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  const handleFilterChange = (updates: Partial<ShowFilter>) => {
    const newFilter = { ...localFilter, ...updates };
    setLocalFilter(newFilter);
  };

  const handleApply = () => {
    onFilterChange(localFilter);
    onClose();
  };

  const handleClear = () => {
    const clearedFilter: ShowFilter = {};
    setLocalFilter(clearedFilter);
    onFilterChange(clearedFilter);
  };

  
  
  
  
  

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Shows
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
              placeholder="Search by Code, Name..."
              value={localFilter.search || ""}
              onChange={(e) =>
                handleFilterChange({ search: e.target.value || undefined })
              }
            />
          </div>

          
          
          
          
          
          
          
          
          
          
          
          
          

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

