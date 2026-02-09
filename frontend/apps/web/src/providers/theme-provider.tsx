import { useEffect, useState, useLayoutEffect } from "react";
import { storage } from "@truths/utils";
import { Theme, ThemeProviderContext } from "./theme-context";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

// Helper function to get resolved theme (actual dark/light being displayed)
const getResolvedTheme = (themeValue: Theme): "dark" | "light" => {
  if (typeof window === "undefined") return "light";
  
  if (themeValue === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  
  return themeValue;
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
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => 
    getResolvedTheme(initialTheme)
  );

  // Apply theme synchronously before paint (useLayoutEffect runs before useEffect)
  useLayoutEffect(() => {
    applyTheme(theme);
    // Update resolved theme when theme changes
    setResolvedTheme(getResolvedTheme(theme));
  }, [theme]);

  // Listen for system theme changes when theme is set to "system"
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Handler to update theme when system preference changes
    const handleSystemThemeChange = () => {
      // Only update if we're still in system mode
      const currentTheme = storage.get<Theme>(storageKey);
      if (currentTheme === "system") {
        applyTheme("system");
        setResolvedTheme(getResolvedTheme("system"));
      }
    };

    // Listen for changes (modern API)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      // Fallback for older browsers (legacy API)
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [theme, storageKey]);

  const value = {
    theme,
    resolvedTheme,
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
