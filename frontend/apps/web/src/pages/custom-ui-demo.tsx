import React from "react";
import {
  DataTable,
  CustomForm,
  MetricCard,
  StatusCard,
  ActivityFeed,
  QuickStats,
  type DataRow,
  type FormField,
  type ActivityItem,
} from "@truths/custom-ui";

/**
 * Demo page showcasing all custom-ui components
 */

// Sample data
const sampleData: DataRow[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    department: "Engineering",
    status: "active",
    revenue: 150000,
    createdAt: "2024-01-15",
    lastLogin: "2024-01-20",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    department: "Marketing",
    status: "pending",
    revenue: 120000,
    createdAt: "2024-01-16",
    lastLogin: "2024-01-19",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    department: "Sales",
    status: "inactive",
    revenue: 95000,
    createdAt: "2024-01-10",
    lastLogin: "2024-01-18",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
    department: "Engineering",
    status: "active",
    revenue: 180000,
    createdAt: "2024-01-12",
    lastLogin: "2024-01-21",
  },
];

const formFields: FormField[] = [
  {
    id: "name",
    name: "name",
    type: "text",
    label: "Full Name",
    placeholder: "Enter your full name",
    required: true,
  },
  {
    id: "email",
    name: "email",
    type: "email",
    label: "Email Address",
    placeholder: "Enter your email",
    required: true,
  },
  {
    id: "department",
    name: "department",
    type: "select",
    label: "Department",
    required: true,
    options: [
      { value: "engineering", label: "Engineering" },
      { value: "marketing", label: "Marketing" },
      { value: "sales", label: "Sales" },
      { value: "hr", label: "Human Resources" },
    ],
  },
  {
    id: "role",
    name: "role",
    type: "select",
    label: "Role",
    required: true,
    options: [
      { value: "admin", label: "Administrator" },
      { value: "manager", label: "Manager" },
      { value: "employee", label: "Employee" },
    ],
  },
  {
    id: "notifications",
    name: "notifications",
    type: "switch",
    label: "Enable email notifications",
  },
  {
    id: "bio",
    name: "bio",
    type: "textarea",
    label: "Bio",
    placeholder: "Tell us about yourself...",
  },
];

const activities: ActivityItem[] = [
  {
    id: "1",
    type: "success",
    title: "User created",
    description: "New user account created successfully",
    timestamp: "2 minutes ago",
    user: "Admin",
  },
  {
    id: "2",
    type: "info",
    title: "System update",
    description: "System updated to version 2.1.0",
    timestamp: "1 hour ago",
  },
  {
    id: "3",
    type: "warning",
    title: "High memory usage",
    description: "Server memory usage is above 80%",
    timestamp: "3 hours ago",
  },
  {
    id: "4",
    type: "error",
    title: "Database connection failed",
    description: "Unable to connect to primary database",
    timestamp: "5 hours ago",
  },
  {
    id: "5",
    type: "success",
    title: "Backup completed",
    description: "Daily backup completed successfully",
    timestamp: "6 hours ago",
  },
];

export function CustomUIDemo() {
  const handleFormSubmit = (values: Record<string, any>) => {
    alert("Form submitted! Check console for values.");
  };

  const handleFormSave = (values: Record<string, any>) => {
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Custom UI Components Demo</h1>
        <p className="text-lg text-muted-foreground">
          Showcasing enterprise-grade custom components
        </p>
      </div>

      {/* Quick Stats Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Quick Stats</h2>
        <QuickStats
          stats={{
            totalUsers: 1250,
            activeUsers: 890,
            revenue: 45000,
            growth: 12.5,
          }}
        />
      </section>

      {/* Individual Metric Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Metric Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Total Revenue"
            value="$45,000"
            change={8.2}
            changeType="positive"
            description="Monthly recurring revenue"
          />
          <MetricCard
            title="Active Users"
            value="890"
            change={-2.1}
            changeType="negative"
            description="Users active in the last 30 days"
          />
          <MetricCard
            title="Conversion Rate"
            value="3.2%"
            change={0.5}
            changeType="positive"
            description="Overall conversion rate"
          />
        </div>
      </section>

      {/* Status Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="API Status"
            status="online"
            lastUpdated="2 minutes ago"
            description="All systems operational"
          />
          <StatusCard
            title="Database"
            status="warning"
            lastUpdated="5 minutes ago"
            description="High connection count"
          />
          <StatusCard
            title="CDN"
            status="online"
            lastUpdated="1 minute ago"
            description="Global CDN operational"
          />
          <StatusCard
            title="Monitoring"
            status="error"
            lastUpdated="10 minutes ago"
            description="Service unavailable"
          />
        </div>
      </section>

      {/* Data Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Data Table</h2>
        <DataTable
          data={sampleData}
          title="User Management"
          description="Manage users and their information with advanced filtering and sorting"
        />
      </section>

      {/* Custom Form */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Custom Form</h2>
        <CustomForm
          title="User Profile"
          description="Update your profile information with auto-save functionality"
          fields={formFields}
          onSubmit={handleFormSubmit}
          onSave={handleFormSave}
          autoSave={true}
          autoSaveDelay={3000}
        />
      </section>

      {/* Activity Feed */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Activity Feed</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed
            title="System Activity"
            activities={activities}
            maxItems={5}
          />
          <ActivityFeed
            title="User Activity"
            activities={activities.slice(0, 3)}
            maxItems={3}
          />
        </div>
      </section>

      {/* Usage Instructions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Usage Instructions</h2>
        <div className="bg-muted/50 p-6 rounded-lg space-y-4">
          <div>
            <h3 className="font-semibold">Installation</h3>
            <code className="text-sm bg-background px-2 py-1 rounded">
              npm install @truths/custom-ui
            </code>
          </div>
          <div>
            <h3 className="font-semibold">Basic Usage</h3>
            <pre className="text-sm bg-background p-4 rounded overflow-x-auto">
              {`import { DataTable } from '@truths/custom-ui';

function MyComponent() {
  return (
    <DataTable
      data={myData}
      title="My Data"
      description="Custom data display"
    />
  );
}`}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold">Available Components</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <code>DataTable</code> - High-performance data table
              </li>
              <li>
                <code>CustomForm</code> - Advanced form with validation
              </li>
              <li>
                <code>MetricCard</code> - Display metrics with trends
              </li>
              <li>
                <code>StatusCard</code> - System status indicators
              </li>
              <li>
                <code>ActivityFeed</code> - Activity timeline
              </li>
              <li>
                <code>QuickStats</code> - Dashboard statistics
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
