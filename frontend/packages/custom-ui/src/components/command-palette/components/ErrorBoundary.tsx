import * as React from "react";
import { CommandDialog } from "@truths/ui";
import { AlertCircle } from "lucide-react";

/**
 * Error boundary component for command palette
 */
export class CommandPaletteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("CommandPalette Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <CommandDialog open={true} onOpenChange={() => {}}>
          <div className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              The command palette encountered an error. Please try refreshing
              the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </CommandDialog>
      );
    }

    return this.props.children;
  }
}
