import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "./providers/theme-provider";
import { DensityProvider } from "./providers/density-provider";
import { I18nProvider } from "./providers/i18n-provider";
import { SessionProvider } from "./providers/session-provider";
import { QueryProvider } from "./providers/query-provider";
import { HealthCheckProvider } from "./providers/health-check-provider";
import { DomainProviders } from "./providers/domain-providers";
import { Toaster } from "@truths/ui";
import { routeTree } from "./routeTree.gen";
import "./styles/globals.css";
import "./i18n/config";

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HealthCheckProvider>
      <QueryProvider>
        <SessionProvider>
          <DomainProviders>
            <ThemeProvider defaultTheme="system" storageKey="ui-theme">
              <DensityProvider defaultDensity="normal" storageKey="ui-density">
                <I18nProvider>
                  <RouterProvider router={router} />
                  <ReactQueryDevtools initialIsOpen={false} />
                </I18nProvider>
              </DensityProvider>
            </ThemeProvider>
          </DomainProviders>
          <Toaster />
        </SessionProvider>
      </QueryProvider>
    </HealthCheckProvider>
  </React.StrictMode>
);
