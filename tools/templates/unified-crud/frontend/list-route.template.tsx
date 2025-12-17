import { createFileRoute } from "@tanstack/react-router";
import { {{EntityName}}Page } from "../../../pages/{{ParentRoute}}/{{EntityNamePluralLower}}-page";

export const Route = createFileRoute("{{RoutePath}}/")({
  component: {{EntityName}}Page,
});

