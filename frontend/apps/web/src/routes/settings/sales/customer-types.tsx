import { createFileRoute } from "@tanstack/react-router";
import { RootLayout } from "../../../components/layouts/root-layout";
import { SettingsLayout } from "../../../components/layouts/settings-layout";
import { CustomerTypePage } from "../../../pages/settings/sales/customer-types-page";

function CustomerTypesRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <CustomerTypePage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/sales/customer-types")({
  component: CustomerTypesRoute,
});

