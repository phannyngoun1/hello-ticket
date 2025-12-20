import { createFileRoute } from "@tanstack/react-router";
import { RootLayout } from "../../../components/layouts/root-layout";
import { SettingsLayout } from "../../../components/layouts/settings-layout";
import { EventTypePage } from "../../../pages/settings/ticketing/event-types-page";

function EventTypesRoute() {
  return (
    <RootLayout>
      <SettingsLayout>
        <EventTypePage />
      </SettingsLayout>
    </RootLayout>
  );
}

export const Route = createFileRoute("/settings/ticketing/event-types")({
  component: EventTypesRoute,
});

