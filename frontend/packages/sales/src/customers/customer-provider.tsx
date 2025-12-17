/**
 * Customer Provider
 *
 * Provides configured CustomerService to all child components
 * Makes the service available via useCustomerService hook
 *
 * @author Phanny
 */

import { createContext, useContext, ReactNode, useMemo } from "react";
import {
  CustomerService,
  type CustomerServiceConfig,
} from "./customer-service";

interface CustomerContextType {
  customerService: CustomerService;
}

const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined
);

export interface CustomerProviderProps {
  children: ReactNode;
  config: CustomerServiceConfig;
}

export function CustomerProvider({ children, config }: CustomerProviderProps) {
  const customerService = useMemo(
    () => new CustomerService(config),
    [config.apiClient, config.endpoints?.["customers"]]
  );

  const value = useMemo(() => ({ customerService }), [customerService]);

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomerService(): CustomerService {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error(
      "useCustomerService must be used within a CustomerProvider"
    );
  }
  return context.customerService;
}
