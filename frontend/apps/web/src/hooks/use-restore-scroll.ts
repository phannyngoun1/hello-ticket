import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

const SCROLL_POSITIONS_KEY = "scroll_positions";

interface ScrollPositions {
    [key: string]: number;
}

function saveScrollPosition(pathname: string, scrollY: number) {
    const positions: ScrollPositions = JSON.parse(
        localStorage.getItem(SCROLL_POSITIONS_KEY) || "{}"
    );
    positions[pathname] = scrollY;
    localStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
}

function getScrollPosition(pathname: string): number {
    const positions: ScrollPositions = JSON.parse(
        localStorage.getItem(SCROLL_POSITIONS_KEY) || "{}"
    );
    return positions[pathname] || 0;
}

function clearOldScrollPositions(maxAge = 7 * 24 * 60 * 60 * 1000) {
    // Clean up old positions after 7 days
    const positions: ScrollPositions = JSON.parse(
        localStorage.getItem(SCROLL_POSITIONS_KEY) || "{}"
    );
    localStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
}

/**
 * Hook to preserve and restore scroll position when navigating between pages
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   useRestoreScroll();
 *   return <div>Content</div>;
 * }
 * ```
 */
export function useRestoreScroll() {
    const location = useLocation();
    const pathname = location.pathname;

    useEffect(() => {
        // Save current scroll position before navigating
        const handleScroll = () => {
            if (document.body.scrollTop || document.documentElement.scrollTop) {
                saveScrollPosition(pathname, window.scrollY);
            }
        };

        // Restore scroll position on mount
        const savedPosition = getScrollPosition(pathname);

        // Use setTimeout to ensure DOM is fully rendered
        const restoreTimer = setTimeout(() => {
            window.scrollTo({
                top: savedPosition,
                behavior: "instant" as ScrollBehavior,
            });
        }, 0);

        // Clean up old positions periodically
        clearOldScrollPositions();

        // Add scroll listener
        window.addEventListener("scroll", handleScroll, { passive: true });

        // Also save before unload
        window.addEventListener("beforeunload", handleScroll);

        return () => {
            clearTimeout(restoreTimer);
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("beforeunload", handleScroll);
            // Save position one last time
            handleScroll();
        };
    }, [pathname]);
}
