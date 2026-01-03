/**
 * Event Calendar View Component
 *
 * Calendar view for displaying events in a monthly calendar format
 */

import { useState, useMemo } from "react";
import { Button } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Event } from "./types";

export interface EventCalendarViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  className?: string;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  events: Event[];
}

interface MonthInfo {
  date: Date;
  name: string;
  shortName: string;
  eventCount: number;
}

export function EventCalendarView({
  events,
  onEventClick,
  className,
}: EventCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    events.forEach((event) => {
      const eventDate = new Date(event.start_dt);
      const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return eventsByDate[dateKey] || [];
  };

  // Get event count for a specific month
  const getEventCountForMonth = (year: number, month: number): number => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_dt);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    }).length;
  };

  // Generate months for navigation (current month ± 2 months)
  const monthTabs = useMemo(() => {
    const tabs: MonthInfo[] = [];
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();

    for (let i = -2; i <= 2; i++) {
      const monthDate = new Date(currentYear, currentMonthIndex + i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      tabs.push({
        date: monthDate,
        name: monthDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        shortName: monthDate.toLocaleString("default", { month: "short" }),
        eventCount: getEventCountForMonth(year, month),
      });
    }
    return tabs;
  }, [currentMonth, events]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // First day of the week (Sunday = 0)
    const startDay = firstDay.getDay();

    // Days in previous month to show
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month days - fill from the start of the week
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        events: getEventsForDate(date),
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        events: getEventsForDate(date),
      });
    }

    // Next month days to fill exactly 6 weeks (42 days total)
    const totalDays = days.length;
    const remainingDays = 42 - totalDays;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: false,
        events: getEventsForDate(date),
      });
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

  // Navigate months
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

  // Format time
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get location text for event (placeholder - would need venue lookup)
  const getEventLocation = (_event: Event): string => {
    // For now, return a placeholder. In real implementation, would fetch venue name
    return "Venue";
  };

  return (
    <div className={cn("space-y-4", className)} data-testid="calendar">
      {/* Month Navigation with Tabs */}
      <div className="space-y-3">
        {/* Navigation Arrows and Month Tabs */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-10 w-10 rounded-full hover:bg-accent"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous Month</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-10 w-10 rounded-full hover:bg-accent"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next Month</span>
            </Button>
          </div>

          {/* Month Tabs */}
          <ul className="flex items-center gap-2 flex-1 overflow-x-auto">
            {monthTabs.map((month, index) => {
              const isActive =
                month.date.getFullYear() === currentMonth.getFullYear() &&
                month.date.getMonth() === currentMonth.getMonth();
              const showYear =
                month.date.getFullYear() === currentMonth.getFullYear() &&
                month.date.getMonth() === currentMonth.getMonth();

              return (
                <li key={`${month.date.getTime()}-${index}`}>
                  <button
                    onClick={() => goToMonth(month.date)}
                    className={cn(
                      "px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap relative",
                      isActive
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>
                      {showYear ? (
                        <>
                          <span className="font-semibold">
                            {month.shortName}
                          </span>{" "}
                          <span>{month.date.getFullYear()}</span>
                        </>
                      ) : (
                        month.shortName
                      )}
                    </span>
                    {month.eventCount > 0 ? (
                      <span className="ml-2 text-xs opacity-90">
                        {month.eventCount}{" "}
                        {month.eventCount === 1 ? "Event" : "Events"}
                      </span>
                    ) : (
                      <span className="ml-2 text-xs opacity-60">No Events</span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
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
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="divide-y">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map((day, dayIndex) => {
                const hasEvents = day.events.length > 0;
                const today = new Date();
                const isToday =
                  day.date.getFullYear() === today.getFullYear() &&
                  day.date.getMonth() === today.getMonth() &&
                  day.date.getDate() === today.getDate();

                return (
                  <div
                    key={`${day.date.getTime()}-${dayIndex}`}
                    className={cn(
                      "relative h-[140px] p-2 border-r last:border-r-0 flex flex-col",
                      !day.isCurrentMonth && "bg-muted/20",
                      isToday && "bg-primary/10",
                      day.isCurrentMonth && !isToday && "bg-background"
                    )}
                  >
                    {/* Day number - top left */}
                    <div className="flex justify-start mb-1.5 flex-shrink-0">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isToday && "text-primary font-bold",
                          !isToday && day.isCurrentMonth && "text-foreground",
                          !day.isCurrentMonth &&
                            "text-muted-foreground opacity-50"
                        )}
                      >
                        {day.dayNumber}
                      </span>
                    </div>

                    {/* Events - compact list */}
                    {hasEvents && (
                      <div className="flex-1 space-y-1 overflow-y-auto min-h-0">
                        {day.events.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => onEventClick?.(event)}
                            className="w-full text-left p-1.5 rounded hover:bg-accent/50 transition-colors group text-xs"
                          >
                            <div className="text-muted-foreground truncate mb-0.5">
                              {getEventLocation(event)}
                            </div>
                            <div className="text-foreground font-medium truncate">
                              {formatTime(event.start_dt)}
                            </div>
                          </button>
                        ))}
                        {day.events.length > 3 && (
                          <div className="text-xs text-muted-foreground pt-1">
                            +{day.events.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
