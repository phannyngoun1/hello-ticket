import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import {
  Calendar,
  Ticket,
  DollarSign,
  Activity,
  ArrowRight,
  RefreshCw,
  Users,
  Home,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  MetricCard,
  ActivityFeed,
  type ActivityItem,
  BarChart,
  LineChart,
  PieChart,
  type ChartDataPoint,
} from "@truths/custom-ui";
import {
  DashboardService,
  RECENT_EVENTS_BOOKINGS_TITLE,
  type DashboardAnalytics,
  type RevenueAnalytics,
  type DashboardFilters,
} from "@truths/shared";
import { useRequireAuth } from "../hooks/use-require-auth";

export function HomePage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [revenueTrends, setRevenueTrends] = useState<RevenueAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30");

  // Check authentication on mount
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

      // Load dashboard analytics and revenue trends in parallel
      const [analyticsData, revenueData] = await Promise.all([
        DashboardService.getAnalytics(filters),
        DashboardService.getRevenueAnalytics({
          ...filters,
          group_by: "month",
        }).catch(() => [] as RevenueAnalytics[]), // Fallback to empty array if revenue analytics fails
      ]);

      setAnalytics(analyticsData);
      setRevenueTrends(revenueData);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, loadAnalytics]);

  const formatActivityItems = (
    analytics: DashboardAnalytics
  ): ActivityItem[] => {
    type ActivityItemWithDate = ActivityItem & { created_at: string };
    const items: ActivityItemWithDate[] = [];

    // Recent events
    analytics.recent_events.forEach((event) => {
      items.push({
        id: `event-${event.id}`,
        type: "info",
        title: `Event Created: ${event.title}`,
        description: `Status: ${event.status}`,
        timestamp: new Date(event.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        created_at: event.created_at,
      });
    });

    // Recent bookings
    analytics.recent_bookings.forEach((booking) => {
      items.push({
        id: `booking-${booking.id}`,
        type: "success",
        title: `New Booking: ${booking.customer_name}`,
        description: `${DashboardService.formatCurrency(booking.total_amount)} - ${booking.status}`,
        timestamp: new Date(booking.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        created_at: booking.created_at,
      });
    });

    // Recent payments
    analytics.recent_payments.forEach((payment) => {
      items.push({
        id: `payment-${payment.id}`,
        type: "success",
        title: `Payment Received`,
        description: `${DashboardService.formatCurrency(payment.amount)} - ${payment.status}`,
        timestamp: new Date(payment.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        created_at: payment.created_at,
      });
    });

    return items
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10);
  };

  const getEventStatusChartData = (
    analytics: DashboardAnalytics
  ): ChartDataPoint[] => {
    return Object.entries(analytics.event_status_breakdown).map(
      ([status, count]) => ({
        label:
          status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
        value: count,
        color:
          status === "published"
            ? "#22c55e"
            : status === "draft"
              ? "#f59e0b"
              : status === "cancelled"
                ? "#ef4444"
                : "#6b7280",
      })
    );
  };

  const getBookingStatusChartData = (
    analytics: DashboardAnalytics
  ): ChartDataPoint[] => {
    return Object.entries(analytics.booking_status_breakdown).map(
      ([status, count]) => ({
        label:
          status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
        value: count,
        color:
          status === "confirmed"
            ? "#22c55e"
            : status === "pending"
              ? "#f59e0b"
              : status === "cancelled"
                ? "#ef4444"
                : "#6b7280",
      })
    );
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t("pages.home.title")}</h1>
          <p className="text-muted-foreground">{t("pages.home.subtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t("pages.home.title")}</h1>
          <p className="text-muted-foreground">{t("pages.home.subtitle")}</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Unable to Load Dashboard
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {error ||
                "Something went wrong while loading your dashboard data."}
            </p>
            <Button onClick={loadAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="overview" className="space-y-8">
        {/* Header and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">{t("pages.home.title")}</h3>
          </div>

          <div className="flex items-center gap-1">
            <TabsList className="inline-flex h-8 items-center justify-center rounded-md bg-muted p-0.5 text-muted-foreground">
              <TabsTrigger
                value="overview"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1.5 hover:bg-muted/50"
                title={`View dashboard overview with key metrics and ${RECENT_EVENTS_BOOKINGS_TITLE.toLowerCase()}`}
              >
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1.5 hover:bg-muted/50"
                title="Detailed analytics and performance metrics"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="operations"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-1.5 hover:bg-muted/50"
                title="Operational insights and status distributions"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Operations</span>
              </TabsTrigger>
            </TabsList>

            <Select
              value={dateRange}
              onValueChange={setDateRange}
              disabled={loading}
            >
              <SelectTrigger className="w-[120px] h-7">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="year">YTD</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={loadAnalytics}
              variant="outline"
              size="sm"
              disabled={loading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-8">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Events"
              value={DashboardService.formatNumber(analytics.total_events)}
              change={analytics.events_growth}
              changeType={analytics.events_growth > 0 ? "positive" : "negative"}
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              description={`${analytics.upcoming_events} upcoming, ${analytics.active_events} active`}
            />

            <MetricCard
              title="Total Bookings"
              value={DashboardService.formatNumber(analytics.total_bookings)}
              change={analytics.bookings_growth}
              changeType={
                analytics.bookings_growth > 0 ? "positive" : "negative"
              }
              icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
              description={`${analytics.bookings_this_month} this month`}
            />

            <MetricCard
              title="Total Revenue"
              value={DashboardService.formatCurrency(analytics.total_revenue)}
              change={analytics.revenue_growth}
              changeType={
                analytics.revenue_growth > 0 ? "positive" : "negative"
              }
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              description={`${DashboardService.formatCurrency(analytics.revenue_this_month)} this month`}
            />

            <MetricCard
              title="Active Customers"
              value={DashboardService.formatNumber(analytics.active_customers)}
              change={analytics.customers_growth}
              changeType={
                analytics.customers_growth > 0 ? "positive" : "negative"
              }
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              description={`${analytics.new_customers_this_month} new this month`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <LineChart
                data={revenueTrends.map((trend) => ({
                  label: trend.period,
                  value: trend.revenue,
                }))}
                title="Revenue Overview"
                height={350}
                color="#22c55e"
              />
            </div>
            <div className="col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Leading shows by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.top_shows_by_revenue
                      .slice(0, 5)
                      .map((show, index) => (
                        <div
                          key={show.show_id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="outline"
                              className="w-6 h-6 p-0 flex items-center justify-center"
                            >
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium">
                                {show.show_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {DashboardService.formatCurrency(show.revenue)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-4"
                      asChild
                    >
                      <Link to="/ticketing/shows">
                        View All Shows <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ActivityFeed
              title={RECENT_EVENTS_BOOKINGS_TITLE}
              activities={formatActivityItems(analytics)}
              maxItems={6}
              showMoreLink={
                <Button variant="ghost" size="sm" className="h-auto py-0 text-muted-foreground hover:text-foreground" asChild>
                  <Link to="/activity">
                    Show more <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              }
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Action Center
                </CardTitle>
                <CardDescription>Items ensuring your attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Draft Events
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {analytics.event_status_breakdown.draft || 0} shows
                      pending publication
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/ticketing/shows">Review</Link>
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Pending Bookings
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {analytics.booking_status_breakdown.pending || 0} orders
                      awaiting confirmation
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/sales/bookings">Process</Link>
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      New Customers
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {analytics.new_customers_this_month || 0} joined this
                      month
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/sales/customers">View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LineChart
              data={revenueTrends.map((trend) => ({
                label: trend.period,
                value: trend.revenue,
              }))}
              title="Revenue Trends"
              height={350}
              color="#22c55e"
            />

            <LineChart
              data={revenueTrends.map((trend) => ({
                label: trend.period,
                value: trend.bookings_count,
              }))}
              title="Booking Volume Trends"
              height={350}
              color="#3b82f6"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <BarChart
              data={analytics.top_events_by_bookings.map((event) => ({
                label:
                  event.event_title.length > 15
                    ? `${event.event_title.slice(0, 15)}...`
                    : event.event_title,
                value: event.bookings_count,
              }))}
              title="Top Events by Bookings"
              height={300}
            />

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Ticket Type Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[250px]">
                <p className="text-muted-foreground text-sm">
                  Select an event to view breakdown
                </p>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Average Ticket Price
                  </span>
                  <span className="text-2xl font-bold">
                    {analytics.average_ticket_price > 0
                      ? DashboardService.formatCurrency(
                          analytics.average_ticket_price
                        )
                      : "$0.00"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Active Users
                  </span>
                  <span className="text-2xl font-bold">
                    {analytics.active_users}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Event Status Breakdown */}
            <PieChart
              data={getEventStatusChartData(analytics)}
              title="Event Status Distribution"
              height={300}
            />

            {/* Booking Status Breakdown */}
            <PieChart
              data={getBookingStatusChartData(analytics)}
              title="Booking Status Distribution"
              height={300}
            />

            {/* Top Venues */}
            <Card>
              <CardHeader>
                <CardTitle>Top Venues</CardTitle>
                <CardDescription>By number of events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.top_venues_by_events?.length > 0 ? (
                    analytics.top_venues_by_events
                      .slice(0, 5)
                      .map((venue, index) => (
                        <div
                          key={venue.venue_id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="w-5 h-5 p-0 flex items-center justify-center rounded-full text-xs"
                            >
                              {index + 1}
                            </Badge>
                            <span className="font-medium text-sm">
                              {venue.venue_name}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {venue.events_count} events
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No venue data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
