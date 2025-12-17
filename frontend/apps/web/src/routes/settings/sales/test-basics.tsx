import { createFileRoute } from "@tanstack/react-router";
import { RootLayout } from "../../../components/layouts/root-layout";
import { SettingsLayout } from "../../../components/layouts/settings-layout";
import { TestBasicPage } from "../../../pages/settings/sales/test-basics-page";

function TestBasicsRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <TestBasicPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/sales/test-basics")({
  component: TestBasicsRoute,
});

