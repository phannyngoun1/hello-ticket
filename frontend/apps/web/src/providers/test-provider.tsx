/**
 * Global Test Provider
 *
 * Makes the TestTreeService available throughout the app so shared
 * experiences like the command palette can query test-tree records.
 */

import { ReactNode, useMemo } from "react";
import { TestTreeProvider } from "@truths/sales";
import { api } from "@truths/api";

interface GlobalTestProviderProps {
  children: ReactNode;
}

export function GlobalTestProvider({ children }: GlobalTestProviderProps) {
  const testTreeServiceConfig = useMemo(
    () => ({
      apiClient: api,
      endpoints: {
        testTrees: "/api/v1/sales/test-trees",
      },
    }),
    []
  );

  return (
    <TestTreeProvider config={testTreeServiceConfig}>
      {children}
    </TestTreeProvider>
  );
}
