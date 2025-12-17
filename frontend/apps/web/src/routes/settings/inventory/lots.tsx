import { createFileRoute } from "@tanstack/react-router";
import { RootLayout } from "../../../components/layouts/root-layout";
import { SettingsLayout } from "../../../components/layouts/settings-layout";
import { LotSettingsPage } from "../../../pages/settings/inventory/lot-settings-page";

function LotSettingsRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <LotSettingsPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/inventory/lots")({
  component: LotSettingsRoute,
});

