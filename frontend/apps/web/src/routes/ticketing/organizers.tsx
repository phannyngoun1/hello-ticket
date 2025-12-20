import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "../../components/layouts/root-layout";

function OrganizerLayout() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}

export const Route = createFileRoute("/ticketing/organizers")({
  component: OrganizerLayout,
});

