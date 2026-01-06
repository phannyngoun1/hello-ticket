import { useState, useMemo } from "react";
import { MapPin, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import type { Event } from "@truths/ticketing";

export interface ExploreCalendarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  className?: string;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  events: Event[];
}

interface MonthTab {
  date: Date;
  shortName: string;
  fullName: string;
  year: number;
  eventCount: number;
  isDisabled: boolean;
}

export function ExploreCalendar({
  events,
  onEventClick,
  className,
}: ExploreCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Get unique locations from events
  const locations = useMemo(() => {
    const locationSet = new Set<string>();
    events.forEach((event) => {
      if (event.venue?.city) {
        locationSet.add(event.venue.city);
      }
    });
    return Array.from(locationSet).sort();
  }, [events]);

  // Filter events by location
  const filteredEvents = useMemo(() => {
    if (locationFilter === "all") return events;
    return events.filter((event) => event.venue?.city === locationFilter);
  }, [events, locationFilter]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    filteredEvents.forEach((event) => {
      const eventDate = new Date(event.start_dt);
      const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return eventsByDate[dateKey] || [];
  };

  // Get event count for a month
  const getEventCountForMonth = (year: number, month: number): number => {
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.start_dt);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    }).length;
  };

  // Generate month tabs (showing 5 months: current ± 2)
  const monthTabs = useMemo(() => {
    const tabs: MonthTab[] = [];
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();

    for (let i = -2; i <= 2; i++) {
      const monthDate = new Date(currentYear, currentMonthIndex + i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const eventCount = getEventCountForMonth(year, month);
      
      tabs.push({
        date: monthDate,
        shortName: monthDate.toLocaleString("default", { month: "short" }),
        fullName: monthDate.toLocaleString("default", { month: "long" }),
        year: year,
        eventCount: eventCount,
        isDisabled: eventCount === 0,
      });
    }
    return tabs;
  }, [currentMonth, filteredEvents]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // First day of the week (Sunday = 0)
    const startDay = firstDay.getDay();

    // Days in previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        isPast: date < today,
        events: getEventsForDate(date),
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isPast: date < today,
        events: getEventsForDate(date),
      });
    }

    // Next month days (fill to complete weeks)
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        date.setHours(0, 0, 0, 0);
        days.push({
          date,
          dayNumber: day,
          isCurrentMonth: false,
          isPast: date < today,
          events: getEventsForDate(date),
        });
      }
    }

    return days;
  }, [currentMonth, eventsByDate]);

  // Group days into weeks
  const weeks = useMemo(() => {
    const weekList: CalendarDay[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weekList.push(calendarDays.slice(i, i + 7));
    }
    return weekList;
  }, [calendarDays]);

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToMonth = (monthDate: Date) => {
    setCurrentMonth(monthDate);
  };

  // Toggle day expansion
  const toggleDayExpansion = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const isDayExpanded = (date: Date): boolean => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return expandedDays.has(dateKey);
  };

  // Format time
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get location display
  const getEventLocation = (event: Event): string => {
    if (event.venue?.city && event.venue?.state) {
      return `${event.venue.city}, ${event.venue.state}`;
    }
    if (event.venue?.city) {
      return event.venue.city;
    }
    return "Location TBA";
  };

  // Check if today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  return (
    <div className={cn("space-y-4", className)} data-testid="calendar">
      {/* Location Filter and Month Navigation */}
      <div className="space-y-4">
        {/* Location Filter */}
        {locations.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs">
              <label htmlFor="location-filter" className="sr-only">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <select
                  id="location-filter"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous Month</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next Month</span>
            </Button>
          </div>

          {/* Month Tabs */}
          <ul className="flex items-center gap-2 flex-1 overflow-x-auto">
            {monthTabs.map((tab, index) => {
              const isActive =
                tab.date.getFullYear() === currentMonth.getFullYear() &&
                tab.date.getMonth() === currentMonth.getMonth();
              const isCurrentYearMonth =
                tab.date.getFullYear() === currentMonth.getFullYear() &&
                tab.date.getMonth() === currentMonth.getMonth();

              return (
                <li key={`${tab.date.getTime()}-${index}`}>
                  <button
                    onClick={() => !tab.isDisabled && goToMonth(tab.date)}
                    disabled={tab.isDisabled}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap rounded-md",
                      isActive && "bg-primary text-primary-foreground shadow-sm",
                      !isActive && !tab.isDisabled && "hover:bg-accent",
                      tab.isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="flex flex-col items-center gap-1">
                      <span>
                        {isCurrentYearMonth ? (
                          <>
                            <span className="font-semibold">{tab.shortName} {tab.year}</span>
                          </>
                        ) : (
                          tab.shortName
                        )}
                      </span>
                      <span className={cn(
                        "text-xs",
                        isActive ? "text-primary-foreground/90" : "text-muted-foreground"
                      )}>
                        {tab.eventCount > 0 ? `${tab.eventCount} Event${tab.eventCount !== 1 ? "s" : ""}` : "No Events"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="border rounded-lg overflow-hidden bg-background shadow-sm"
        data-testid="calendarGrid"
      >
        {/* Day Headers */}
        <ul aria-hidden="true" className="grid grid-cols-7 border-b bg-muted/30">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <li
              key={day}
              className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide border-r last:border-r-0"
            >
              <span>{day}</span>
            </li>
          ))}
        </ul>

        {/* Calendar Weeks */}
        <div aria-hidden="false">
          {weeks.map((week, weekIndex) => (
            <section key={weekIndex} className="border-b last:border-b-0">
              <h3 className="sr-only">Week {weekIndex + 1}</h3>
              <ul className="grid grid-cols-7">
                {week.map((day, dayIndex) => {
                  const hasEvents = day.events.length > 0;
                  const isDisabled = !hasEvents || day.isPast;
                  const isTodayDate = isToday(day.date);
                  const expanded = isDayExpanded(day.date);
                  const dateKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;

                  return (
                    <li
                      key={`${dateKey}-${dayIndex}`}
                      className={cn(
                        "relative min-h-[120px] border-r last:border-r-0",
                        !day.isCurrentMonth && "bg-muted/20",
                        day.isCurrentMonth && "bg-background",
                        isTodayDate && "bg-primary/5"
                      )}
                    >
                      {/* Compact View */}
                      <div className="p-2">
                        {/* Day Number and Event Indicator */}
                        <div className="flex items-start justify-between mb-2">
                          <button
                            disabled={isDisabled}
                            aria-expanded={expanded}
                            onClick={() => hasEvents && toggleDayExpansion(day.date)}
                            className={cn(
                              "text-sm font-semibold",
                              isTodayDate && "text-primary font-bold",
                              !isTodayDate && day.isCurrentMonth && "text-foreground",
                              !day.isCurrentMonth && "text-muted-foreground opacity-50",
                              isDisabled && "cursor-default"
                            )}
                          >
                            <span className="sr-only">
                              {day.events.length} Event{day.events.length !== 1 ? "s" : ""},{" "}
                              <span>{day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                            </span>
                            <span aria-hidden="true">{String(day.dayNumber).padStart(2, "0")}</span>
                          </button>
                          
                          {hasEvents && (
                            <span className="flex items-center gap-1">
                              {day.events.length === 1 ? (
                                <span data-testid="availability-pill">
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                  <span className="sr-only" />
                                </span>
                              ) : (
                                <span
                                  aria-hidden="true"
                                  className="text-xs font-semibold text-primary"
                                >
                                  +{day.events.length}
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Event Preview (Collapsed) */}
                        {hasEvents && !expanded && (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground truncate">
                              {day.events.length > 1 ? (
                                <span>Multiple Locations</span>
                              ) : (
                                <span>{getEventLocation(day.events[0])}</span>
                              )}
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  if (day.events.length === 1) {
                                    onEventClick(day.events[0]);
                                  } else {
                                    toggleDayExpansion(day.date);
                                  }
                                }}
                                className="w-full text-left text-xs hover:underline flex items-center gap-1 group"
                              >
                                {day.events.length === 1 ? (
                                  <span className="font-medium text-foreground">
                                    {formatTime(day.events[0].start_dt)}
                                  </span>
                                ) : (
                                  <span className="font-medium text-primary">
                                    {day.events.length} Events
                                  </span>
                                )}
                                <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                <span className="sr-only">
                                  , <span>{day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                                  {day.events.length === 1 && <span>, {getEventLocation(day.events[0])}</span>}
                                  {day.events.length > 1 && <span>, Multiple Locations</span>}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Event Details (Expanded) */}
                        {hasEvents && expanded && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-foreground border-b pb-1">
                              {day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {day.events.map((event) => (
                                <button
                                  key={event.id}
                                  onClick={() => onEventClick(event)}
                                  className="w-full text-left p-2 rounded bg-accent/50 hover:bg-accent transition-colors group"
                                >
                                  <div className="text-xs text-muted-foreground truncate mb-1">
                                    {getEventLocation(event)}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-foreground">
                                      {formatTime(event.start_dt)}
                                    </span>
                                    <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                  </div>
                                  {event.show && (
                                    <div className="text-xs text-muted-foreground truncate mt-1">
                                      {event.show.name}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarIcon className="h-4 w-4" />
        <span>
          Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} in{" "}
          {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}
