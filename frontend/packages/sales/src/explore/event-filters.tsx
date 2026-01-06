import { Search, X } from "lucide-react";
import {
  Input,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as EventStatus | "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={EventStatusEnum.ON_SALE}>On Sale</SelectItem>
            <SelectItem value={EventStatusEnum.PUBLISHED}>Published</SelectItem>
            <SelectItem value={EventStatusEnum.SOLD_OUT}>Sold Out</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={dateFilter.startDate || ""}
            onChange={(e) =>
              onDateFilterChange({
                ...dateFilter,
                startDate: e.target.value || null,
              })
            }
            className="w-[150px]"
            placeholder="Start date"
          />
          <span className="text-muted-foreground text-sm">to</span>
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
            className="w-[150px]"
            placeholder="End date"
          />
        </div>

        {/* Past Events Toggle */}
        <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
          <input
            type="checkbox"
            id="eventShowPastEvents"
            checked={showPastEvents}
            onChange={(e) => onShowPastEventsChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="eventShowPastEvents" className="text-sm font-medium cursor-pointer">
            Past events
          </label>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <button
                onClick={() => onSearchChange("")}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {formatStatus(statusFilter)}
              <button
                onClick={() => onStatusFilterChange("all")}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateFilter.startDate && (
            <Badge variant="secondary" className="gap-1">
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
            <Badge variant="secondary" className="gap-1">
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
            <Badge variant="secondary" className="gap-1">
              Including past events
              <button
                onClick={() => onShowPastEventsChange(false)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
