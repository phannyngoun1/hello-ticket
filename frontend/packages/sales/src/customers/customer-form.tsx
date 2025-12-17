/**
 * Customer Form Component
 *
 * Shared form used for creating and editing customers with Zod validation.
 *
 * @author Phanny
 */

import { forwardRef, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Field,
  FieldLabel,
  FieldError,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

const customerFormSchema = z
  .object({

    code: z.string().min(1),

    name: z.string().min(1),

  })
  .transform((values) => values);

export type CustomerFormData = z.infer<typeof customerFormSchema>;

export interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export const CustomerForm = forwardRef<HTMLFormElement, CustomerFormProps>(
  function CustomerForm(
    {
      defaultValues,
      onSubmit,
      isLoading = false,
    },
    ref
  ) {
    const {
      register,
      handleSubmit,
      control,
      formState: { errors, isSubmitted },
    } = useForm<CustomerFormData>({
      resolver: zodResolver(customerFormSchema),
      defaultValues: {

        code: '',

        name: '',

        ...defaultValues,
      },
    });

    const firstErrorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (isSubmitted && Object.keys(errors).length > 0) {
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.querySelector(
          `[name="${firstErrorField}"], #${firstErrorField}`
        ) as HTMLElement | null;

        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          errorElement.focus?.();
        } else if (firstErrorRef.current) {
          firstErrorRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }, [errors, isSubmitted]);

    const handleFormSubmit = async (data: CustomerFormData) => {
      await onSubmit(data);
    };

    return (
      <form
        ref={ref}
        id="customer-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}
          ref={firstErrorRef}
        >

          <Field data-invalid={!!errors.code}>
            <FieldLabel htmlFor="code">
              Code <span className="text-destructive">*</span>
            </FieldLabel>

                <Input
                  id="code"
                  type="text"
                  placeholder="Enter code"
                  {...register("code")}
                  disabled={isLoading}
                  className={cn(errors.code && "border-destructive")}
                />

              <FieldError>{errors.code?.message}</FieldError>

          </Field>

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">
              Name <span className="text-destructive">*</span>
            </FieldLabel>

                <Input
                  id="name"
                  type="text"
                  placeholder="Enter name"
                  {...register("name")}
                  disabled={isLoading}
                  className={cn(errors.name && "border-destructive")}
                />

              <FieldError>{errors.name?.message}</FieldError>

          </Field>

        </div>
      </form>
    );
  }
);
