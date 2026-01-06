import { Link, useLocation } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
} from "@truths/ui";
import { ChevronRight, LayoutDashboard } from "lucide-react";

import { authService } from "../../services/auth-service";
import { NavigationService } from "../../services/navigation-service";
import { useNavigation } from "../../hooks/use-navigation";
import { resolveIcon } from "../../lib/icon-map";

import type { NavigationItemDTO } from "../../services/navigation-service";

function normalizePath(value?: string) {
  if (!value) return "";
  if (value === "/") return "/";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function pathMatches(current: string, target?: string) {
  if (!target) return false;
  const normalizedTarget = normalizePath(target);
  const normalizedCurrent = normalizePath(current);

  if (normalizedTarget === "/") {
    return normalizedCurrent === "/";
  }

  return (
    normalizedCurrent === normalizedTarget ||
    normalizedCurrent.startsWith(`${normalizedTarget}/`)
  );
}

function renderMenuPanel(item: NavigationItemDTO, locationPath: string) {
  const Icon = resolveIcon(item.icon) || LayoutDashboard;
  const children = Array.isArray(item.children)
    ? item.children.filter((child) => {
        if (!child?.path) return false;
        const childPath = normalizePath(child.path);
        const parentPath = normalizePath(item.path);
        const samePath = childPath === parentPath;
        const sameLabel =
          (child.label || "").trim() === (item.label || "").trim();
        return !(samePath || (sameLabel && samePath));
      })
    : [];

  const childLinks = children.map((child) => {
    const ChildIcon = resolveIcon(child.icon) || Icon;
    const isActiveChild = pathMatches(locationPath, child.path);
    const hasSubItems =
      Array.isArray(child.children) && child.children.length > 0;

    return (
      <li key={`${item.path}-${child.path}`}>
        <Link
          to={child.path}
          className={`group flex items-start gap-3 rounded-lg px-3 py-2 transition-colors duration-150 ${
            isActiveChild
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent/40 hover:text-accent-foreground"
          }`}
        >
          <span
            className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ${
              isActiveChild
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 bg-background text-muted-foreground group-hover:border-border group-hover:bg-accent group-hover:text-accent-foreground"
            }`}
          >
            <ChildIcon className="h-5 w-5" />
          </span>
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium">{child.label}</span>
            {child.description ? (
              <span className="text-xs leading-snug text-muted-foreground">
                {child.description}
              </span>
            ) : null}
          </span>
          {hasSubItems && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70" />
          )}
        </Link>
      </li>
    );
  });

  return (
    <div className="flex w-[420px] flex-col gap-3 p-4 sm:w-[460px]">
      {children.length > 0 ? (
        <ul className="flex flex-col gap-1.5">{childLinks}</ul>
      ) : (
        <Link
          to={item.path}
          className="group flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm font-medium transition-colors duration-150 hover:border-border hover:bg-accent/40 hover:text-accent-foreground"
        >
          <span>Open {item.label}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-accent-foreground" />
        </Link>
      )}
    </div>
  );
}

export function MainNavigationMenu() {
  const location = useLocation();
  const navService = useMemo(() => new NavigationService(), []);
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
  });
  const { data } = useNavigation(navService, { enabled: !!currentUser });
  const navItems = data ?? [];

  if (!navItems.length) {
    return (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <span className="px-3 text-sm text-muted-foreground">Loading…</span>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navItems.map((item) => {
          const Icon = resolveIcon(item.icon) || LayoutDashboard;
          const hasChildren =
            Array.isArray(item.children) && item.children.length > 0;
          const isActive = pathMatches(location.pathname, item.path);

          if (!hasChildren) {
            return (
              <NavigationMenuItem key={item.path}>
                <NavigationMenuLink asChild>
                  <Link
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={item.path}>
              <NavigationMenuTrigger
                className={`group inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{item.label}</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent className="rounded-lg border border-border/60 bg-background/95 shadow-lg">
                {renderMenuPanel(item, location.pathname)}
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
      <NavigationMenuViewport className="rounded-lg border border-border/60 bg-background/95 shadow-lg" />
    </NavigationMenu>
  );
}
