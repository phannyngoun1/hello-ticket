import { createFileRoute } from "@tanstack/react-router";
import { CompanyAddressesPage } from "../../pages/settings/company-addresses";
import { RootLayout } from "../../components/layouts/root-layout";
import { SettingsLayout } from "../../components/layouts/settings-layout";

function CompanyAddressesRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <CompanyAddressesPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/company-addresses")({
  component: CompanyAddressesRoute,
});

