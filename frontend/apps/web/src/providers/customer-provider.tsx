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
      idTypes: "/api/v1/sales/id-types",
    },
  };
  return <CustomerProvider config={serviceConfig}>{children}</CustomerProvider>;
}
