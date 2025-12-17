import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSettingsPage } from "../../pages/settings/appearance-settings";
import { RootLayout } from "../../components/layouts/root-layout";
import { SettingsLayout } from "../../components/layouts/settings-layout";

function AppearanceSettingsRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <AppearanceSettingsPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/appearance")({
  component: AppearanceSettingsRoute,
});
