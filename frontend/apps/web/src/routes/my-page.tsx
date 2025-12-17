import { createFileRoute } from "@tanstack/react-router";
import { MyPage } from "../pages/my-page";
import { RootLayout } from "../components/layouts/root-layout";

function MyPageRoute() {
  return (
    <RootLayout>
      <MyPage />
    </RootLayout>
  );
}

export const Route = createFileRoute("/my-page")({
  component: MyPageRoute,
});
