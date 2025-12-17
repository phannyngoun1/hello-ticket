import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "../components/layouts/root-layout";

function UsersLayout() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}

export const Route = createFileRoute("/users")({
  component: UsersLayout,
});
