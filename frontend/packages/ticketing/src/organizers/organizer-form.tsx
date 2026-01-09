/**
 * Organizer Form Component
 *
 * Shared form used for creating and editing organizers with Zod validation.
 */

import { forwardRef, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Input,
  Field,
  FieldLabel,
  FieldError,
  Textarea,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

// Form schema excludes timestamp fields (created_at, updated_at) as they are backend-managed
const organizerFormSchema = z
  .object({
    code: z.string().optional(),

    
    
    
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    logo: z.string().url("Invalid URL").optional().or(z.literal("")),
    
    
  })
  .transform((values) => values);

export type OrganizerFormData = z.infer<typeof organizerFormSchema>;

export interface OrganizerFormProps {
  defaultValues?: Partial<OrganizerFormData>;
  onSubmit: (data: OrganizerFormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export const OrganizerForm = forwardRef<HTMLFormElement, OrganizerFormProps>(
  function OrganizerForm(
    {
      defaultValues,
      onSubmit,
      isLoading = false,
      mode = "create",
    },
    ref
  ) {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitted },
    } = useForm<OrganizerFormData>({
      resolver: zodResolver(organizerFormSchema),
      defaultValues: {
        
        

        
        
        
        code: "",
        name: "",
        description: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        city: "",
        country: "",
        logo: "",
        
        
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

    const handleFormSubmit = async (data: OrganizerFormData) => {
      await onSubmit(data);
    };

    return (
      <form
        ref={ref}
        id="organizer-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}
          ref={firstErrorRef}
        >
          
          <Field data-invalid={!!errors.code}>
            <FieldLabel htmlFor="code">Code</FieldLabel>
            <Input
              id="code"
              type="text"
              placeholder="Enter Code"
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
            
              
                
                {(() => {
                  const isCodeLocked =
                    (false && mode === "edit") ||
                    (false && mode === "create");
                  const lockReason =
                    false && mode === "edit"
                      ? "Codes cannot be modified after creation"
                      : false && mode === "create"
                        ? "Code will be generated automatically"
                        : undefined;
                  return (
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter Name"
                      {...register("name")}
                      disabled={isLoading || isCodeLocked}
                      readOnly={isCodeLocked}
                      tabIndex={isCodeLocked ? -1 : undefined}
                      aria-disabled={isCodeLocked || undefined}
                      aria-readonly={isCodeLocked || undefined}
                      title={lockReason}
                      className={cn(
                        isCodeLocked && "cursor-not-allowed bg-muted text-muted-foreground",
                        errors.name && "border-destructive"
                      )}
                    />
                  );
                })()}
                
              
              <FieldError>{errors.name?.message}</FieldError>
            
          </Field>
          
          
        </div>
        
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Field data-invalid={!!errors.email}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="contact@example.com"
                        {...register("email")}
                        disabled={isLoading}
                        className={cn(errors.email && "border-destructive")}
                    />
                    <FieldError>{errors.email?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.phone}>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 234 567 890"
                        {...register("phone")}
                        disabled={isLoading}
                        className={cn(errors.phone && "border-destructive")}
                    />
                    <FieldError>{errors.phone?.message}</FieldError>
                </Field>
                
                 <Field data-invalid={!!errors.website}>
                    <FieldLabel htmlFor="website">Website</FieldLabel>
                    <Input
                        id="website"
                        type="url"
                        placeholder="https://example.com"
                        {...register("website")}
                        disabled={isLoading}
                        className={cn(errors.website && "border-destructive")}
                    />
                    <FieldError>{errors.website?.message}</FieldError>
                </Field>
                 <Field data-invalid={!!errors.logo}>
                    <FieldLabel htmlFor="logo">Logo URL</FieldLabel>
                    <Input
                        id="logo"
                        type="url"
                        placeholder="https://example.com/logo.png"
                        {...register("logo")}
                        disabled={isLoading}
                        className={cn(errors.logo && "border-destructive")}
                    />
                    <FieldError>{errors.logo?.message}</FieldError>
                </Field>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Field className="md:col-span-3" data-invalid={!!errors.address}>
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                     <Input
                        id="address"
                        type="text"
                        placeholder="Street Address"
                        {...register("address")}
                        disabled={isLoading}
                        className={cn(errors.address && "border-destructive")}
                    />
                    <FieldError>{errors.address?.message}</FieldError>
                </Field>
                
                 <Field data-invalid={!!errors.city}>
                    <FieldLabel htmlFor="city">City</FieldLabel>
                     <Input
                        id="city"
                        type="text"
                        placeholder="City"
                        {...register("city")}
                        disabled={isLoading}
                        className={cn(errors.city && "border-destructive")}
                    />
                    <FieldError>{errors.city?.message}</FieldError>
                </Field>
                
                 <Field data-invalid={!!errors.country}>
                    <FieldLabel htmlFor="country">Country</FieldLabel>
                     <Input
                        id="country"
                        type="text"
                        placeholder="Country"
                        {...register("country")}
                        disabled={isLoading}
                        className={cn(errors.country && "border-destructive")}
                    />
                    <FieldError>{errors.country?.message}</FieldError>
                </Field>
             </div>

             <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                    id="description"
                    placeholder="Enter description"
                    {...register("description")}
                    disabled={isLoading}
                    className={cn(errors.description && "border-destructive")}
                />
                <FieldError>{errors.description?.message}</FieldError>
            </Field>
        </div>
      </form>
    );
  }
);

