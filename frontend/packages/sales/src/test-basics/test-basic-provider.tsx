/**
 * TestBasic Provider
 *
 * React Context provider for TestBasicService
 * Makes service available to all child components
 *
 * @author Phanny
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {TestBasicService, type TestBasicServiceConfig } from "./test-basic-service";

interface TestBasicContextValue {
  service: TestBasicService;
}

const TestBasicContext = createContext<TestBasicContextValue | null>(null);

export interface TestBasicProviderProps {
  config: TestBasicServiceConfig;
  children: ReactNode;
}

export function TestBasicProvider({ children, config }: TestBasicProviderProps) {
  const service = useMemo(
    () => new TestBasicService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.["testBasics"]]
  );

  const value = useMemo<TestBasicContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <TestBasicContext.Provider value={value}>
      {children}
    </TestBasicContext.Provider>
  );
}

export function useTestBasicService(): TestBasicService {
  const context = useContext(TestBasicContext);
  if (!context) {
    throw new Error(
      "useTestBasicService must be used within TestBasicProvider"
    );
  }
  return context.service;
}
