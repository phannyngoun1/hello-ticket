import { createFileRoute } from "@tanstack/react-router";
import { RootLayout } from "../../../components/layouts/root-layout";
import { SettingsLayout } from "../../../components/layouts/settings-layout";
import { {{EntityName}}Page } from "../../../pages/{{ParentRoute}}/{{EntityNameKebab}}-page";

function {{EntityNamePlural}}Route() {
  return (
    <RootLayout>
      <SettingsLayout>
        <{{EntityName}}Page />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("{{RoutePath}}")({
  component: {{EntityNamePlural}}Route,
});

