import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RootLayout } from "../../components/layouts/root-layout";

function PaymentLayout() {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
}

export const Route = createFileRoute("/sales/payments")({
  component: PaymentLayout,
});

