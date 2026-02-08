/**
 * Venue Form Component
 *
 * Shared form used for creating and editing venues with Zod validation.
 */

import { forwardRef, useEffect, useRef, useContext } from "react";
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
  Separator,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { TextareaInputField, AIAssistFormButton } from "@truths/custom-ui";
import { VenueTypeContext } from "../venue-types/venue-type-provider";
import { useVenueType } from "../venue-types/use-venue-types";

// Form schema excludes timestamp fields (created_at, updated_at) as they are backend-managed
// Input schema - amenities is a string (comma-separated)
const venueFormInputSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  venue_type: z.string().optional(),
  capacity: z.coerce.number().optional(),
  parking_info: z.string().optional(),
  accessibility: z.string().optional(),
  amenities: z.string().optional(),
  opening_hours: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  street_address: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

// Output schema - transforms amenities from string to array
const venueFormSchema = venueFormInputSchema.transform((values) => ({
  ...values,
  amenities: values.amenities
    ? values.amenities
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a)
    : [],
}));

export type VenueFormData = z.infer<typeof venueFormSchema>;
export type VenueFormInputData = z.infer<typeof venueFormInputSchema>;

export interface VenueFormProps {
  defaultValues?: Partial<VenueFormData | VenueFormInputData>;
  onSubmit: (data: VenueFormData) => Promise<void> | void;
  isLoading?: boolean;
  venueTypes?: { id: string; name: string; code?: string }[];
}

export const VenueForm = forwardRef<HTMLFormElement, VenueFormProps>(
  function VenueForm(
    { defaultValues, onSubmit, isLoading = false, venueTypes: venueTypesProp },
    ref
  ) {
    // Check if venue type context is available (without throwing)
    const venueTypeContext = useContext(VenueTypeContext);
    const venueTypeService = venueTypeContext?.service;

    // Create a dummy service for when provider is not available
    const dummyService = {
      fetchVenueTypes: async () => ({
        data: [],
        pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
      }),
    } as any;

    // Fetch venue types from service if service is available and prop not provided
    const { data: venueTypesData } = useVenueType(
      venueTypeService || dummyService,
      {
        pagination: { page: 1, pageSize: 100 },
        enabled: !!venueTypeService && !venueTypesProp,
      }
    );

    // Use prop if provided, otherwise use fetched data, otherwise empty array
    const venueTypes = venueTypesProp || venueTypesData?.data || [];

    const {
      register,
      control,
      handleSubmit,
      watch,
      setValue,
      formState: { errors, isSubmitted },
    } = useForm<VenueFormInputData>({
      resolver: zodResolver(venueFormInputSchema),
      defaultValues: {
        name: "",
        description: undefined,
        venue_type: undefined,
        parking_info: undefined,
        accessibility: undefined,
        amenities: Array.isArray(defaultValues?.amenities)
          ? defaultValues.amenities.join(", ")
          : typeof defaultValues?.amenities === "string"
            ? defaultValues.amenities
            : undefined,
        opening_hours: undefined,
        phone: undefined,
        email: undefined,
        website: undefined,
        street_address: undefined,
        city: undefined,
        state_province: undefined,
        postal_code: undefined,
        country: undefined,
        ...(defaultValues
          ? {
              ...defaultValues,
              amenities: Array.isArray(defaultValues.amenities)
                ? defaultValues.amenities.join(", ")
                : typeof defaultValues.amenities === "string"
                  ? defaultValues.amenities
                  : undefined,
            }
          : {}),
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

    const handleFormSubmit = async (data: VenueFormInputData) => {
      // Transform the input data to match the output schema
      const transformedData = venueFormSchema.parse(data);
      await onSubmit(transformedData);
    };

    const venueCurrentValues: Record<string, string> = {
      name: watch("name") ?? "",
      description: watch("description") ?? "",
      venue_type: watch("venue_type") ?? "",
      street_address: watch("street_address") ?? "",
      city: watch("city") ?? "",
      state_province: watch("state_province") ?? "",
      postal_code: watch("postal_code") ?? "",
      country: watch("country") ?? "",
      phone: watch("phone") ?? "",
      email: watch("email") ?? "",
      website: watch("website") ?? "",
    };

    return (
      <form
        ref={ref}
        id="venue-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className="flex justify-end">
          <AIAssistFormButton
            formType="venue"
            currentValues={venueCurrentValues}
            onSuggest={(values) => {
              Object.entries(values).forEach(([key, value]) => {
                if (value !== undefined && value !== null)
                  setValue(key as keyof VenueFormInputData, value);
              });
            }}
            disabled={isLoading}
          />
        </div>
        {/* Basic Information Section */}
        <div ref={firstErrorRef} className="space-y-4">
          <h3 className="text-base font-semibold">Basic Information</h3>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Enter Name"
                {...register("name")}
                disabled={isLoading}
                className={cn(errors.name && "border-destructive")}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.venue_type}>
              <FieldLabel htmlFor="venue_type">Venue Type</FieldLabel>
              <Select
                value={watch("venue_type") || undefined}
                onValueChange={(value) =>
                  setValue("venue_type", value === "none" ? undefined : value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="venue_type">
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {venueTypes.map((venueType) => (
                    <SelectItem key={venueType.id} value={venueType.name}>
                      {venueType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.venue_type?.message}</FieldError>
            </Field>
          </div>

          <TextareaInputField
            control={control}
            name="description"
            label="Description"
            placeholder="Venue description"
            rows={3}
            disabled={isLoading}
            showImproveButton
          />
        </div>

        <Separator />

        {/* Contact Information Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Contact Information</h3>
          <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4")}>
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
        </div>

        <Separator />

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Address</h3>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}>
            <Field
              data-invalid={!!errors.street_address}
              className="md:col-span-2"
            >
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
        </div>

        <Separator />

        {/* Facilities & Information Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Facilities & Information</h3>
          <div className={cn("grid grid-cols-1 gap-4")}>
            <Field data-invalid={!!errors.parking_info}>
              <FieldLabel htmlFor="parking_info">
                Parking Information
              </FieldLabel>
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
              <FieldLabel htmlFor="accessibility">
                Accessibility Features
              </FieldLabel>
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
        </div>
      </form>
    );
  }
);
