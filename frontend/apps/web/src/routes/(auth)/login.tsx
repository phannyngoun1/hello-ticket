import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "../../pages/login";
import { AuthLayout } from "../../components/layouts/auth-layout";

function LoginRoute() {
  return (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  );
}

export const Route = createFileRoute("/(auth)/login")({
  component: LoginRoute,
});
