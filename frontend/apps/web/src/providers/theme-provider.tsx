import { useEffect, useState, useLayoutEffect } from "react";
import { storage } from "@truths/utils";
import { Theme, ThemeProviderContext } from "./theme-context";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

// Helper function to apply theme to DOM
const applyTheme = (themeValue: Theme) => {
  if (typeof window === "undefined") return;
  
  const root = window.document.documentElement;

  root.classList.remove("light", "dark");

  if (themeValue === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(themeValue);
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  // Get initial theme from storage or default
  const initialTheme = (() => {
    if (typeof window === "undefined") return defaultTheme;
    const stored = storage.get<Theme>(storageKey);
    const theme = stored || defaultTheme;
    // Apply theme immediately during initialization (before first render)
    applyTheme(theme);
    return theme;
  })();

  const [theme, setTheme] = useState<Theme>(initialTheme);

  // Apply theme synchronously before paint (useLayoutEffect runs before useEffect)
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      storage.set(storageKey, newTheme);
      // Apply theme immediately to DOM before state update
      applyTheme(newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
