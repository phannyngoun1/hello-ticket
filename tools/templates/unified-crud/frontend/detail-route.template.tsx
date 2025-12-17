import { createFileRoute } from "@tanstack/react-router";
import { View{{EntityName}}Page } from "../../../pages/{{ParentRoute}}/view-{{EntityNameKebab}}-page";

export const Route = createFileRoute("{{RoutePath}}/$id")({
  component: View{{EntityName}}Page,
});

