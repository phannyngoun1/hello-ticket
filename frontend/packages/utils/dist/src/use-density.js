/**
 * Hook to access UI density preference
 *
 * This hook reads from localStorage and listens to density preference changes.
 * It works across packages without requiring context access.
 */
import { useState, useEffect } from "react";
const STORAGE_KEY = "ui-density";
/**
 * Get density from localStorage
 * Uses the storage utility which handles JSON parsing
 */
function getDensityFromStorage() {
    if (typeof window === "undefined")
        return "normal";
    try {
        // Use the storage utility which handles JSON parsing
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored || stored === "undefined" || stored === "null") {
            return "normal";
        }
        // Try to parse as JSON first (since storage.set() uses JSON.stringify)
        let value;
        try {
            value = JSON.parse(stored);
        }
        catch {
            // If parsing fails, use the raw value
            value = stored;
        }
        if (value === "normal" || value === "compact") {
            return value;
        }
    }
    catch {
        // localStorage not available
    }
    return "normal";
}
/**
 * Hook to get current density preference
 * Listens to storage changes and custom events
 */
export function useDensity() {
    const [density, setDensity] = useState(() => getDensityFromStorage());
    useEffect(() => {
        // Listen for custom events when density changes (same-tab updates)
        const handleDensityChange = (e) => {
            const customEvent = e;
            if (customEvent.detail?.density) {
                const newDensity = customEvent.detail.density;
                if (newDensity === "normal" || newDensity === "compact") {
                    setDensity(newDensity);
                }
            }
        };
        // Listen for storage events (cross-tab updates)
        const handleStorageChange = (e) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                let value;
                try {
                    // Try to parse as JSON first (storage.set() uses JSON.stringify)
                    value = JSON.parse(e.newValue);
                }
                catch {
                    // If parsing fails, use the raw value
                    value = e.newValue;
                }
                if (value === "normal" || value === "compact") {
                    setDensity(value);
                }
            }
        };
        window.addEventListener("density-preference-changed", handleDensityChange);
        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("density-preference-changed", handleDensityChange);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);
    return {
        density,
        isCompact: density === "compact",
    };
}
