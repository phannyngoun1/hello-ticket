import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "../../components/layouts/root-layout";

function VenueLayout() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}

export const Route = createFileRoute("/ticketing/venues")({
  component: VenueLayout,
});

