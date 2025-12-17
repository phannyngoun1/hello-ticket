/**
 * Test Provider
 *
 * Provides configured TestService to all child components
 * Makes the service available via useTestService hook
 *
 * @author Phanny
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { TestService, type TestServiceConfig } from "./test-service";

interface TestContextValue {
  service: TestService;
}

const TestContext = createContext<TestContextValue | null>(null);

export interface TestProviderProps {
  children: ReactNode;
  config: TestServiceConfig;
}

export function TestProvider({
  children,
  config,
}: TestProviderProps) {
  const service = useMemo(
    () => new TestService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.tests]
  );

  const value = useMemo<TestContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <TestContext.Provider value={value}>
      {children}
    </TestContext.Provider>
  );
}

export function useTestService(): TestService {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error(
      "useTestService must be used within TestProvider"
    );
  }
  return context.service;
}

