import { LayoutDashboard } from "lucide-react";
import type { NavigationItem } from "@truths/custom-ui";
import type { NavigationItemDTO } from "../navigation-service";
import { resolveIcon } from "../../lib/icon-map";

export const processNavigationItems = (
  navItems: NavigationItemDTO[] | undefined
): NavigationItem[] | undefined => {
  if (!navItems) return undefined;

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const flatten = (
    items: NavigationItemDTO[],
    context?: {
      parentLabel?: string;
      slugPrefix?: string;
      fallbackIcon?: NavigationItem["icon"];
    }
  ): NavigationItem[] => {
    return items.flatMap((item) => {
      const fallbackIcon = context?.fallbackIcon ?? LayoutDashboard;
      const Icon = resolveIcon(item.icon) || fallbackIcon;
      const baseLabel = item.label || item.path;
      const segment = toSlug(baseLabel || "nav-item");
      const slug = context?.slugPrefix
        ? `${context.slugPrefix}-${segment}`
        : segment;

      const entry: NavigationItem = {
        icon: Icon,
        label: item.label,
        value: `nav-${slug}`,
        path: item.path,
        shortcut: item.shortcut,
        description: item.description,
        keywords: item.keywords, // Pass through keywords from server
        parentLabel: context?.parentLabel,
      };

      const children = Array.isArray(item.children)
        ? flatten(item.children, {
            parentLabel: item.label,
            slugPrefix: slug,
            fallbackIcon: Icon,
          })
        : [];

      return [entry, ...children];
    });
  };

  return flatten(navItems);
};

