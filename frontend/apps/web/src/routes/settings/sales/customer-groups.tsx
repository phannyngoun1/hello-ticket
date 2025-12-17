import { createFileRoute } from "@tanstack/react-router";
import { RootLayout } from "../../../components/layouts/root-layout";
import { SettingsLayout } from "../../../components/layouts/settings-layout";
import { CustomerGroupPage } from "../../../pages/settings/sales/customer-groups-page";

function CustomerGroupsRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <CustomerGroupPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/sales/customer-groups")({
  component: CustomerGroupsRoute,
});

