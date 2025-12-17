import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "../pages/not-found";
import { AuthLayout } from "../components/layouts/auth-layout";

function NotFoundRoute() {
  return (
    <AuthLayout>
      <NotFoundPage />
    </AuthLayout>
  );
}

export const Route = createFileRoute("/$")({
  component: NotFoundRoute,
});
