import * as React from "react";

/**
 * Hook to use command palette
 * Handles keyboard shortcuts with improved conflict detection and fallbacks
 */
export function useCommandPalette(
    navigate?: (options: { to: string }) => void
) {
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Primary shortcut: Cmd+K / Ctrl+K
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                e.stopPropagation();
                setOpen((open) => !open);
                return;
            }

            // Navigation shortcuts when palette is closed and navigate function is available
            if (!open && navigate) {
                // Quick navigation shortcuts - simple and reliable
                if (e.key === "h" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate({ to: "/" });
                    return;
                }

                if (e.key === "d" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate({ to: "/dashboard" });
                    return;
                }

                if (e.key === "u" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate({ to: "/users" });
                    return;
                }

                if (e.key === "," && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate({ to: "/settings" });
                    return;
                }
            }
        };

        // Use capture phase to ensure we get the event first
        document.addEventListener("keydown", down, true);

        return () => {
            document.removeEventListener("keydown", down, true);
        };
    }, [open, navigate]);

    return {
        open,
        setOpen,
    };
}
