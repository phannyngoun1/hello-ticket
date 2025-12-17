import { Card, CardContent, CardHeader, CardTitle, Badge } from "@truths/ui";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

/**
 * Dashboard widgets for analytics and monitoring
 *
 * Features:
 * - Metric cards with trends
 * - Status indicators
 * - Activity feeds
 * - Performance charts
 */

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  description,
  className = "",
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "positive":
        return <TrendingUp className="h-4 w-4" />;
      case "negative":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">
              {change > 0 ? "+" : ""}
              {change}% from last month
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export interface StatusCardProps {
  title: string;
  status: "online" | "offline" | "warning" | "error";
  lastUpdated?: string;
  description?: string;
  className?: string;
}

export function StatusCard({
  title,
  status,
  lastUpdated,
  description,
  className = "",
}: StatusCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "online":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "offline":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
      case "warning":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`${className} ${config.bgColor} ${config.borderColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`flex items-center ${config.color}`}>
            {config.icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Badge variant="outline" className={config.color}>
            {status.toUpperCase()}
          </Badge>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export interface ActivityItem {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

export interface ActivityFeedProps {
  title?: string;
  activities: ActivityItem[];
  maxItems?: number;
  className?: string;
}

export function ActivityFeed({
  title = "Recent Activity",
  activities,
  maxItems = 10,
  className = "",
}: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </span>
                  {activity.user && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {activity.user}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export interface QuickStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    revenue: number;
    growth: number;
  };
  className?: string;
}

export function QuickStats({ stats, className = "" }: QuickStatsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <MetricCard
        title="Total Users"
        value={stats.totalUsers.toLocaleString()}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        change={stats.growth}
        changeType={stats.growth > 0 ? "positive" : "negative"}
      />
      <MetricCard
        title="Active Users"
        value={stats.activeUsers.toLocaleString()}
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Revenue"
        value={`$${stats.revenue.toLocaleString()}`}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Growth"
        value={`${stats.growth > 0 ? "+" : ""}${stats.growth}%`}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        changeType={stats.growth > 0 ? "positive" : "negative"}
      />
    </div>
  );
}
