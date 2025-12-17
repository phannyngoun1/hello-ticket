/**
 * View Customer Page
 *
 * @author Phanny
 */

import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { CustomerDetail, useCustomer, useCustomerService } from "@truths/sales";

function CustomerDetailContent({ id }: { id: string }) {
  const service = useCustomerService();
  const { data: customer, isLoading, error } = useCustomer(service, id ?? null);

  useEffect(() => {
    if (!customer) return;
    const title = customer.code || customer.name || customer.id;
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/sales/customers/${id}`,
          title,
          iconName: "Users",
        },
      })
    );
  }, [id, customer]);

  return (
    <CustomerDetail
      cus={customer ?? undefined}
      loading={isLoading}
      error={error as Error | null}
      editable={true}
    />
  );
}

export function ViewCustomerPage() {
  const { id } = useParams({ from: "/sales/customers/$id" });

  return <CustomerDetailContent id={id} />;
}
