import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettingsPage } from "../../pages/settings/profile-settings";
import { RootLayout } from "../../components/layouts/root-layout";
import { SettingsLayout } from "../../components/layouts/settings-layout";

function ProfileSettingsRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <ProfileSettingsPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/profile")({
  component: ProfileSettingsRoute,
});
