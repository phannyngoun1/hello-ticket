import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@truths/ui";
import { Users, ShoppingCart, TrendingUp } from "lucide-react";
import { useRequireAuth } from "../hooks/use-require-auth";

export function DashboardPage() {
  const { t } = useTranslation();

  // Check authentication on mount
  useRequireAuth();

  const stats = [
    {
      title: "Total Users",
      value: "2,350",
      change: "+12.5%",
      icon: Users,
    },
    {
      title: "Orders",
      value: "1,234",
      change: "+8.2%",
      icon: ShoppingCart,
    },
    {
      title: "Revenue",
      value: "$45,231",
      change: "+15.3%",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("pages.dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("pages.dashboard.overview")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last
                month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">Order #1234 completed</p>
                  <p className="text-sm text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium">
                    Product inventory updated
                  </p>
                  <p className="text-sm text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
                Create new user
              </button>
              <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
                Add product
              </button>
              <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
                View orders
              </button>
              <button className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors">
                Generate report
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
