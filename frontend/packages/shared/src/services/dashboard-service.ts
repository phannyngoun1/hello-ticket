/**
 * Dashboard Analytics Service
 *
 * Provides methods for fetching dashboard analytics data from the backend API.
 */

import { api } from "@truths/api";

export interface DashboardAnalytics {
  total_events: number;
  upcoming_events: number;
  active_events: number;
  events_this_month: number;
  event_status_breakdown: Record<string, number>;

  total_bookings: number;
  bookings_this_month: number;
  total_revenue: number;
  revenue_this_month: number;
  average_ticket_price: number;
  booking_status_breakdown: Record<string, number>;

  total_customers: number;
  new_customers_this_month: number;
  active_customers: number;

  total_users: number;
  active_users: number;

  recent_events: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    start_dt: string;
  }>;

  recent_bookings: Array<{
    id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;

  recent_payments: Array<{
    id: string;
    amount: number;
    status: string;
    created_at: string;
  }>;

  events_growth: number;
  bookings_growth: number;
  revenue_growth: number;
  customers_growth: number;

  top_events_by_bookings: Array<{
    event_id: string;
    event_title: string;
    bookings_count: number;
  }>;

  top_shows_by_revenue: Array<{
    show_id: string;
    show_name: string;
    revenue: number;
  }>;

  top_venues_by_events: Array<{
    venue_id: string;
    venue_name: string;
    events_count: number;
  }>;
}

export interface EventAnalytics {
  event_id: string;
  total_bookings: number;
  total_revenue: number;
  capacity_utilization: number;
  booking_trends: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
  demographics: Record<string, number>;
  ticket_types_sold: Record<string, number>;
}

export interface RevenueAnalytics {
  period: string;
  revenue: number;
  bookings_count: number;
  average_ticket_price: number;
  growth_percentage: number | null;
}

export interface DashboardFilters {
  start_date?: string;
  end_date?: string;
}

export class DashboardService {
  /**
   * Get comprehensive dashboard analytics
   */
  static async getAnalytics(filters?: DashboardFilters): Promise<DashboardAnalytics> {
    const params = new URLSearchParams();

    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const queryString = params.toString();
    const url = `/api/v1/dashboard/analytics${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<DashboardAnalytics>(url);
    return response;
  }

  /**
   * Get detailed analytics for a specific event
   */
  static async getEventAnalytics(
    eventId: string,
    filters?: DashboardFilters
  ): Promise<EventAnalytics> {
    const params = new URLSearchParams();

    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const queryString = params.toString();
    const url = `/api/v1/dashboard/analytics/events/${eventId}${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<EventAnalytics>(url);
    return response;
  }

  /**
   * Get revenue analytics over time
   */
  static async getRevenueAnalytics(
    filters?: DashboardFilters & { group_by?: 'day' | 'week' | 'month' | 'year' }
  ): Promise<RevenueAnalytics[]> {
    const params = new URLSearchParams();

    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.group_by) params.append('group_by', filters.group_by);

    const queryString = params.toString();
    const url = `/api/v1/dashboard/analytics/revenue${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<RevenueAnalytics[]>(url);
    return response;
  }

  /**
   * Format currency values
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  /**
   * Format percentage values
   */
  static formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  /**
   * Format large numbers with K/M/B suffixes
   */
  static formatNumber(num: number): string {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Get status color for badges
   */
  static getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status.toLowerCase()) {
      case 'active':
      case 'published':
      case 'confirmed':
      case 'completed':
        return 'default';
      case 'draft':
      case 'pending':
        return 'outline';
      case 'cancelled':
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  }
}
