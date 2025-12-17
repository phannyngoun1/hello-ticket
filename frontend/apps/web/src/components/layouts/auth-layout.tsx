import { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@truths/ui";
import { useTheme } from "../../providers/use-theme";
import { LanguageSelector } from "../navigation/language-selector";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Top Bar with Logo and Theme Toggle */}

      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">T</span>
          </div>
          <span className="font-semibold text-lg">Truths</span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {children}
      </div>
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-sm text-muted-foreground">
        <p>© 2025 Truths. All rights reserved.</p>
      </div>
    </div>
  );
}
