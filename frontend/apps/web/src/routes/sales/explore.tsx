import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "../../components/layouts/root-layout";

function ExploreLayout() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}

export const Route = createFileRoute("/sales/explore")({
  component: ExploreLayout,
});
