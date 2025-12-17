import { createFileRoute } from "@tanstack/react-router";
import { NotificationsSettingsPage } from "../../pages/settings/notifications-settings";
import { RootLayout } from "../../components/layouts/root-layout";
import { SettingsLayout } from "../../components/layouts/settings-layout";

function NotificationsSettingsRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <NotificationsSettingsPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/notifications")({
  component: NotificationsSettingsRoute,
});
