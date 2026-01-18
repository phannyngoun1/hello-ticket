import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { List, Grid3x3, Ticket, Calendar } from "lucide-react";
import {
  Button,
} from "@truths/ui";
import { 
  useEventService, 
  useEvents,
  EventList,
  type Event,
  type EventStatus,
  EventStatus as EventStatusEnum,
} from "@truths/ticketing";
import {
  useShowService,
  useShows,
  type ShowImage,
} from "@truths/ticketing";
import { ShowEventsSheet } from "./show-events-sheet";
import { ShowList, type ShowWithEvents } from "./show-list";
import { ShowFilters, type DateFilter } from "./show-filters";
import { EventFilters } from "./event-filters";
import { ExploreCalendar } from "./explore-calendar";
import { DayEventsSheet } from "./day-events-sheet";
import { api } from "@truths/api";
import { toast } from "@truths/ui";
import { CreateBookingDialog } from "../bookings/create-booking-dialog";
import { BookingService } from "../bookings/booking-service";
import { useCreateBooking } from "../bookings/use-bookings";
import type { CreateBookingInput } from "../bookings/types";

export function ExploreList() {
  const navigate = useNavigate();
  
  // Layout mode
  const [layoutMode, setLayoutMode] = useState<"show" | "event" | "calendar">("show");
  
  // Show mode filter states
  const [showSearch, setShowSearch] = useState("");
  const [showStatusFilter, setShowStatusFilter] = useState<EventStatus | "all">("all");
  const [showDateFilter, setShowDateFilter] = useState<DateFilter>({
    startDate: null,
    endDate: null,
  });
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Event mode filter states
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatus | "all">("all");
  const [eventDateFilter, setEventDateFilter] = useState<DateFilter>({
    startDate: null,
    endDate: null,
  });
  const [eventPastEvents, setEventPastEvents] = useState(false);
  const [timelineSource, setTimelineSource] = useState<"now-showing" | "coming-soon" | null>("now-showing");


  // UI state
  const [showImages, setShowImages] = useState<Record<string, ShowImage[]>>({});
  const [selectedShowForSheet, setSelectedShowForSheet] = useState<ShowWithEvents | null>(null);
  const [showEventsSheetOpen, setShowEventsSheetOpen] = useState(false);
  
  // Day events sheet state
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [dayEventsSheetOpen, setDayEventsSheetOpen] = useState(false);

  // Booking state
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const [bookingInitialShowId, setBookingInitialShowId] = useState<string | null>(null);
  const [bookingInitialEventId, setBookingInitialEventId] = useState<string | null>(null);

  // Service for booking creation
  const bookingService = useMemo(
    () =>
      new BookingService({
        apiClient: api,
        endpoints: { bookings: "/api/v1/sales/bookings" },
      }),
    []
  );
  const createBookingMutation = useCreateBooking(bookingService);

  const eventService = useEventService();
  const showService = useShowService();

  // Memoize pagination objects to prevent unnecessary re-renders
  const showPagination = useMemo(() => ({
    page: 1,
    pageSize: 100,
    total: 0,
    totalPages: 0,
  }), []);

  const eventPagination = useMemo(() => ({
    page: 1,
    pageSize: 200,
    total: 0,
    totalPages: 0,
  }), []);

  // Debounced search values to prevent excessive API calls
  const [debouncedShowSearch, setDebouncedShowSearch] = useState("");
  const [debouncedEventSearch, setDebouncedEventSearch] = useState("");

  // Debounce search inputs - wait 300ms after user stops typing before triggering API call
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedShowSearch(showSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [showSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEventSearch(eventSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [eventSearch]);


  // Show mode data - fetch shows for both show mode and event mode (needed for event search)
  const { data: showsData, isLoading: showsLoading } = useShows(showService, {
    filter: {
      search: debouncedShowSearch || undefined,
    },
    pagination: showPagination,
    enabled: layoutMode === "show" || layoutMode === "event",
    disableCache: true,
  });

  // Shared events data for show mode (to group events by shows) - fetch when in show mode
  const { data: showModeEventsData, isLoading: showModeEventsLoading } = useEvents(eventService, {
    filter: {
      status: [EventStatusEnum.PUBLISHED, EventStatusEnum.ON_SALE, EventStatusEnum.SOLD_OUT],
    },
    pagination: eventPagination,
    enabled: layoutMode === "show",
    disableCache: true,
  });

  // Determine status filter based on timeline source for API call
  const eventModeStatusFilter = useMemo(() => {
    if (timelineSource === "now-showing") {
      return [EventStatusEnum.ON_SALE, EventStatusEnum.SOLD_OUT];
    } else if (timelineSource === "coming-soon") {
      return [EventStatusEnum.PUBLISHED];
    } else {
      return [EventStatusEnum.PUBLISHED, EventStatusEnum.ON_SALE, EventStatusEnum.SOLD_OUT];
    }
  }, [timelineSource]);


  // Event mode data - only fetch when in event mode
  const { data: eventModeEventsData, isLoading: eventModeEventsLoading } = useEvents(eventService, {
    filter: {
      search: debouncedEventSearch || undefined,
      status: eventModeStatusFilter,
    },
    pagination: eventPagination,
    enabled: layoutMode === "event",
    disableCache: true,
  });

  // Calendar mode data - only fetch when in calendar mode
  const { data: calendarModeEventsData, isLoading: calendarModeEventsLoading } = useEvents(eventService, {
    filter: {
      status: [EventStatusEnum.PUBLISHED, EventStatusEnum.ON_SALE, EventStatusEnum.SOLD_OUT],
    },
    pagination: eventPagination,
    enabled: layoutMode === "calendar",
    disableCache: true,
  });

  // Timeline options data - always fetch all events for timeline calculation
  const { data: timelineEventsData } = useEvents(eventService, {
    filter: {
      status: [EventStatusEnum.PUBLISHED, EventStatusEnum.ON_SALE, EventStatusEnum.SOLD_OUT],
    },
    pagination: eventPagination,
    enabled: layoutMode === "event",
    disableCache: true,
  });

  // Fetch banner images for shows (with rate limiting protection) - only when in show mode
  useEffect(() => {
    if (layoutMode === "show" && showsData?.data && showsData.data.length > 0) {
      const fetchImagesWithDelay = async () => {
        for (let i = 0; i < showsData.data.length; i++) {
          const show = showsData.data[i];

          try {
            const images = await showService.fetchShowImages(show.id);
            setShowImages((prev) => {
              // Only update if not already set to avoid unnecessary re-renders
              if (prev[show.id]) return prev;
              return { ...prev, [show.id]: images };
            });
            // Add delay between requests to avoid rate limiting (100ms delay)
            if (i < showsData.data.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error: any) {
            // Handle rate limit errors gracefully
            if (error?.response?.status === 429 || error?.status === 429) {
              console.warn(`Rate limit hit for show ${show.id}, skipping for now`);
              // Wait longer if rate limited before continuing
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              console.error(`Error fetching images for show ${show.id}:`, error);
            }
          }
        }
      };

      fetchImagesWithDelay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutMode, showsData?.data, showService]);

  // Group events by show and filter
  const showsWithEvents = useMemo(() => {
    if (!showsData?.data || !showModeEventsData?.data) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Filter events
    const filteredEvents = showModeEventsData.data.filter((event) => {
      const eventDate = new Date(event.start_dt);
      eventDate.setHours(0, 0, 0, 0);

      // Filter out past events unless showPastEvents is true
      if (!showPastEvents && eventDate < now) return false;

      // Filter out inactive events
      if (event.is_active === false) return false;

      // Filter by status
      if (showStatusFilter !== "all" && event.status !== showStatusFilter) return false;

      // Filter by date range
      if (showDateFilter.startDate) {
        const startDate = new Date(showDateFilter.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (eventDate < startDate) return false;
      }

      if (showDateFilter.endDate) {
        const endDate = new Date(showDateFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (eventDate > endDate) return false;
      }

      return true;
    });

    // Group events by show_id
    const eventsByShow = new Map<string, Event[]>();
    filteredEvents.forEach((event) => {
      const existing = eventsByShow.get(event.show_id) || [];
      eventsByShow.set(event.show_id, [...existing, event]);
    });

    // Create show with events array
    const result: ShowWithEvents[] = showsData.data
      .reduce<ShowWithEvents[]>((acc, show) => {
        const events = eventsByShow.get(show.id) || [];
        
        let shouldInclude = false;
        
        // Filter logic
        if (debouncedShowSearch) {
          const searchLower = debouncedShowSearch.toLowerCase();
          const showMatches = show.name.toLowerCase().includes(searchLower);
          const eventMatches = events.some((e) =>
            e.title.toLowerCase().includes(searchLower)
          );
          if (showMatches || eventMatches) {
            shouldInclude = true;
          }
        } else {
          // If no search, only include shows that have events
          if (events.length > 0) {
            shouldInclude = true;
          }
        }

        if (shouldInclude) {
          // Get banner image
          const images = showImages[show.id] || [];
          const bannerImage: ShowImage | undefined = images.find((img) => img.is_banner) || images[0];

          acc.push({
            ...show,
            events: events.sort(
              (a, b) =>
                new Date(a.start_dt).getTime() - new Date(b.start_dt).getTime()
            ),
            bannerImage,
          });
        }
        
        return acc;
      }, [])
      .sort((a, b) => {
        // Sort by earliest event date
        if (a.events.length === 0 && b.events.length === 0) return 0;
        if (a.events.length === 0) return 1;
        if (b.events.length === 0) return -1;
        return (
          new Date(a.events[0].start_dt).getTime() -
          new Date(b.events[0].start_dt).getTime()
        );
      });

    return result;
  }, [
    showsData?.data,
    showModeEventsData?.data,
    showImages,
    debouncedShowSearch,
    showStatusFilter,
    showDateFilter,
    showPastEvents,
  ]);

  const handleEventClick = useCallback((event: Event) => {
    navigate({
      to: "/ticketing/events/$eventId/inventory",
      params: { eventId: event.id },
    });
  }, [navigate]);



  const clearShowFilters = useCallback(() => {
    setShowSearch("");
    setShowStatusFilter("all");
    setShowDateFilter({ startDate: null, endDate: null });
    setShowPastEvents(false);
  }, []);

  const clearEventFilters = useCallback(() => {
    setEventSearch("");
    setEventStatusFilter("all");
    setEventDateFilter({ startDate: null, endDate: null });
    setEventPastEvents(false);
    // setTimelineSource(null);
  }, []);


  const hasShowFilters = !!(showSearch ||
    showStatusFilter !== "all" ||
    showDateFilter.startDate ||
    showDateFilter.endDate ||
    showPastEvents);


  // Filter events for event mode
  const eventModeFilteredEvents = useMemo(() => {
    if (!eventModeEventsData?.data) return [];

    // Create a lookup map for shows to efficiently attach show details
    const showsMap = new Map(showsData?.data?.map(s => [s.id, s]));

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // First attach show information to all events, then filter
    const eventsWithShows = eventModeEventsData.data.map(event => {
      const show = showsMap.get(event.show_id);
      if (show) {
        return {
          ...event,
          show: {
            id: show.id,
            name: show.name
          }
        };
      }
      return event;
    });

    return eventsWithShows.filter((event) => {
      const eventDate = new Date(event.start_dt);
      eventDate.setHours(0, 0, 0, 0);

      // Filter out past events unless eventPastEvents is true
      if (!eventPastEvents && eventDate < now) return false;

      // Filter out inactive events
      if (event.is_active === false) return false;

      // Filter by status dropdown when no timeline source is selected (timeline source filtering is done at API level)
      if (timelineSource === null && eventStatusFilter !== "all" && event.status !== eventStatusFilter) {
        return false;
      }

      // Filter by date range (parse as local date to avoid UTC boundary issues)
      if (eventDateFilter.startDate) {
        const startDate = new Date(eventDateFilter.startDate + "T00:00:00");
        if (eventDate < startDate) return false;
      }

      if (eventDateFilter.endDate) {
        const endDate = new Date(eventDateFilter.endDate + "T23:59:59.999");
        if (eventDate > endDate) return false;
      }

      return true;
    }).sort((a, b) =>
      new Date(a.start_dt).getTime() - new Date(b.start_dt).getTime()
    );
  }, [
    eventModeEventsData?.data,
    showsData?.data,
    eventStatusFilter,
    eventDateFilter,
    eventPastEvents,
    timelineSource,
  ]);

  // Filter events for calendar mode
  const calendarModeFilteredEvents = useMemo(() => {
    if (!calendarModeEventsData?.data) return [];

    // Create a lookup map for shows to efficiently attach show details
    const showsMap = new Map(showsData?.data?.map(s => [s.id, s]));

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return calendarModeEventsData.data.filter((event) => {
      const eventDate = new Date(event.start_dt);
      eventDate.setHours(0, 0, 0, 0);

      // Filter out past events (calendar mode shows past events by default for now)
      if (eventDate < now) return false;

      // Filter out inactive events
      if (event.is_active === false) return false;

      return true;
    }).map(event => {
      // Attach show information if available
      const show = showsMap.get(event.show_id);
      if (show) {
        return {
          ...event,
          show: {
            id: show.id,
            name: show.name
          }
        };
      }
      return event;
    }).sort((a, b) =>
      new Date(a.start_dt).getTime() - new Date(b.start_dt).getTime()
    );
  }, [
    calendarModeEventsData?.data,
    showsData?.data,
  ]);

  const isLoading = layoutMode === "show"
    ? showsLoading || showModeEventsLoading
    : layoutMode === "event"
      ? eventModeEventsLoading
      : calendarModeEventsLoading;
  const totalEvents = showsWithEvents.reduce(
    (sum, show) => sum + show.events.length,
    0
  );

  const handleShowClick = useCallback((show: ShowWithEvents) => {
    setSelectedShowForSheet(show);
    setShowEventsSheetOpen(true);
  }, []);

  const handleDateClick = useCallback((date: Date, events: Event[]) => {
    setSelectedDayDate(date);
    setSelectedDayEvents(events);
    setDayEventsSheetOpen(true);
  }, []);

  const handleBookNow = useCallback((event: Event) => {
    setBookingInitialShowId(event.show?.id || (event as any).show_id || null);
    setBookingInitialEventId(event.id);
    setCreateBookingOpen(true);
  }, []);

  const handleCreateBookingSubmit = useCallback(async (input: CreateBookingInput) => {
    try {
      await createBookingMutation.mutateAsync(input);
      toast({ title: "Success", description: "Booking created successfully" });
      setCreateBookingOpen(false);
    } catch (err) {
       toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to create booking",
          variant: "destructive",
        });
        throw err;
    }
  }, [createBookingMutation]);


  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 max-w-3xl">
          {layoutMode === "show" ? (
            <ShowFilters
              search={showSearch}
              onSearchChange={setShowSearch}
              statusFilter={showStatusFilter}
              onStatusFilterChange={setShowStatusFilter}
              dateFilter={showDateFilter}
              onDateFilterChange={setShowDateFilter}
              showPastEvents={showPastEvents}
              onShowPastEventsChange={setShowPastEvents}
              onClearFilters={clearShowFilters}
            />
          ) : layoutMode === "event" ? (
            <EventFilters
              search={eventSearch}
              onSearchChange={setEventSearch}
              statusFilter={eventStatusFilter}
              onStatusFilterChange={setEventStatusFilter}
              dateFilter={eventDateFilter}
              onDateFilterChange={setEventDateFilter}
              showPastEvents={eventPastEvents}
              onShowPastEventsChange={setEventPastEvents}
              onClearFilters={clearEventFilters}
              events={timelineEventsData?.data || []}
              onTimelineSourceChange={setTimelineSource}
            />
          ) : (
             <h1 className="text-2xl font-bold tracking-tight h-10 flex items-center">Explore Calendar</h1>
          )}
        </div>
        {/* Layout Toggle */}
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex border rounded-md">
            <Button
              variant={layoutMode === "show" ? "default" : "ghost"}
              size="icon"
              onClick={() => setLayoutMode("show")}
              className="rounded-none rounded-l-md border-r h-8 w-8 px-0"
              title="Show Layout"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={layoutMode === "event" ? "default" : "ghost"}
              size="icon"
              onClick={() => setLayoutMode("event")}
              className="rounded-none border-r h-8 w-8 px-0"
              title="Event Layout"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={layoutMode === "calendar" ? "default" : "ghost"}
              size="icon"
              onClick={() => setLayoutMode("calendar")}
              className="rounded-none rounded-r-md h-8 w-8 px-0"
              title="Calendar Layout"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>




      {/* Results Count */}
      {layoutMode !== "calendar" && (
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            "Loading events..."
          ) : layoutMode === "show" ? (
            <>
              Showing {showsWithEvents.length} show{showsWithEvents.length !== 1 ? "s" : ""} with{" "}
              {totalEvents} event{totalEvents !== 1 ? "s" : ""}
            </>
          ) : (
            <>
              Showing {eventModeFilteredEvents.length} event{eventModeFilteredEvents.length !== 1 ? "s" : ""}
            </>
          )}
        </div>
      )}

      {/* Event-Based View */}
      {layoutMode === "event" ? (
        <EventList
          events={eventModeFilteredEvents}
          loading={isLoading}
          error={eventModeEventsLoading ? null : (eventModeEventsData ? null : new Error("Failed to load events"))}
          onEventClick={handleEventClick}
          searchable={false}
          title=""
          description=""
          showViewToggle={false}
          showShowNameInTitle={true}
          customActions={(event) => (
            <div className="flex gap-2">
              {event.status === EventStatusEnum.ON_SALE && (
                <Button
                  size="sm"
                  onClick={() => handleBookNow(event)}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
              )}
            </div>
          )}
        />
      ) : layoutMode === "calendar" ? (
        <ExploreCalendar
          events={calendarModeFilteredEvents}
          onEventClick={handleBookNow}
          onDateClick={handleDateClick}
        />
      ) : (
        <>
          <ShowList
            isLoading={isLoading}
            shows={showsWithEvents}
            hasActiveFilters={hasShowFilters}
            onClearFilters={clearShowFilters}
            onShowClick={handleShowClick}
          />
        </>
      )}

      {/* Show Events Sheet */}
      <ShowEventsSheet
        open={showEventsSheetOpen}
        onOpenChange={setShowEventsSheetOpen}
        show={selectedShowForSheet}
        onEventClick={handleEventClick}
        onBookNow={handleBookNow}
      />

      {/* Day Events Sheet */}
      <DayEventsSheet
        open={dayEventsSheetOpen}
        onOpenChange={setDayEventsSheetOpen}
        date={selectedDayDate}
        events={selectedDayEvents}
        onEventClick={handleEventClick}
        onBookNow={handleBookNow}
      />

      <CreateBookingDialog
        open={createBookingOpen}
        onOpenChange={setCreateBookingOpen}
        onSubmit={handleCreateBookingSubmit}
        initialShowId={bookingInitialShowId}
        initialEventId={bookingInitialEventId}
      />
    </div>
  );
}
