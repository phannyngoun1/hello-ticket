import { createFileRoute } from "@tanstack/react-router";
import { ActivityLogPage } from "../pages/activity-log-page";
import { RootLayout } from "../components/layouts/root-layout";

function ActivityRoute() {
  return (
    <RootLayout>
      <ActivityLogPage />
    </RootLayout>
  );
}

export const Route = createFileRoute("/activity")({
  component: ActivityRoute,
});
