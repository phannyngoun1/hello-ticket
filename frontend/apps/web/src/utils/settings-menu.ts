/**
 * Utility to generate settings menu from route tree
 * This automatically discovers settings routes and builds the menu structure
 */

import { User, Bell, Shield, Palette, Globe, Key, MapPin, Package, TrendingUp, Ruler } from 'lucide-react';
import type { ComponentType } from 'react';

export interface SettingsMenuItem {
    title: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    description?: string;
    children?: SettingsMenuItem[];
}

// Icon mapping for different modules
const moduleIcons: Record<string, ComponentType<{ className?: string }>> = {
    sales: TrendingUp,
    default: Package,
};

// Icon mapping for specific routes
const routeIcons: Record<string, ComponentType<{ className?: string }>> = {
    profile: User,
    account: Shield,
    notifications: Bell,
    appearance: Palette,
    language: Globe,
    security: Key,
    'company-addresses': MapPin,
    sales: TrendingUp,
    units: Ruler,
    'customer-types': User,
};

// Define static menu items (these won't change and need special handling)
const staticMenuItems: SettingsMenuItem[] = [
    {
        title: 'pages.settings.menu.profile',
        href: '/settings/profile',
        icon: User,
        description: 'pages.settings.menu.profileDesc',
    },
    {
        title: 'pages.settings.menu.account',
        href: '/settings/account',
        icon: Shield,
        description: 'pages.settings.menu.accountDesc',
    },
    {
        title: 'pages.settings.menu.notifications',
        href: '/settings/notifications',
        icon: Bell,
        description: 'pages.settings.menu.notificationsDesc',
    },
    {
        title: 'pages.settings.menu.appearance',
        href: '/settings/appearance',
        icon: Palette,
        description: 'pages.settings.menu.appearanceDesc',
    },
    {
        title: 'pages.settings.menu.language',
        href: '/settings/language',
        icon: Globe,
        description: 'pages.settings.menu.languageDesc',
    },
    {
        title: 'pages.settings.menu.security',
        href: '/settings/security',
        icon: Key,
        description: 'pages.settings.menu.securityDesc',
    },
    {
        title: 'pages.settings.menu.companyAddresses',
        href: '/settings/company-addresses',
        icon: MapPin,
        description: 'pages.settings.menu.companyAddressesDesc',
    },
];

/**
 * Extract all settings routes from routeTree.gen.ts
 * 
 * This function maintains a list of settings routes that matches the FileRoutesByFullPath
 * interface in routeTree.gen.ts. Since TypeScript types aren't available at runtime,
 * we maintain this list manually.
 * 
 * To update: Check routeTree.gen.ts FileRoutesByFullPath interface for routes starting
 * with '/settings/' and add them here (excluding static routes handled separately).
 */
function getSettingsRoutesFromRouteTree(): string[] {
    // These routes are extracted from FileRoutesByFullPath in routeTree.gen.ts
    // Dynamic settings routes (excluding static ones like profile, account, etc.)
    return [
        '/settings/sales/customer-types',
    ].sort();
}

/**
 * Generate menu structure from routes
 * Groups routes by module (e.g., /settings/sales/*)
 */
export function generateSettingsMenu(
    routes: string[] | null = null,
    t: (key: string, defaultValue?: string) => string = (key: string, defaultValue?: string) => defaultValue || key
): SettingsMenuItem[] {
    // Get routes from route tree if not provided
    const allRoutes = routes || getSettingsRoutesFromRouteTree();

    // Filter out static routes (already handled)
    const staticPaths = new Set(staticMenuItems.map(item => item.href));
    const dynamicRoutes = allRoutes.filter(route => !staticPaths.has(route) && route.startsWith('/settings/'));

    // Group routes by module
    const moduleGroups: Record<string, string[]> = {};

    dynamicRoutes.forEach(route => {
        // Extract module from route: /settings/sales/customer-types -> sales
        const parts = route.replace('/settings/', '').split('/').filter(Boolean);
        if (parts.length >= 2) {
            const module = parts[0];
            const childRoute = route;
            if (!moduleGroups[module]) {
                moduleGroups[module] = [];
            }
            // Only add if it's not the module index route
            if (parts.length > 1) {
                moduleGroups[module].push(childRoute);
            }
        }
    });

    // Build menu items for each module
    const moduleMenuItems: SettingsMenuItem[] = Object.entries(moduleGroups).map(([module, moduleRoutes]) => {
        const moduleIcon = moduleIcons[module] || moduleIcons.default;
        const moduleLabel = module.charAt(0).toUpperCase() + module.slice(1);

        // Create children for each route in the module
        const children: SettingsMenuItem[] = moduleRoutes.map(route => {
            const routeName = route.split('/').pop() || '';
            const entityName = routeName.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');

            return {
                title: t(`pages.settings.menu.${routeName}`, entityName),
                href: route,
                icon: routeIcons[routeName] || User,
                description: t(`pages.settings.menu.${routeName}Desc`, `Manage ${entityName.toLowerCase()} and related data.`),
            };
        });

        // Check if module has an index route
        const moduleIndexRoute = `/settings/${module}`;

        return {
            title: t(`pages.settings.menu.${module}`, moduleLabel),
            href: moduleIndexRoute,
            icon: moduleIcon,
            description: t(`pages.settings.menu.${module}Desc`, `Manage ${moduleLabel.toLowerCase()} settings`),
            children: children.length > 0 ? children : undefined,
        };
    });

    // Combine static and dynamic menu items
    // Static items should come first
    const allMenuItems: SettingsMenuItem[] = [
        ...staticMenuItems,
        ...moduleMenuItems.sort((a, b) => a.href.localeCompare(b.href)),
    ];

    return allMenuItems;
}

/**
 * Extract settings routes from router instance at runtime
 * Uses the router's route map to find all /settings/* routes
 */
export function getSettingsRoutesFromRouter(router: { routesById?: Record<string, { id?: string; fullPath?: string }> } | null): string[] {
    const routes: string[] = [];

    if (!router) {
        return [];
    }

    try {
        // Type assertion for router to access routesById
        type RouterType = {
            routesById?: Record<string, { id?: string; fullPath?: string }>;
        };
        const routerObj = router as RouterType;
        const routesById = routerObj?.routesById;

        if (routesById && typeof routesById === 'object') {
            Object.values(routesById).forEach((route) => {
                const routeId = route?.id || '';
                const fullPath = route?.fullPath || routeId;

                // Check if this is a settings route (not parameterized)
                if (typeof fullPath === 'string' && fullPath.startsWith('/settings/') && !fullPath.includes('$')) {
                    // Normalize path (remove trailing slash)
                    const normalizedPath = fullPath.replace(/\/$/, '');
                    if (normalizedPath !== '/settings') {
                        routes.push(normalizedPath);
                    }
                }
            });
        }
    } catch (error) {
        console.warn('Failed to extract routes from router:', error);
    }

    return [...new Set(routes)].sort(); // Remove duplicates and sort
}

