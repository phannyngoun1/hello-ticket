import { createFileRoute } from "@tanstack/react-router";
import { RootLayout } from "../../../components/layouts/root-layout";
import { SettingsLayout } from "../../../components/layouts/settings-layout";
import { WarehousesListPage } from "../../../pages/settings/inventory/warehouses-list-page";

function WarehousesRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <WarehousesListPage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/inventory/warehouses")({
  component: WarehousesRoute,
});

