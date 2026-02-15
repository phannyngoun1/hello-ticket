/**
 * Detects if the app is in dark mode via the `dark` class on document.documentElement.
 * The ThemeProvider (in apps/web) adds/removes this class when theme changes.
 * Re-renders are triggered by the ThemeProvider's state updates when theme changes.
 */
export function useDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}
