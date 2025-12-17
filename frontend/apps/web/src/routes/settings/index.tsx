import { createFileRoute, Navigate } from "@tanstack/react-router";

// Redirect /settings to /settings/profile by default
export const Route = createFileRoute("/settings/")({
  component: () => <Navigate to="/settings/profile" replace />,
});
