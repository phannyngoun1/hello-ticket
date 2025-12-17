import { createFileRoute } from "@tanstack/react-router";
import { ViewUserPage } from "../../pages/users/view-user-page";

export const Route = createFileRoute("/users/$id")({
  component: ViewUserPage,
});
