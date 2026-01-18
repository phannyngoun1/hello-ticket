import { useState, useMemo } from "react";
import { MapPin, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import type { Event } from "@truths/ticketing";

export interface ExploreCalendarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onDateClick?: (date: Date, events: Event[]) => void;
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
  onDateClick,
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
  
  const goToPreviousYear = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1)
    );
  };

  const goToNextYear = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1)
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
  
  // Get unique location for multiple events on same day
  const getDayLocation = (events: Event[]): string => {
    if (events.length === 0) return "";
    if (events.length === 1) return getEventLocation(events[0]);
    
    const uniqueCities = new Set(events.map(e => e.venue?.city).filter(Boolean));
    return uniqueCities.size === 1 ? getEventLocation(events[0]) : "Multiple Locations";
  };

  return (
    <div className={cn("space-y-6", className)} data-testid="calendar">
      {/* Header Section */}
      <div className="space-y-4">
        {/* Location Filter */}
        {locations.length > 0 && (
          <div className="flex items-center">
            <div className="w-full max-w-sm">
              <label htmlFor="location-filter" className="block text-sm font-medium mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-500 h-4 w-4 z-10" />
                <select
                  id="location-filter"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  aria-label="Location suggestions"
                  aria-autocomplete="both"
                  className={cn(
                    "w-full h-11 pl-10 pr-4 py-2",
                    "border border-input rounded-md",
                    "bg-background text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                    "transition-colors cursor-pointer",
                    "appearance-none"
                  )}
                >
                  <option value="all">City or Zip Code</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center justify-between gap-4">
          <span className="sr-only">
            <div aria-live="polite">
              <span>
                <span>{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })} selected</span>
              </span>
              <span>{getEventCountForMonth(currentMonth.getFullYear(), currentMonth.getMonth())} Events</span>
            </div>
          </span>
          
          {/* Left Navigation - Year Back */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousYear}
            className="h-10 w-10 rounded-full shrink-0"
            aria-label="Previous Year"
          >
            <ChevronDown className="h-5 w-5 rotate-90" />
          </Button>
          
          {/* Month Switcher - Previous Month */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-10 w-10 rounded-full shrink-0"
            aria-label="Previous Month"
          >
            <ChevronDown className="h-5 w-5 rotate-90" />
          </Button>

          {/* Month Tabs */}
          <div role="tablist" className="flex items-center justify-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
            {monthTabs.map((tab, index) => {
              const isActive =
                tab.date.getFullYear() === currentMonth.getFullYear() &&
                tab.date.getMonth() === currentMonth.getMonth();
              const isCurrentTabMonth =
                tab.date.getFullYear() === currentMonth.getFullYear() &&
                tab.date.getMonth() === currentMonth.getMonth();

              return (
                <button
                  key={`${tab.date.getTime()}-${index}`}
                  role="tab"
                  {...(isActive ? { "aria-selected": "true" as const } : { "aria-selected": "false" as const })}
                  onClick={() => !tab.isDisabled && goToMonth(tab.date)}
                  disabled={tab.isDisabled}
                  className={cn(
                    "shrink-0",
                    "px-4 py-2.5 min-w-[100px]",
                    "text-sm font-medium transition-all duration-200",
                    "whitespace-nowrap rounded-lg",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isActive && "bg-primary text-primary-foreground shadow-md scale-105",
                    !isActive && !tab.isDisabled && "hover:bg-accent hover:scale-102",
                    tab.isDisabled && "opacity-40 cursor-not-allowed"
                  )}
                  >
                    <span className="flex flex-col items-center gap-1">
                      <span className={cn(
                        isActive && "font-bold"
                      )}>
                        {isCurrentTabMonth ? (
                          <>
                            <span aria-hidden="true">
                              <span>{tab.shortName} {tab.year}</span>
                            </span>
                            <span className="sr-only">
                              <span>{tab.fullName} {tab.year}</span> selected
                            </span>
                          </>
                        ) : (
                          <span>{tab.shortName}</span>
                        )}
                      </span>
                      <span className="sr-only">, </span>
                      <span className={cn(
                        "text-xs font-normal",
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {tab.eventCount > 0 ? `${tab.eventCount} Event${tab.eventCount !== 1 ? "s" : ""}` : "No Events"}
                      </span>
                    </span>
                  </button>
              );
            })}
          </div>
          
          {/* Month Switcher - Next Month */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-10 w-10 rounded-full shrink-0"
            aria-label="Next Month"
          >
            <ChevronDown className="h-5 w-5 -rotate-90" />
          </Button>

          {/* Right Navigation - Year Forward */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextYear}
            className="h-10 w-10 rounded-full shrink-0"
            aria-label="Next Year"
          >
            <ChevronDown className="h-5 w-5 -rotate-90" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="border rounded-lg overflow-hidden bg-border shadow-sm"
        data-testid="calendarGrid"
      >
        {/* Day Headers */}
        <ul aria-hidden="true" className="grid grid-cols-7 gap-px bg-border border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <li
              key={day}
              className="py-3 px-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/50"
            >
              <span>{day}</span>
            </li>
          ))}
        </ul>

        {/* Calendar Weeks */}
        <div aria-hidden="false" className="flex flex-col gap-px bg-border">
          {weeks.map((week, weekIndex) => (
            <section key={weekIndex}>
              <h3 className="sr-only">Week {weekIndex + 1}</h3>
              <ul className="grid grid-cols-7 gap-px bg-border">
                {week.map((day, dayIndex) => {
                  const hasEvents = day.events.length > 0;
                  const isDisabled = !hasEvents;
                  const isTodayDate = isToday(day.date);
                  const expanded = isDayExpanded(day.date);
                  const dateKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
                  const dayLocation = getDayLocation(day.events);

                  return (
                    <li
                      key={`${dateKey}-${dayIndex}`}
                      className={cn(
                        "relative min-h-[140px] group",
                        "transition-all duration-200 ease-in-out",
                        // Base styles
                        !day.isCurrentMonth && "bg-muted/20",
                        day.isCurrentMonth && "bg-card",
                        
                        // Event highlight (Active)
                        hasEvents && day.isCurrentMonth && "bg-accent/5",
                        hasEvents && !day.isCurrentMonth && "bg-accent/10",
                        
                        // Today styling
                        isTodayDate && "bg-primary/5 ring-1 ring-primary/20 ring-inset",
                        isTodayDate && hasEvents && "bg-primary/10 ring-1 ring-primary/30",
                        
                        // Hover interaction
                        hasEvents && !expanded && "hover:bg-accent/20 hover:shadow-sm cursor-pointer"
                      )}
                      onClick={() => {
                        if (hasEvents && !expanded && day.events.length > 1) {
                          toggleDayExpansion(day.date);
                        }
                      }}
                    >
                      <div className="h-full flex flex-col p-3">
                        {/* View Action Button (Hover) */}

                        {/* Day Header */}
                        <div className="flex items-start justify-between mb-2">
                          <button
                            disabled={isDisabled}
                            {...(expanded ? { "aria-expanded": "true" as const } : { "aria-expanded": "false" as const })}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasEvents) toggleDayExpansion(day.date);
                            }}
                            className={cn(
                              "text-sm font-semibold leading-none",
                              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded",
                              "transition-colors",
                              isTodayDate && "text-primary font-bold",
                              !isTodayDate && day.isCurrentMonth && "text-foreground",
                              !day.isCurrentMonth && "text-muted-foreground/50",
                              !isDisabled && "hover:text-primary"
                            )}
                          >
                            <span className="sr-only">
                              {hasEvents && (
                                <>{day.events.length} Event{day.events.length !== 1 ? "s" : ""}, </>
                              )}
                              {!hasEvents && <>0 Events, </>}
                              <span>{day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                            </span>
                            <span aria-hidden="true">{String(day.dayNumber).padStart(2, "0")}</span>
                          </button>
                          
                          {/* Event Count Indicator */}
                          {hasEvents && (
                            <span className="flex items-center gap-1 shrink-0 ml-2">
                              {day.events.length === 1 ? (
                                <span data-testid="availability-pill">
                                  <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm" />
                                  <span className="sr-only"></span>
                                </span>
                              ) : (
                                <span
                                  aria-hidden="true"
                                  className="text-xs font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded"
                                >
                                  +{day.events.length}
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Event Content */}
                        {hasEvents && !expanded && (
                          <div className="flex-1 flex flex-col gap-2">
                            {/* Location */}
                            <div className="text-xs font-medium text-muted-foreground truncate">
                              {dayLocation}
                            </div>
                            
                            {/* Action Button */}
                            <div className="mt-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onDateClick) {
                                    onDateClick(day.date, day.events);
                                  } else if (day.events.length === 1) {
                                    onEventClick(day.events[0]);
                                  } else {
                                    toggleDayExpansion(day.date);
                                  }
                                }}
                                className={cn(
                                  "w-full text-left px-2 py-1.5 rounded-md",
                                  "transition-all duration-150",
                                  "group flex items-center justify-between",
                                  "hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-ring"
                                )}
                              >
                                {day.events.length === 1 ? (
                                  <span className="text-xs font-semibold text-foreground">
                                    {formatTime(day.events[0].start_dt)}
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-primary">
                                    {day.events.length} Events
                                  </span>
                                )}
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-all -rotate-90" />
                                <span className="sr-only">
                                  , <span>{day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                                  {day.events.length === 1 && <span>, {getEventLocation(day.events[0])}</span>}
                                  {day.events.length > 1 && <span>, {dayLocation}</span>}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Expanded Event List */}
                        {hasEvents && expanded && (
                          <div className="flex-1 flex flex-col gap-2 -mx-1">
                            <div className="text-xs font-bold text-foreground px-1 pb-1 border-b">
                              {day.date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                            </div>
                            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">
                              {day.events.map((event) => (
                                <button
                                  key={event.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEventClick(event);
                                  }}
                                  className={cn(
                                    "w-full text-left p-2 rounded-md",
                                    "bg-accent/30 hover:bg-accent transition-all duration-150",
                                    "group border border-transparent hover:border-border",
                                    "focus:outline-none focus:ring-2 focus:ring-ring"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="text-xs font-semibold text-foreground">
                                      {formatTime(event.start_dt)}
                                    </span>
                                    <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 -rotate-90" />
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {getEventLocation(event)}
                                  </div>
                                  {event.show && (
                                    <div className="text-xs text-muted-foreground/80 truncate mt-0.5">
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

      {/* Summary Footer */}
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
