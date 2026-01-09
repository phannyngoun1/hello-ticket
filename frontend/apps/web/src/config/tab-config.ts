/**
 * Application Tab Configuration
 *
 * Defines all routes and their metadata for the tab management system.
 * This replaces hardcoded logic in TabManager and allows for better maintainability.
 */

import type { TabConfiguration } from "@truths/custom-ui";

/**
 * Module order for tab grouping and dropdown display
 * This determines the order in which modules appear in the dropdown menu
 */
export const moduleOrder = [
    "Pinned",
    "General",
    "Sales & Bookings",
    "Ticketing",
    "Users",
    "Settings",
    "Other",
];

export const tabConfiguration: TabConfiguration = {
    tabs: [
        // General/Home
        {
            path: "/",
            title: "Home",
            iconName: "Home",
            pageType: "list",
            module: "General",
            priority: 1,
        },

        // Users module
        {
            path: "/users",
            title: "Users",
            iconName: "Users",
            pageType: "list",
            module: "Users",
            priority: 1,
        },
        {
            path: "/users/$id",
            title: "User",
            iconName: "User",
            pageType: "detail",
            module: "Users",
            priority: 2,
        },
        {
            path: "/profile",
            title: "Profile",
            iconName: "User",
            pageType: "detail",
            module: "Users",
            priority: 3,
        },
        {
            path: "/settings/profile",
            title: "Profile Settings",
            iconName: "User",
            pageType: "detail",
            module: "Settings",
            priority: 1,
        },

        // Sales & Bookings module
        {
            path: "/sales/customers",
            title: "Customers",
            iconName: "Users",
            pageType: "list",
            module: "Sales & Bookings",
            priority: 1,
        },
        {
            path: "/sales/customers/$id",
            title: "Customer",
            iconName: "User",
            pageType: "detail",
            module: "Sales & Bookings",
            priority: 2,
        },
        {
            path: "/sales/bookings",
            title: "Bookings",
            iconName: "Calendar",
            pageType: "list",
            module: "Sales & Bookings",
            priority: 3,
        },
        {
            path: "/sales/bookings/$id",
            title: "Booking",
            iconName: "Calendar",
            pageType: "detail",
            module: "Sales & Bookings",
            priority: 4,
        },
        {
            path: "/sales/employees",
            title: "Employees",
            iconName: "Users",
            pageType: "list",
            module: "Sales & Bookings",
            priority: 5,
        },
        {
            path: "/sales/employees/$id",
            title: "Employee",
            iconName: "User",
            pageType: "detail",
            module: "Sales & Bookings",
            priority: 6,
        },
        {
            path: "/sales/payments",
            title: "Payments",
            iconName: "CreditCard",
            pageType: "list",
            module: "Sales & Bookings",
            priority: 7,
        },
        {
            path: "/sales/payments/$id",
            title: "Payment",
            iconName: "CreditCard",
            pageType: "detail",
            module: "Sales & Bookings",
            priority: 8,
        },
        {
            path: "/sales/explore",
            title: "Explore",
            iconName: "Search",
            pageType: "list",
            module: "Sales & Bookings",
            priority: 9,
        },
        {
            path: "/explore",
            title: "Explore",
            iconName: "Search",
            pageType: "list",
            module: "Sales & Bookings",
            priority: 10,
        },
        {
            path: "/bookings",
            title: "Bookings",
            iconName: "Calendar",
            pageType: "list",
            module: "Sales & Bookings",
            priority: 11,
        },

        // Ticketing/Venues module
        {
            path: "/ticketing/venues",
            title: "Venues",
            iconName: "MapPin",
            pageType: "list",
            module: "Ticketing",
            priority: 1,
        },
        {
            path: "/ticketing/venues/$id",
            title: "Venue",
            iconName: "MapPin",
            pageType: "detail",
            module: "Ticketing",
            priority: 2,
        },
        {
            path: "/ticketing/venues/$id/seats/designer",
            title: "Seat Designer",
            iconName: "LayoutGrid",
            pageType: "sub-detail",
            module: "Ticketing",
            priority: 3,
        },
        {
            path: "/ticketing/events",
            title: "Events",
            iconName: "Calendar",
            pageType: "list",
            module: "Ticketing",
            priority: 4,
        },
        {
            path: "/ticketing/events/$id",
            title: "Event",
            iconName: "Calendar",
            pageType: "detail",
            module: "Ticketing",
            priority: 5,
        },
        {
            path: "/ticketing/organizers",
            title: "Organizers",
            iconName: "Users",
            pageType: "list",
            module: "Ticketing",
            priority: 6,
        },
        {
            path: "/ticketing/organizers/$id",
            title: "Organizer",
            iconName: "User",
            pageType: "detail",
            module: "Ticketing",
            priority: 7,
        },
        {
            path: "/ticketing/shows",
            title: "Shows",
            iconName: "Play",
            pageType: "list",
            module: "Ticketing",
            priority: 8,
        },
        {
            path: "/ticketing/shows/$id",
            title: "Show",
            iconName: "Play",
            pageType: "detail",
            module: "Ticketing",
            priority: 9,
        },

        // Settings module
        {
            path: "/settings",
            title: "Settings",
            iconName: "Settings",
            pageType: "list",
            module: "Settings",
            priority: 1,
        },
        {
            path: "/settings/account",
            title: "Account Settings",
            iconName: "User",
            pageType: "detail",
            module: "Settings",
            priority: 2,
        },
        {
            path: "/settings/notifications",
            title: "Notifications",
            iconName: "Bell",
            pageType: "detail",
            module: "Settings",
            priority: 3,
        },
        {
            path: "/settings/appearance",
            title: "Appearance",
            iconName: "Palette",
            pageType: "detail",
            module: "Settings",
            priority: 4,
        },
        {
            path: "/settings/language",
            title: "Language",
            iconName: "Globe",
            pageType: "detail",
            module: "Settings",
            priority: 5,
        },
        {
            path: "/settings/security",
            title: "Security",
            iconName: "Shield",
            pageType: "detail",
            module: "Settings",
            priority: 6,
        },
    ],
};