import { createFileRoute } from "@tanstack/react-router";
import { LanguageSettingsPage } from "../../pages/settings/language-settings";
import { RootLayout } from "../../components/layouts/root-layout";
import { SettingsLayout } from "../../components/layouts/settings-layout";

function LanguageSettingsRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <LanguageSettingsPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/language")({
  component: LanguageSettingsRoute,
});
