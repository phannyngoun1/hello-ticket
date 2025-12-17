import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "../pages/home";
import { RootLayout } from "../components/layouts/root-layout";

function HomeRoute() {
  return (
    <RootLayout>
      <HomePage />
    </RootLayout>
  );
}

export const Route = createFileRoute("/")({
  component: HomeRoute,
});
