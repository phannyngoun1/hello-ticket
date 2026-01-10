import { Search, X, ListFilter } from "lucide-react";
import {
  Input,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@truths/ui";
import { type EventStatus, EventStatus as EventStatusEnum } from "@truths/ticketing";

export interface DateFilter {
  startDate: string | null;
  endDate: string | null;
}

interface EventFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: EventStatus | "all";
  onStatusFilterChange: (value: EventStatus | "all") => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  showPastEvents: boolean;
  onShowPastEventsChange: (value: boolean) => void;
  onClearFilters: () => void;
}

export function EventFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  showPastEvents,
  onShowPastEventsChange,
  onClearFilters,
}: EventFiltersProps) {
  const hasActiveFilters =
    search ||
    statusFilter !== "all" ||
    dateFilter.startDate ||
    dateFilter.endDate ||
    showPastEvents;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-8"
          />
        </div>

        {/* Filter Popover */}
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 gap-2 px-4 shadow-sm border-dashed">
                    <ListFilter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                        <div className="bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 grid place-items-center ml-1 font-bold">
                            {[
                                statusFilter !== "all",
                                dateFilter.startDate,
                                dateFilter.endDate,
                                showPastEvents
                            ].filter(Boolean).length}
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-5" align="end">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm leading-none">Status</h4>
                        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as EventStatus | "all")}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value={EventStatusEnum.ON_SALE}>On Sale</SelectItem>
                                <SelectItem value={EventStatusEnum.PUBLISHED}>Published</SelectItem>
                                <SelectItem value={EventStatusEnum.SOLD_OUT}>Sold Out</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm leading-none">Date Range</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">From</span>
                                <Input
                                    type="date"
                                    value={dateFilter.startDate || ""}
                                    onChange={(e) =>
                                        onDateFilterChange({
                                            ...dateFilter,
                                            startDate: e.target.value || null,
                                        })
                                    }
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">To</span>
                                <Input
                                    type="date"
                                    value={dateFilter.endDate || ""}
                                    onChange={(e) =>
                                        onDateFilterChange({
                                            ...dateFilter,
                                            endDate: e.target.value || null,
                                        })
                                    }
                                    min={dateFilter.startDate || undefined}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                        <input
                            type="checkbox"
                            id="eventShowPastEvents"
                            checked={showPastEvents}
                            onChange={(e) => onShowPastEventsChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                        />
                        <label htmlFor="eventShowPastEvents" className="text-sm font-medium cursor-pointer flex-1">
                            Include past events
                        </label>
                    </div>

                    {hasActiveFilters && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                onClearFilters();
                                // Close popover logic would need state or Ref, but generic clear works
                            }}
                            className="w-full h-8 mt-2"
                        >
                            Reset all filters
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          {search && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              Search: <span className="font-medium">{search}</span>
              <button
                onClick={() => onSearchChange("")}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              {formatStatus(statusFilter)}
              <button
                onClick={() => onStatusFilterChange("all")}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateFilter.startDate && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              From: {formatDate(dateFilter.startDate)}
              <button
                onClick={() => onDateFilterChange({ ...dateFilter, startDate: null })}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateFilter.endDate && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              To: {formatDate(dateFilter.endDate)}
              <button
                onClick={() => onDateFilterChange({ ...dateFilter, endDate: null })}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {showPastEvents && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              Past events
              <button
                onClick={() => onShowPastEventsChange(false)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
           <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-6 px-2 text-xs">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
