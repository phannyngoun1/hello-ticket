import { useState } from "react";
import { Search, X, ListFilter, Play, CalendarClock } from "lucide-react";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@truths/ui";
import { type EventStatus, EventStatus as EventStatusEnum, type Event } from "@truths/ticketing";
import { cn } from "@truths/ui/lib/utils";

export interface DateFilter {
  startDate: string | null;
  endDate: string | null;
}

const NOW_SHOWING_DAYS = 21;

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
  /** Events used to build Now Showing (days) and Coming Soon (months) timeline options. */
  events?: Event[];
  /** Called when the user selects from the timeline (Now Showing / Coming Soon) or clears it. Used to apply status: on_sale for Now Showing, published for Coming Soon. */
  onTimelineSourceChange?: (source: "now-showing" | "coming-soon" | null) => void;
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
  events = [],
  onTimelineSourceChange,
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

  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Now Showing: distinct days with ON_SALE events from today through the next NOW_SHOWING_DAYS
  const nowShowingDays = (() => {
    const onSale = events.filter((e) => e.status === EventStatusEnum.ON_SALE);
    if (!onSale.length) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + NOW_SHOWING_DAYS);
    const set = new Set<string>();
    for (const e of onSale) {
      const d = new Date(e.start_dt);
      d.setHours(0, 0, 0, 0);
      if (d >= today && d <= end) set.add(toYMD(d));
    }
    return Array.from(set).sort();
  })();

  // Coming Soon: distinct (year, month) with PUBLISHED events where the month is current or future
  const comingSoonMonths = (() => {
    const published = events.filter((e) => e.status === EventStatusEnum.PUBLISHED);
    if (!published.length) return [];
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();
    const set = new Set<string>();
    for (const e of published) {
      const d = new Date(e.start_dt);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (y > curYear || (y === curYear && m >= curMonth))
        set.add(`${y}-${m}`);
    }
    return Array.from(set).sort();
  })();

  const isToday = (dateStr: string) => dateStr === toYMD(new Date());

  const isDaySelected = (dayStr: string) =>
    !!dateFilter.startDate &&
    dateFilter.startDate === dayStr &&
    dateFilter.endDate === dayStr;

  const isMonthSelected = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const last = new Date(y, m + 1, 0).getDate();
    const lastStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
    return dateFilter.startDate === first && dateFilter.endDate === lastStr;
  };

  const onDaySelect = (dayStr: string) => {
    onDateFilterChange({ startDate: dayStr, endDate: dayStr });
    onTimelineSourceChange?.("now-showing");
  };
  const onMonthSelect = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const last = new Date(y, m + 1, 0).getDate();
    const lastStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
    onDateFilterChange({ startDate: first, endDate: lastStr });
    onTimelineSourceChange?.("coming-soon");
  };
  const clearTimeline = (tab: "now-showing" | "coming-soon") => {
    onDateFilterChange({ ...dateFilter, startDate: null, endDate: null });
    onTimelineSourceChange?.(tab);
  };

  const hasTimelineSelection =
    dateFilter.startDate != null && dateFilter.endDate != null;

  const [timelineTab, setTimelineTab] = useState<"now-showing" | "coming-soon">("now-showing");
  const hasBoth = nowShowingDays.length > 0 && comingSoonMonths.length > 0;

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
                                    onChange={(e) => {
                                        onDateFilterChange({
                                            ...dateFilter,
                                            startDate: e.target.value || null,
                                        });
                                        onTimelineSourceChange?.(null);
                                    }}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">To</span>
                                <Input
                                    type="date"
                                    value={dateFilter.endDate || ""}
                                    onChange={(e) => {
                                        onDateFilterChange({
                                            ...dateFilter,
                                            endDate: e.target.value || null,
                                        });
                                        onTimelineSourceChange?.(null);
                                    }}
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

      {/* Timeline filters: Now Showing (days) + Coming Soon (months) as tab list */}
      {events.length > 0 && (nowShowingDays.length > 0 || comingSoonMonths.length > 0) && (
        <div
          className="rounded-lg border border-l-[3px] border-l-primary/40 bg-muted/30 px-4 py-3"
          aria-label="Timeline filters"
        >
          {hasBoth ? (
            <Tabs
              value={timelineTab}
              onValueChange={(v) => {
                const src = v as "now-showing" | "coming-soon";
                setTimelineTab(src);
                onTimelineSourceChange?.(src);
                onDateFilterChange({ ...dateFilter, startDate: null, endDate: null });
              }}
            >
              <TabsList className="h-9 w-auto inline-flex mb-2">
              <TabsTrigger value="now-showing" className="gap-1.5 text-xs px-3">
                <Play className="h-3.5 w-3.5" />
                Now Showing
              </TabsTrigger>
              <TabsTrigger value="coming-soon" className="gap-1.5 text-xs px-3">
                <CalendarClock className="h-3.5 w-3.5" />
                Coming Soon
              </TabsTrigger>
            </TabsList>
              <TabsContent value="now-showing" className="mt-0">
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                  <button type="button" onClick={() => clearTimeline("now-showing")}
                    className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      !hasTimelineSelection ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent hover:border-primary/50")}
                  >All</button>
                  {nowShowingDays.map((dayStr) => {
                    const d = new Date(dayStr + "T12:00:00");
                    const label = isToday(dayStr) ? "Today" : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
                    const selected = isDaySelected(dayStr);
                    return (
                      <button key={dayStr} type="button" onClick={() => onDaySelect(dayStr)}
                        className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent hover:border-primary/50")}
                      >{label}</button>
                    );
                  })}
                </div>
              </TabsContent>
              <TabsContent value="coming-soon" className="mt-0">
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                  <button type="button" onClick={() => clearTimeline("coming-soon")}
                    className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      !hasTimelineSelection ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent hover:border-primary/50")}
                  >All</button>
                  {comingSoonMonths.map((ym) => {
                    const [y, m] = ym.split("-").map(Number);
                    const d = new Date(y, m, 1);
                    const label = d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
                    const selected = isMonthSelected(ym);
                    return (
                      <button key={ym} type="button" onClick={() => onMonthSelect(ym)}
                        className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent hover:border-primary/50")}
                      >{label}</button>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          ) : nowShowingDays.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Play className="h-3.5 w-3.5 text-primary" />
                <span>Now Showing</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                <button type="button" onClick={() => clearTimeline("now-showing")}
                  className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    !hasTimelineSelection ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent hover:border-primary/50")}
                >All</button>
                {nowShowingDays.map((dayStr) => {
                  const d = new Date(dayStr + "T12:00:00");
                  const label = isToday(dayStr) ? "Today" : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
                  const selected = isDaySelected(dayStr);
                  return (
                    <button key={dayStr} type="button" onClick={() => onDaySelect(dayStr)}
                      className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent hover:border-primary/50")}
                    >{label}</button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <CalendarClock className="h-3.5 w-3.5 text-primary" />
                <span>Coming Soon</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                <button type="button" onClick={() => clearTimeline("coming-soon")}
                  className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    !hasTimelineSelection ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent hover:border-primary/50")}
                >All</button>
                {comingSoonMonths.map((ym) => {
                  const [y, m] = ym.split("-").map(Number);
                  const d = new Date(y, m, 1);
                  const label = d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
                  const selected = isMonthSelected(ym);
                  return (
                    <button key={ym} type="button" onClick={() => onMonthSelect(ym)}
                      className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent hover:border-primary/50")}
                    >{label}</button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          {search && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              Search: <span className="font-medium">{search}</span>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                aria-label="Clear search filter"
                title="Clear search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              {formatStatus(statusFilter)}
              <button
                type="button"
                onClick={() => onStatusFilterChange("all")}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                aria-label="Clear status filter"
                title="Clear status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateFilter.startDate && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              From: {formatDate(dateFilter.startDate)}
              <button
                type="button"
                onClick={() => {
                  onDateFilterChange({ ...dateFilter, startDate: null });
                  onTimelineSourceChange?.(null);
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                aria-label="Clear start date filter"
                title="Clear start date filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateFilter.endDate && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              To: {formatDate(dateFilter.endDate)}
              <button
                type="button"
                onClick={() => {
                  onDateFilterChange({ ...dateFilter, endDate: null });
                  onTimelineSourceChange?.(null);
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                aria-label="Clear end date filter"
                title="Clear end date filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {showPastEvents && (
            <Badge variant="secondary" className="gap-1 rounded-sm px-2 py-1">
              Past events
              <button
                type="button"
                onClick={() => onShowPastEventsChange(false)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                aria-label="Clear past events filter"
                title="Clear past events filter"
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
