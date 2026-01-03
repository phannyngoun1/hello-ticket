import { createFileRoute } from "@tanstack/react-router";
import { RootLayout } from "../../../components/layouts/root-layout";
import { SettingsLayout } from "../../../components/layouts/settings-layout";
import { VenueTypePage } from "../../../pages/settings/ticketing/venue-types-page";

function VenueTypesRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <VenueTypePage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/ticketing/venue-types")({
  component: VenueTypesRoute,
});

