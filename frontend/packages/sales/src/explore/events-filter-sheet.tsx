
import { Filter, X } from "lucide-react";
import {
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@truths/ui";
import { type Dispatch, type SetStateAction } from "react";

export interface DateFilter {
  startDate: string | null;
  endDate: string | null;
}

interface EventsFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasActiveFilters: boolean;
  dateFilter: DateFilter;
  setDateFilter: Dispatch<SetStateAction<DateFilter>>;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  showPastEvents: boolean;
  setShowPastEvents: (show: boolean) => void;
  onClearFilters: () => void;
}

export function EventsFilterSheet({
  open,
  onOpenChange,
  hasActiveFilters,
  dateFilter,
  setDateFilter,
  selectedDate,
  setSelectedDate,
  showPastEvents,
  setShowPastEvents,
  onClearFilters,
}: EventsFilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filter Events</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Date Range Filter */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={dateFilter.startDate || ""}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      startDate: e.target.value || null,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={dateFilter.endDate || ""}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      endDate: e.target.value || null,
                    }))
                  }
                  min={dateFilter.startDate || undefined}
                />
              </div>
            </div>
          </div>

          {/* Calendar Date Picker */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Select Specific Date</h3>
            <Input
              type="date"
              value={selectedDate || ""}
              onChange={(e) => setSelectedDate(e.target.value || null)}
            />
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Date Selection
              </Button>
            )}
          </div>

          {/* Show Past Events Toggle */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Options</h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPastEvents"
                checked={showPastEvents}
                onChange={(e) => setShowPastEvents(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="showPastEvents" className="text-sm font-medium">
                Show past events
              </label>
            </div>
          </div>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
