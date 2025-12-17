import { CustomerProvider } from "@truths/sales";
import { api } from "@truths/api";

export function GlobalCustomerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const serviceConfig = {
    apiClient: api,
    endpoints: {
      customers: "/api/v1/sales/customers",
    },
  };
  return <CustomerProvider config={serviceConfig}>{children}</CustomerProvider>;
}
