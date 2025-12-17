import { createFileRoute, Navigate } from "@tanstack/react-router";

// Redirect /settings/inventory to /settings/inventory/units by default
export const Route = createFileRoute("/settings/inventory/")({
  component: () => <Navigate to="/settings/inventory/units" replace />,
});

