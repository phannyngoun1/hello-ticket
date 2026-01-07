/**
 * Customer Form Component
 *
 * Comprehensive form with grouped sections for easy input
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
  Separator,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  business_name: z.string().optional(),
  street_address: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  id_number: z.string().optional(),
  id_type: z.string().optional(),
  event_preferences: z.string().optional(),
  seating_preferences: z.string().optional(),
  accessibility_needs: z.string().optional(),
  dietary_restrictions: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  preferred_language: z.string().optional(),
  marketing_opt_in: z.boolean().optional(),
  email_marketing: z.boolean().optional(),
  sms_marketing: z.boolean().optional(),
  facebook_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  twitter_handle: z.string().optional(),
  linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagram_handle: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  public_notes: z.string().optional(),
});

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
        name: "",
        email: "",
        phone: "",
        business_name: "",
        marketing_opt_in: false,
        email_marketing: false,
        sms_marketing: false,
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
        {/* 1. Essential Information */}
        <div ref={firstErrorRef} className="space-y-4">
          <h3 className="text-base font-semibold">Essential Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Full name"
                    {...register("name")}
                    disabled={isLoading}
                    className={cn(errors.name && "border-destructive")}
                  />
                  <FieldError>{errors.name?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
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
                    placeholder="+1 (555) 123-4567"
                    {...register("phone")}
                    disabled={isLoading}
                    className={cn(errors.phone && "border-destructive")}
                  />
                  <FieldError>{errors.phone?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.business_name}>
                  <FieldLabel htmlFor="business_name">Business Name</FieldLabel>
                  <Input
                    id="business_name"
                    type="text"
                    placeholder="Business name"
                    {...register("business_name")}
                    disabled={isLoading}
                    className={cn(errors.business_name && "border-destructive")}
                  />
                  <FieldError>{errors.business_name?.message}</FieldError>
                </Field>
          </div>
        </div>

        <Separator />

        {/* 2. Address Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.street_address} className="md:col-span-2">
                <FieldLabel htmlFor="street_address">Street Address</FieldLabel>
                <Input
                  id="street_address"
                  type="text"
                  placeholder="123 Main Street"
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
                  placeholder="State or Province"
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
                  placeholder="12345"
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

        {/* 3. Customer Profile */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Customer Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.date_of_birth}>
                <FieldLabel htmlFor="date_of_birth">Date of Birth</FieldLabel>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register("date_of_birth")}
                  disabled={isLoading}
                  className={cn(errors.date_of_birth && "border-destructive")}
                />
                <FieldError>{errors.date_of_birth?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.gender}>
                <FieldLabel htmlFor="gender">Gender</FieldLabel>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.gender?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.nationality}>
                <FieldLabel htmlFor="nationality">Nationality</FieldLabel>
                <Input
                  id="nationality"
                  type="text"
                  placeholder="Nationality"
                  {...register("nationality")}
                  disabled={isLoading}
                  className={cn(errors.nationality && "border-destructive")}
                />
                <FieldError>{errors.nationality?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.id_type}>
                <FieldLabel htmlFor="id_type">ID Type</FieldLabel>
                <Controller
                  name="id_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driver_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.id_type?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.id_number} className="md:col-span-2">
                <FieldLabel htmlFor="id_number">ID Number</FieldLabel>
                <Input
                  id="id_number"
                  type="text"
                  placeholder="Government ID number"
                  {...register("id_number")}
                  disabled={isLoading}
                  className={cn(errors.id_number && "border-destructive")}
                />
                <FieldError>{errors.id_number?.message}</FieldError>
                </Field>
          </div>
        </div>

        <Separator />

        {/* 4. Preferences & Settings */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Preferences & Settings</h3>
          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field data-invalid={!!errors.event_preferences}>
                  <FieldLabel htmlFor="event_preferences">Event Preferences</FieldLabel>
                  <Textarea
                    id="event_preferences"
                    placeholder="Preferred event types or categories"
                    {...register("event_preferences")}
                    disabled={isLoading}
                    rows={3}
                    className={cn(errors.event_preferences && "border-destructive")}
                  />
                  <FieldError>{errors.event_preferences?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.seating_preferences}>
                  <FieldLabel htmlFor="seating_preferences">Seating Preferences</FieldLabel>
                  <Textarea
                    id="seating_preferences"
                    placeholder="Preferred seating areas"
                    {...register("seating_preferences")}
                    disabled={isLoading}
                    rows={3}
                    className={cn(errors.seating_preferences && "border-destructive")}
                  />
                  <FieldError>{errors.seating_preferences?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.accessibility_needs}>
                  <FieldLabel htmlFor="accessibility_needs">Accessibility Needs</FieldLabel>
                  <Textarea
                    id="accessibility_needs"
                    placeholder="Special accessibility requirements"
                    {...register("accessibility_needs")}
                    disabled={isLoading}
                    rows={3}
                    className={cn(errors.accessibility_needs && "border-destructive")}
                  />
                  <FieldError>{errors.accessibility_needs?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.dietary_restrictions}>
                  <FieldLabel htmlFor="dietary_restrictions">Dietary Restrictions</FieldLabel>
                  <Textarea
                    id="dietary_restrictions"
                    placeholder="Dietary restrictions for events with catering"
                    {...register("dietary_restrictions")}
                    disabled={isLoading}
                    rows={3}
                    className={cn(errors.dietary_restrictions && "border-destructive")}
                  />
                  <FieldError>{errors.dietary_restrictions?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.preferred_language}>
                  <FieldLabel htmlFor="preferred_language">Preferred Language</FieldLabel>
                  <Input
                    id="preferred_language"
                    type="text"
                    placeholder="e.g., English, Spanish"
                    {...register("preferred_language")}
                    disabled={isLoading}
                    className={cn(errors.preferred_language && "border-destructive")}
                  />
                  <FieldError>{errors.preferred_language?.message}</FieldError>
                </Field>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field data-invalid={!!errors.emergency_contact_name}>
                    <FieldLabel htmlFor="emergency_contact_name">Contact Name</FieldLabel>
                    <Input
                      id="emergency_contact_name"
                      type="text"
                      placeholder="Emergency contact name"
                      {...register("emergency_contact_name")}
                      disabled={isLoading}
                      className={cn(errors.emergency_contact_name && "border-destructive")}
                    />
                    <FieldError>{errors.emergency_contact_name?.message}</FieldError>
                  </Field>

                  <Field data-invalid={!!errors.emergency_contact_phone}>
                    <FieldLabel htmlFor="emergency_contact_phone">Contact Phone</FieldLabel>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      placeholder="Emergency contact phone"
                      {...register("emergency_contact_phone")}
                      disabled={isLoading}
                      className={cn(errors.emergency_contact_phone && "border-destructive")}
                    />
                    <FieldError>{errors.emergency_contact_phone?.message}</FieldError>
                  </Field>

                  <Field data-invalid={!!errors.emergency_contact_relationship}>
                    <FieldLabel htmlFor="emergency_contact_relationship">Relationship</FieldLabel>
                    <Input
                      id="emergency_contact_relationship"
                      type="text"
                      placeholder="Relationship"
                      {...register("emergency_contact_relationship")}
                      disabled={isLoading}
                      className={cn(errors.emergency_contact_relationship && "border-destructive")}
                    />
                    <FieldError>{errors.emergency_contact_relationship?.message}</FieldError>
                  </Field>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Marketing Preferences</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="marketing_opt_in"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="marketing_opt_in"
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      )}
                    />
                    <FieldLabel htmlFor="marketing_opt_in" className="font-normal cursor-pointer">
                      Marketing Opt-in
                    </FieldLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="email_marketing"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="email_marketing"
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      )}
                    />
                    <FieldLabel htmlFor="email_marketing" className="font-normal cursor-pointer">
                      Email Marketing
                    </FieldLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="sms_marketing"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="sms_marketing"
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      )}
                    />
                    <FieldLabel htmlFor="sms_marketing" className="font-normal cursor-pointer">
                      SMS Marketing
                    </FieldLabel>
                  </div>
                </div>
              </div>
            </div>
        </div>

        <Separator />

        {/* 5. Social & Online */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Social & Online</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <Field data-invalid={!!errors.facebook_url}>
                <FieldLabel htmlFor="facebook_url">Facebook URL</FieldLabel>
                <Input
                  id="facebook_url"
                  type="url"
                  placeholder="https://facebook.com/..."
                  {...register("facebook_url")}
                  disabled={isLoading}
                  className={cn(errors.facebook_url && "border-destructive")}
                />
                <FieldError>{errors.facebook_url?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.twitter_handle}>
                <FieldLabel htmlFor="twitter_handle">Twitter/X Handle</FieldLabel>
                <Input
                  id="twitter_handle"
                  type="text"
                  placeholder="@username"
                  {...register("twitter_handle")}
                  disabled={isLoading}
                  className={cn(errors.twitter_handle && "border-destructive")}
                />
                <FieldError>{errors.twitter_handle?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.linkedin_url}>
                <FieldLabel htmlFor="linkedin_url">LinkedIn URL</FieldLabel>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  {...register("linkedin_url")}
                  disabled={isLoading}
                  className={cn(errors.linkedin_url && "border-destructive")}
                />
                <FieldError>{errors.linkedin_url?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.instagram_handle}>
                <FieldLabel htmlFor="instagram_handle">Instagram Handle</FieldLabel>
                <Input
                  id="instagram_handle"
                  type="text"
                  placeholder="@username"
                  {...register("instagram_handle")}
                  disabled={isLoading}
                  className={cn(errors.instagram_handle && "border-destructive")}
                />
                <FieldError>{errors.instagram_handle?.message}</FieldError>
              </Field>
          </div>
        </div>

        <Separator />

        {/* 6. Tags & Classification */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Tags & Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


              <Field data-invalid={!!errors.notes} className="md:col-span-2">
                <FieldLabel htmlFor="notes">Internal Notes</FieldLabel>
                <Textarea
                  id="notes"
                  placeholder="Internal notes (staff only)"
                  {...register("notes")}
                  disabled={isLoading}
                  rows={4}
                  className={cn(errors.notes && "border-destructive")}
                />
                <FieldError>{errors.notes?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.public_notes} className="md:col-span-2">
                <FieldLabel htmlFor="public_notes">Public Notes</FieldLabel>
                <Textarea
                  id="public_notes"
                  placeholder="Public notes (visible to customer)"
                  {...register("public_notes")}
                  disabled={isLoading}
                  rows={4}
                  className={cn(errors.public_notes && "border-destructive")}
                />
                <FieldError>{errors.public_notes?.message}</FieldError>
              </Field>
          </div>
        </div>
      </form>
    );
  }
);
