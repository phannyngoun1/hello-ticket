import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "../pages/profile";
import { RootLayout } from "../components/layouts/root-layout";

function ProfileRoute() {
  return (
    <RootLayout>
      <ProfilePage />
    </RootLayout>
  );
}

export const Route = createFileRoute("/profile")({
  component: ProfileRoute,
});
