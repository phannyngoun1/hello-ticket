import { createFileRoute } from "@tanstack/react-router";
import { AccountSettingsPage } from "../../pages/settings/account-settings";
import { RootLayout } from "../../components/layouts/root-layout";
import { SettingsLayout } from "../../components/layouts/settings-layout";

function AccountSettingsRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <AccountSettingsPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/account")({
  component: AccountSettingsRoute,
});
