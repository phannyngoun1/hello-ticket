/**
 * TestTree Provider
 *
 * React Context provider for TestTreeService
 * Makes service available to all child components
 *
 * @author Phanny
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { TestTreeService, type TestTreeServiceConfig } from "./test-tree-service";

interface TestTreeContextValue {
  service: TestTreeService;
}

const TestTreeContext = createContext<TestTreeContextValue | null>(null);

export interface TestTreeProviderProps {
  config: TestTreeServiceConfig;
  children: ReactNode;
}

export function TestTreeProvider({ children, config }: TestTreeProviderProps) {
  const service = useMemo(
    () => new TestTreeService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.testTrees]
  );

  const value = useMemo<TestTreeContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <TestTreeContext.Provider value={value}>
      {children}
    </TestTreeContext.Provider>
  );
}

export function useTestTreeService(): TestTreeService {
  const context = useContext(TestTreeContext);
  if (!context) {
    throw new Error(
      "useTestTreeService must be used within TestTreeProvider"
    );
  }
  return context.service;
}
