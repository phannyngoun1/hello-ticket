import { createContext } from "react";

export type Theme = "dark" | "light" | "system";

export type ThemeProviderState = {
    theme: Theme;
    resolvedTheme: "dark" | "light";
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => null,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

