/**
 * Sales Explore Page
 * 
 * Browse and book available and upcoming shows with their events
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, List, Grid3x3, X, Ticket } from "lucide-react";
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
import { 
  EventProvider, 
  useEventService, 
  useEvents,
  EventList,
  type Event,
  type EventStatus,
  EventStatus as EventStatusEnum,
} from "@truths/ticketing";
import {
  ShowProvider,
  useShowService,
  useShows,
  type ShowImage,
} from "@truths/ticketing";
import { EventsFilterSheet, type DateFilter } from "./components/events-filter-sheet";
import { api } from "@truths/api";
import { ShowEventsSheet } from "./components/show-events-sheet";
import { ShowList, type ShowWithEvents } from "./components/show-list";




function ExplorePageContent() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: null,
    endDate: null,
  });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

  const [showImages, setShowImages] = useState<Record<string, ShowImage[]>>({});
  const [layoutMode, setLayoutMode] = useState<"show" | "event">("show");
  const [selectedShowForSheet, setSelectedShowForSheet] = useState<ShowWithEvents | null>(null);
  const [showEventsSheetOpen, setShowEventsSheetOpen] = useState(false);

  const eventService = useEventService();
  const showService = useShowService();
  
  // Fetch all shows
  const { data: showsData, isLoading: showsLoading } = useShows(showService, {
    pagination: {
      page: 1,
      pageSize: 100,
      total: 0,
      totalPages: 0,
    },
  });

  // Fetch all events (using max allowed limit of 200)
  const { data: eventsData, isLoading: eventsLoading } = useEvents(eventService, {
    filter: {
      search: search || undefined,
    },
    pagination: {
      page: 1,
      pageSize: 200, // API maximum limit
      total: 0,
      totalPages: 0,
    },
  });

  // Fetch banner images for shows (with rate limiting protection)
  useEffect(() => {
    if (showsData?.data && showsData.data.length > 0) {
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
  }, [showsData?.data, showService]);

  // Group events by show and filter
  const showsWithEvents = useMemo(() => {
    if (!showsData?.data || !eventsData?.data) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Filter events
    const filteredEvents = eventsData.data.filter((event) => {
      const eventDate = new Date(event.start_dt);
      eventDate.setHours(0, 0, 0, 0);

      // Filter out past events unless showPastEvents is true
      if (!showPastEvents && eventDate < now) return false;

      // Filter out inactive events
      if (event.is_active === false) return false;

      // Filter by status
      if (statusFilter !== "all" && event.status !== statusFilter) return false;

      // Filter by date range
      if (dateFilter.startDate) {
        const startDate = new Date(dateFilter.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (eventDate < startDate) return false;
      }

      if (dateFilter.endDate) {
        const endDate = new Date(dateFilter.endDate);
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
        if (search) {
          const searchLower = search.toLowerCase();
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
    eventsData?.data,
    showImages,
    search,
    statusFilter,
    dateFilter,
    selectedDate,
    showPastEvents,
  ]);

  const handleEventClick = useCallback((event: Event) => {
    navigate({
      to: "/ticketing/events/$eventId/inventory",
      params: { eventId: event.id },
    });
  }, [navigate]);

  const handleBookNow = useCallback((event: Event) => {
    navigate({
      to: "/ticketing/events/$eventId/inventory",
      params: { eventId: event.id },
    });
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter({ startDate: null, endDate: null });
    setSelectedDate(null);
    setShowPastEvents(false);
  }, []);

  const hasActiveFilters =
    search ||
    statusFilter !== "all" ||
    dateFilter.startDate ||
    dateFilter.endDate ||
    selectedDate;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };



  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  };



  // Filter events for event-based view
  const filteredEvents = useMemo(() => {
    if (!eventsData?.data) return [];

    // Create a lookup map for shows to efficiently attach show details
    const showsMap = new Map(showsData?.data?.map(s => [s.id, s]));

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return eventsData.data.filter((event) => {
      const eventDate = new Date(event.start_dt);
      eventDate.setHours(0, 0, 0, 0);

      // Filter out past events unless showPastEvents is true
      if (!showPastEvents && eventDate < now) return false;

      // Filter out inactive events
      if (event.is_active === false) return false;

      // Filter by status
      if (statusFilter !== "all" && event.status !== statusFilter) return false;

      // Filter by date range
      if (dateFilter.startDate) {
        const startDate = new Date(dateFilter.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (eventDate < startDate) return false;
      }

      if (dateFilter.endDate) {
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (eventDate > endDate) return false;
      }

      // Filter by selected date
      if (selectedDate) {
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        if (eventDate.getTime() !== selected.getTime()) return false;
      }

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        if (!event.title.toLowerCase().includes(searchLower)) return false;
      }

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
    eventsData?.data,
    showsData?.data,
    search,
    statusFilter,
    dateFilter,
    selectedDate,
    showPastEvents,
  ]);

  const isLoading = showsLoading || eventsLoading;
  const totalEvents = showsWithEvents.reduce(
    (sum, show) => sum + show.events.length,
    0
  );

  const handleShowClick = useCallback((show: ShowWithEvents) => {
    setSelectedShowForSheet(show);
    setShowEventsSheetOpen(true);
  }, []);


  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
          <p className="text-muted-foreground mt-1">
            Browse and book available and upcoming shows
          </p>
        </div>
        {/* Layout Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Layout:</span>
          <div className="flex border rounded-md">
            <Button
              variant={layoutMode === "show" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLayoutMode("show")}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Show Based
            </Button>
            <Button
              variant={layoutMode === "event" ? "default" : "ghost"}
              size="sm"
              onClick={() => setLayoutMode("event")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4 mr-2" />
              Event Based
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search shows or events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as EventStatus | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={EventStatusEnum.ON_SALE}>On Sale</SelectItem>
            <SelectItem value={EventStatusEnum.PUBLISHED}>Published</SelectItem>
            <SelectItem value={EventStatusEnum.SOLD_OUT}>Sold Out</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Button */}
        <EventsFilterSheet
          open={filterSheetOpen}
          onOpenChange={setFilterSheetOpen}
          hasActiveFilters={!!hasActiveFilters}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          showPastEvents={showPastEvents}
          setShowPastEvents={setShowPastEvents}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <button
                onClick={() => setSearch("")}
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
                onClick={() => setStatusFilter("all")}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateFilter.startDate && (
            <Badge variant="secondary" className="gap-1">
              From: {formatDate(new Date(dateFilter.startDate))}
              <button
                onClick={() =>
                  setDateFilter((prev) => ({ ...prev, startDate: null }))
                }
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateFilter.endDate && (
            <Badge variant="secondary" className="gap-1">
              To: {formatDate(new Date(dateFilter.endDate))}
              <button
                onClick={() =>
                  setDateFilter((prev) => ({ ...prev, endDate: null }))
                }
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedDate && (
            <Badge variant="secondary" className="gap-1">
              Date: {formatDate(new Date(selectedDate))}
              <button
                onClick={() => setSelectedDate(null)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
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
            Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          </>
        )}
      </div>

      {/* Event-Based View */}
      {layoutMode === "event" ? (
        <EventList
          events={filteredEvents}
          loading={isLoading}
          error={eventsLoading ? null : (eventsData ? null : new Error("Failed to load events"))}
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
      ) : (
        <>
          <ShowList 
            isLoading={isLoading}
            shows={showsWithEvents}
            hasActiveFilters={!!hasActiveFilters}
            onClearFilters={clearFilters}
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
    </div>
  );
}

// Wrapper component with providers
export function ExplorePageWithProvider() {
  return (
    <ShowProvider
      config={{
        apiClient: api,
        endpoints: {
          shows: "/api/v1/ticketing/shows",
        },
      }}
    >
      <EventProvider
        config={{
          apiClient: api,
          endpoints: {
            events: "/api/v1/ticketing/events",
          },
        }}
      >
        <ExplorePageContent />
      </EventProvider>
    </ShowProvider>
  );
}
