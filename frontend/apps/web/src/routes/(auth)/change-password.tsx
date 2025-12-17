import { createFileRoute } from "@tanstack/react-router";
import { ChangePasswordPage } from "../../pages/change-password";
import { AuthLayout } from "../../components/layouts/auth-layout";

function ChangePasswordRoute() {
  return (
    <AuthLayout>
      <ChangePasswordPage />
    </AuthLayout>
  );
}

export const Route = createFileRoute("/(auth)/change-password")({
  component: ChangePasswordRoute,
});
