import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Button,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from "@truths/ui";
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  Search,
  ChevronRight,
  Calendar,
  Ticket,
  CreditCard,
} from "lucide-react";
import {
  DashboardService,
  RECENT_EVENTS_BOOKINGS_TITLE,
  type DashboardAnalytics,
  type DashboardFilters,
} from "@truths/shared";
import { useRequireAuth } from "../hooks/use-require-auth";
import { cn } from "@truths/ui/lib/utils";

const PAGE_SIZE = 10;

type ActivityCategory = "event" | "booking" | "payment";

interface ActivityEntry {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  timestamp: string;
  timestampIso: string;
  link?: string;
}

function formatActivityItems(analytics: DashboardAnalytics): ActivityEntry[] {
  const items: ActivityEntry[] = [];

  analytics.recent_events.forEach((event) => {
    items.push({
      id: `event-${event.id}`,
      category: "event",
      title: `Event Created: ${event.title}`,
      description: `Status: ${event.status}`,
      timestampIso: event.created_at,
      timestamp: "",
      link: `/ticketing/events/${event.id}/inventory`,
    });
  });

  analytics.recent_bookings.forEach((booking) => {
    items.push({
      id: `booking-${booking.id}`,
      category: "booking",
      title: `New Booking: ${booking.customer_name}`,
      description: `${DashboardService.formatCurrency(booking.total_amount)} - ${booking.status}`,
      timestampIso: booking.created_at,
      timestamp: "",
      link: `/sales/bookings/${booking.id}`,
    });
  });

  analytics.recent_payments.forEach((payment) => {
    items.push({
      id: `payment-${payment.id}`,
      category: "payment",
      title: "Payment Received",
      description: `${DashboardService.formatCurrency(payment.amount)} - ${payment.status}`,
      timestampIso: payment.created_at,
      timestamp: "",
      link: `/sales/payments/${payment.id}`,
    });
  });

  return items.sort(
    (a, b) =>
      new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime()
  );
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategoryIcon(category: ActivityCategory) {
  switch (category) {
    case "event":
      return <Calendar className="h-4 w-4" />;
    case "booking":
      return <Ticket className="h-4 w-4" />;
    case "payment":
      return <CreditCard className="h-4 w-4" />;
  }
}

export function ActivityLogPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30");
  const [typeFilter, setTypeFilter] = useState<ActivityCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useRequireAuth();

  const getDateFilter = (range: string): DashboardFilters => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case "7":
        start.setDate(end.getDate() - 7);
        break;
      case "30":
        start.setDate(end.getDate() - 30);
        break;
      case "thisMonth":
        start.setDate(1);
        break;
      case "lastMonth":
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setDate(0);
        break;
      case "year":
        start.setMonth(0, 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  };

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = getDateFilter(dateRange);
      const analyticsData = await DashboardService.getAnalytics(filters);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error(`Failed to load ${RECENT_EVENTS_BOOKINGS_TITLE}:`, err);
      setError(`Failed to load ${RECENT_EVENTS_BOOKINGS_TITLE}`);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, loadAnalytics]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [typeFilter, searchQuery]);

  const activityItems = useMemo(() => {
    if (!analytics) return [];
    return formatActivityItems(analytics).map((item) => ({
      ...item,
      timestamp: formatTimestamp(item.timestampIso),
    }));
  }, [analytics]);

  const filteredItems = useMemo(() => {
    let items = activityItems;

    if (typeFilter !== "all") {
      items = items.filter((item) => item.category === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }

    return items;
  }, [activityItems, typeFilter, searchQuery]);

  const displayedItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load {RECENT_EVENTS_BOOKINGS_TITLE}</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{RECENT_EVENTS_BOOKINGS_TITLE}</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <Select value={dateRange} onValueChange={setDateRange} disabled={loading}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="year">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ActivityCategory | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="event">Events</SelectItem>
              <SelectItem value="booking">Bookings</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={loadAnalytics}
            variant="outline"
            size="icon"
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredItems.length > 0 ? (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-0">
            {displayedItems.map((item) => (
              <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                    item.category === "event" && "border-blue-500 text-blue-600",
                    item.category === "booking" && "border-green-500 text-green-600",
                    item.category === "payment" && "border-emerald-500 text-emerald-600"
                  )}
                >
                  {getCategoryIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1 pt-0.5">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.timestamp}
                  </span>
                  {item.link ? (
                    <Link
                      to={item.link}
                      className="group flex items-start justify-between gap-4 rounded py-1 -mx-1 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                    </Link>
                  ) : (
                    <div className="py-1">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                Show more
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery || typeFilter !== "all"
              ? "No results. Try different filters."
              : "No events or bookings for this period."}
          </p>
        </div>
      )}
    </div>
  );
}
