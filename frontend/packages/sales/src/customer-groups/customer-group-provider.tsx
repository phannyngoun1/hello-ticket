/**
 * CustomerGroup Provider
 *
 * React Context provider for CustomerGroupService
 * Makes service available to all child components
 *
 * @author Phanny
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { CustomerGroupService, type CustomerGroupServiceConfig } from "./customer-group-service";

interface CustomerGroupContextValue {
  service: CustomerGroupService;
}

const CustomerGroupContext = createContext<CustomerGroupContextValue | null>(null);

export interface CustomerGroupProviderProps {
  config: CustomerGroupServiceConfig;
  children: ReactNode;
}

export function CustomerGroupProvider({ children, config }: CustomerGroupProviderProps) {
  const service = useMemo(
    () => new CustomerGroupService(config),
    // Re-create service if apiClient or endpoints change
    [config.apiClient, config.endpoints?.customerGroups]
  );

  const value = useMemo<CustomerGroupContextValue>(
    () => ({ service }),
    [service]
  );

  return (
    <CustomerGroupContext.Provider value={value}>
      {children}
    </CustomerGroupContext.Provider>
  );
}

export function useCustomerGroupService(): CustomerGroupService {
  const context = useContext(CustomerGroupContext);
  if (!context) {
    throw new Error(
      "useCustomerGroupService must be used within CustomerGroupProvider"
    );
  }
  return context.service;
}
