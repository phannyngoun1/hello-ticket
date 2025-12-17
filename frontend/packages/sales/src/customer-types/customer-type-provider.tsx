/**
 * CustomerType Provider
 *
 * React Context provider for CustomerTypeService
 * Makes service available to all child components
 *
 * @author Phanny
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {CustomerTypeService, type CustomerTypeServiceConfig } from "./customer-type-service";

interface CustomerTypeContextValue {
  service: CustomerTypeService;
}

const CustomerTypeContext = createContext<CustomerTypeContextValue | null>(null);

export interface CustomerTypeProviderProps {
  config: CustomerTypeServiceConfig;
  children: ReactNode;
}

export function CustomerTypeProvider({ children, config }: CustomerTypeProviderProps) {
  const service = useMemo(
    () => new CustomerTypeService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.["customerTypes"]]
  );

  const value = useMemo<CustomerTypeContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <CustomerTypeContext.Provider value={value}>
      {children}
    </CustomerTypeContext.Provider>
  );
}

export function useCustomerTypeService(): CustomerTypeService {
  const context = useContext(CustomerTypeContext);
  if (!context) {
    throw new Error(
      "useCustomerTypeService must be used within CustomerTypeProvider"
    );
  }
  return context.service;
}
