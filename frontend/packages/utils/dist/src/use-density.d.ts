/**
 * Hook to access UI density preference
 *
 * This hook reads from localStorage and listens to density preference changes.
 * It works across packages without requiring context access.
 */
type UIDensity = "compact" | "normal";
/**
 * Hook to get current density preference
 * Listens to storage changes and custom events
 */
export declare function useDensity(): {
    density: UIDensity;
    isCompact: boolean;
};
export {};
//# sourceMappingURL=use-density.d.ts.map