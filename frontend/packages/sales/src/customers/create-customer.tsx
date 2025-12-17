/**
 * Create Customer Component
 *
 * Lightweight wrapper that renders the shared CustomerForm for inline usage.
 */

import { Card } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { CustomerForm, type CustomerFormData } from "./customer-form";
import type { CreateCustomerInput } from "../types";

export interface CreateCustomerProps {
  className?: string;
  onSubmit: (data: CreateCustomerInput) => Promise<void> | void;
  isLoading?: boolean;
  defaultValues?: Partial<CustomerFormData>;
}

export function CreateCustomer({
  className,
  onSubmit,
  isLoading = false,
  defaultValues,
}: CreateCustomerProps) {
  const handleSubmit = async (data: CustomerFormData) => {
    const payload: CreateCustomerInput = {
      code: data.code,
      name: data.name,
      status: 'active',
      business_name: '',
    };

    await onSubmit(payload);
  };

  return (
    <Card className={cn("p-6", className)}>
      <CustomerForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        defaultValues={defaultValues}
        mode="create"
      />
    </Card>
  );
}

