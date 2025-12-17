import { ReactNode } from "react";
import { GlobalUserProvider } from "./user-provider";
import { GlobalItemProvider } from "./item-provider";
import { GlobalTestProvider } from "./test-provider";
import { GlobalCustomerProvider } from "./customer-provider";

interface DomainProvidersProps {
  children: ReactNode;
}

export function DomainProviders({ children }: DomainProvidersProps) {
  return (
    <GlobalUserProvider>
      <GlobalItemProvider>
        <GlobalCustomerProvider>
          <GlobalTestProvider>{children}</GlobalTestProvider>
        </GlobalCustomerProvider>
      </GlobalItemProvider>
    </GlobalUserProvider>
  );
}

// Future: Add GlobalOrderProvider, GlobalProductProvider, GlobalInvoiceProvider here
