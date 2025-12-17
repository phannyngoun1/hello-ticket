import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettingsPage } from "../../pages/settings/security-settings";
import { RootLayout } from "../../components/layouts/root-layout";
import { SettingsLayout } from "../../components/layouts/settings-layout";

function SecuritySettingsRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <SecuritySettingsPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/security")({
  component: SecuritySettingsRoute,
});
