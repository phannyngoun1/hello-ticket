/**
 * Edit Customer Component
 *
 * Wrapper around CustomerForm for inline editing experiences.
 */

import { Card } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { CustomerForm, type CustomerFormData } from "./customer-form";
import type { Customer, UpdateCustomerInput } from "../types";

export interface EditCustomerProps {
  className?: string;
  customer: Customer;
  onSubmit: (id: string, input: UpdateCustomerInput) => Promise<void> | void;
  isLoading?: boolean;
}

export function EditCustomer({
  className,
  customer,
  onSubmit,
  isLoading = false,
}: EditCustomerProps) {
  const handleSubmit = async (data: CustomerFormData) => {
    const payload: UpdateCustomerInput = {
      name: data.name,
    };

    await onSubmit(customer.id, payload);
  };

  const formDefaultValues: Partial<CustomerFormData> = {
    name: customer.name ?? "",
  };

  return (
    <Card className={cn("p-6", className)}>
      <CustomerForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        defaultValues={formDefaultValues}
        mode="edit"
      />
    </Card>
  );
}
