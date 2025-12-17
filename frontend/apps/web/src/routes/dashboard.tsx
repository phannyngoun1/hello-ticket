import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "../pages/dashboard";
import { RootLayout } from "../components/layouts/root-layout";

function DashboardRoute() {
  return (
    <RootLayout>
      <DashboardPage />
    </RootLayout>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});
