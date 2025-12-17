import { createFileRoute } from "@tanstack/react-router";
import { RootLayout } from "../../../components/layouts/root-layout";
import { SettingsLayout } from "../../../components/layouts/settings-layout";
import { TestTreePage } from "../../../pages/settings/sales/test-trees-page";

function TestTreesRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <TestTreePage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/sales/test-trees")({
  component: TestTreesRoute,
});

