/**
 * Venue Form Component
 *
 * Shared form used for creating and editing venues with Zod validation.
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

// Form schema excludes timestamp fields (created_at, updated_at) as they are backend-managed
const venueFormSchema = z
  .object({
    code: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    venue_type: z.string().optional(),
    capacity: z.union([
      z.number().int().positive(),
      z.string().transform((val) => val ? parseInt(val, 10) : undefined),
    ]).optional(),
    parking_info: z.string().optional(),
    accessibility: z.string().optional(),
    amenities: z.union([
      z.string(),
      z.array(z.string()),
    ]).optional().transform((val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return val.split(',').map(a => a.trim()).filter(a => a);
    }),
    opening_hours: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    street_address: z.string().optional(),
    city: z.string().optional(),
    state_province: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  })
  .transform((values) => values);

export type VenueFormData = z.infer<typeof venueFormSchema>;

export interface VenueFormProps {
  defaultValues?: Partial<VenueFormData>;
  onSubmit: (data: VenueFormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export const VenueForm = forwardRef<HTMLFormElement, VenueFormProps>(
  function VenueForm(
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
      watch,
      setValue,
      formState: { errors, isSubmitted },
    } = useForm<VenueFormData>({
      resolver: zodResolver(venueFormSchema),
      defaultValues: {
        name: "",
        description: undefined,
        venue_type: undefined,
        capacity: undefined,
        parking_info: undefined,
        accessibility: undefined,
        amenities: Array.isArray(defaultValues?.amenities) 
          ? defaultValues.amenities.join(", ") 
          : defaultValues?.amenities || undefined,
        opening_hours: undefined,
        phone: undefined,
        email: undefined,
        website: undefined,
        street_address: undefined,
        city: undefined,
        state_province: undefined,
        postal_code: undefined,
        country: undefined,
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

    const handleFormSubmit = async (data: VenueFormData) => {
      await onSubmit(data);
    };

    return (
      <form
        ref={ref}
        id="venue-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}
          ref={firstErrorRef}
        >
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

          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              placeholder="Venue description"
              {...register("description")}
              disabled={isLoading}
              rows={3}
              className={cn(errors.description && "border-destructive")}
            />
            <FieldError>{errors.description?.message}</FieldError>
          </Field>
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}>
          <Field data-invalid={!!errors.venue_type}>
            <FieldLabel htmlFor="venue_type">Venue Type</FieldLabel>
            <Select
              value={watch("venue_type") || undefined}
              onValueChange={(value) => setValue("venue_type", value === "none" ? undefined : value)}
              disabled={isLoading}
            >
              <SelectTrigger id="venue_type">
                <SelectValue placeholder="Select venue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="Theater">Theater</SelectItem>
                <SelectItem value="Stadium">Stadium</SelectItem>
                <SelectItem value="Concert Hall">Concert Hall</SelectItem>
                <SelectItem value="Arena">Arena</SelectItem>
                <SelectItem value="Auditorium">Auditorium</SelectItem>
                <SelectItem value="Outdoor">Outdoor</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FieldError>{errors.venue_type?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.capacity}>
            <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
            <Input
              id="capacity"
              type="number"
              placeholder="Total seating capacity"
              {...register("capacity", { valueAsNumber: true })}
              disabled={isLoading}
              className={cn(errors.capacity && "border-destructive")}
            />
            <FieldError>{errors.capacity?.message}</FieldError>
          </Field>
        </div>

        <div className={cn("grid grid-cols-1 gap-4")}>
          <Field data-invalid={!!errors.parking_info}>
            <FieldLabel htmlFor="parking_info">Parking Information</FieldLabel>
            <Textarea
              id="parking_info"
              placeholder="Parking availability and details"
              {...register("parking_info")}
              disabled={isLoading}
              rows={3}
              className={cn(errors.parking_info && "border-destructive")}
            />
            <FieldError>{errors.parking_info?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.accessibility}>
            <FieldLabel htmlFor="accessibility">Accessibility</FieldLabel>
            <Textarea
              id="accessibility"
              placeholder="Accessibility features and accommodations"
              {...register("accessibility")}
              disabled={isLoading}
              rows={3}
              className={cn(errors.accessibility && "border-destructive")}
            />
            <FieldError>{errors.accessibility?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.amenities}>
            <FieldLabel htmlFor="amenities">Amenities</FieldLabel>
            <Textarea
              id="amenities"
              placeholder="List amenities separated by commas (e.g., WiFi, Concessions, Restrooms)"
              {...register("amenities")}
              disabled={isLoading}
              rows={3}
              className={cn(errors.amenities && "border-destructive")}
            />
            <FieldError>{errors.amenities?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.opening_hours}>
            <FieldLabel htmlFor="opening_hours">Opening Hours</FieldLabel>
            <Textarea
              id="opening_hours"
              placeholder="Operating hours (e.g., Mon-Fri: 9am-5pm, Sat-Sun: 10am-6pm)"
              {...register("opening_hours")}
              disabled={isLoading}
              rows={3}
              className={cn(errors.opening_hours && "border-destructive")}
            />
            <FieldError>{errors.opening_hours?.message}</FieldError>
          </Field>
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4")}>
          <h3 className="col-span-full text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Contact Information
          </h3>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="Phone number"
              {...register("phone")}
              disabled={isLoading}
              className={cn(errors.phone && "border-destructive")}
            />
            <FieldError>{errors.phone?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              {...register("email")}
              disabled={isLoading}
              className={cn(errors.email && "border-destructive")}
            />
            <FieldError>{errors.email?.message}</FieldError>
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
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}>
          <h3 className="col-span-full text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Address
          </h3>
          <Field data-invalid={!!errors.street_address} className="md:col-span-2">
            <FieldLabel htmlFor="street_address">Street Address</FieldLabel>
            <Input
              id="street_address"
              type="text"
              placeholder="Street address"
              {...register("street_address")}
              disabled={isLoading}
              className={cn(errors.street_address && "border-destructive")}
            />
            <FieldError>{errors.street_address?.message}</FieldError>
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

          <Field data-invalid={!!errors.state_province}>
            <FieldLabel htmlFor="state_province">State/Province</FieldLabel>
            <Input
              id="state_province"
              type="text"
              placeholder="State or province"
              {...register("state_province")}
              disabled={isLoading}
              className={cn(errors.state_province && "border-destructive")}
            />
            <FieldError>{errors.state_province?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.postal_code}>
            <FieldLabel htmlFor="postal_code">Postal Code</FieldLabel>
            <Input
              id="postal_code"
              type="text"
              placeholder="Postal/ZIP code"
              {...register("postal_code")}
              disabled={isLoading}
              className={cn(errors.postal_code && "border-destructive")}
            />
            <FieldError>{errors.postal_code?.message}</FieldError>
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
      </form>
    );
  }
);

