import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "../../components/layouts/root-layout";

function CustomerLayout() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}

export const Route = createFileRoute("/sales/customers")({
  component: CustomerLayout,
});
