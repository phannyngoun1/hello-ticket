import { ReactNode } from "react";
import { GlobalUserProvider } from "./user-provider";
import { GlobalCustomerProvider } from "./customer-provider";

interface DomainProvidersProps {
  children: ReactNode;
}

export function DomainProviders({ children }: DomainProvidersProps) {
  return (
    <GlobalUserProvider>
      <GlobalCustomerProvider>
        {children}
      </GlobalCustomerProvider>
    </GlobalUserProvider>
  );
}

// Future: Add GlobalOrderProvider, GlobalProductProvider, GlobalInvoiceProvider here
