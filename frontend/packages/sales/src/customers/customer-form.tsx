/**
 * Customer Form Component
 *
 * Comprehensive form with grouped sections for easy input
 *
 * @author Phanny
 */

import { forwardRef, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  TextInputField,
  TextareaInputField,
  SelectInputField,
  CheckboxField,
  DateInputField,
  AIAssistFormButton,
} from "@truths/custom-ui";
import { Separator } from "@truths/ui";


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
  function CustomerForm({ defaultValues, onSubmit, isLoading = false }, ref) {
    const {
      handleSubmit,
      control,
      watch,
      setValue,
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

    const customerCurrentValues: Record<string, string> = {
      name: watch("name") ?? "",
      email: watch("email") ?? "",
      phone: watch("phone") ?? "",
      business_name: watch("business_name") ?? "",
      notes: watch("notes") ?? "",
    };

    return (
      <form
        ref={ref}
        id="customer-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className="flex justify-end">
          <AIAssistFormButton
            formType="customer"
            currentValues={customerCurrentValues}
            onSuggest={(values) => {
              Object.entries(values).forEach(([key, value]) => {
                if (value !== undefined && value !== null) setValue(key as keyof CustomerFormData, value);
              });
            }}
            disabled={isLoading}
          />
        </div>
        {/* 1. Essential Information */}
        <div ref={firstErrorRef} className="space-y-4">
          <h3 className="text-base font-semibold">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInputField
              control={control}
              name="name"
              label="Name"
              placeholder="Full name"
              required
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="email"
              label="Email"
              type="email"
              placeholder="email@example.com"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="phone"
              label="Phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="business_name"
              label="Business Name"
              placeholder="Business name"
              disabled={isLoading}
            />
          </div>
        </div>
        <Separator />

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateInputField
              control={control}
              name="date_of_birth"
              label="Date of Birth"
              disabled={isLoading}
            />

            <SelectInputField
              control={control}
              name="gender"
              label="Gender"
              placeholder="Select gender"
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
                { value: "prefer_not_to_say", label: "Prefer not to say" },
              ]}
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="nationality"
              label="Nationality"
              placeholder="Nationality"
              disabled={isLoading}
            />

            <SelectInputField
              control={control}
              name="id_type"
              label="ID Type"
              placeholder="Select ID type"
              options={[
                { value: "passport", label: "Passport" },
                { value: "driver_license", label: "Driver's License" },
                { value: "national_id", label: "National ID" },
                { value: "other", label: "Other" },
              ]}
              disabled={isLoading}
            />

            <div className="md:col-span-2">
              <TextInputField
                control={control}
                name="id_number"
                label="ID Number"
                placeholder="Government ID number"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* 2. Address Information */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <TextInputField
                control={control}
                name="street_address"
                label="Street Address"
                placeholder="123 Main Street"
                disabled={isLoading}
              />
            </div>

            <TextInputField
              control={control}
              name="city"
              label="City"
              placeholder="City"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="state_province"
              label="State/Province"
              placeholder="State or Province"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="postal_code"
              label="Postal Code"
              placeholder="12345"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="country"
              label="Country"
              placeholder="Country"
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Emergency Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextInputField
              control={control}
              name="emergency_contact_name"
              label="Contact Name"
              placeholder="Emergency contact name"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="emergency_contact_phone"
              label="Contact Phone"
              type="tel"
              placeholder="Emergency contact phone"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="emergency_contact_relationship"
              label="Relationship"
              placeholder="Relationship"
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        {/* 4. Preferences & Settings */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Preferences & Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextareaInputField
                control={control}
                name="event_preferences"
                label="Event Preferences"
                placeholder="Preferred event types or categories"
                rows={3}
                disabled={isLoading}
              />

              <TextareaInputField
                control={control}
                name="seating_preferences"
                label="Seating Preferences"
                placeholder="Preferred seating areas"
                rows={3}
                disabled={isLoading}
              />

              <TextareaInputField
                control={control}
                name="accessibility_needs"
                label="Accessibility Needs"
                placeholder="Special accessibility requirements"
                rows={3}
                disabled={isLoading}
              />

              <TextareaInputField
                control={control}
                name="dietary_restrictions"
                label="Dietary Restrictions"
                placeholder="Dietary restrictions for events with catering"
                rows={3}
                disabled={isLoading}
              />

              <SelectInputField
                control={control}
                name="preferred_language"
                label="Preferred Language"
                placeholder="e.g., English, Spanish"
                options={[
                  { value: "en", label: "English" },
                  { value: "es", label: "Spanish" },
                  { value: "fr", label: "French" },
                  { value: "de", label: "German" },
                  { value: "it", label: "Italian" },
                  { value: "pt", label: "Portuguese" },
                  { value: "zh", label: "Chinese" },
                  { value: "ja", label: "Japanese" },
                  { value: "other", label: "Other" },
                ]}
                disabled={isLoading}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Marketing Preferences</h4>
              <div className="space-y-2">
                <CheckboxField
                  control={control}
                  name="marketing_opt_in"
                  label="Marketing Opt-in"
                  disabled={isLoading}
                />
                <CheckboxField
                  control={control}
                  name="email_marketing"
                  label="Email Marketing"
                  disabled={isLoading}
                />
                <CheckboxField
                  control={control}
                  name="sms_marketing"
                  label="SMS Marketing"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* 5. Social & Online */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Social & Online</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInputField
              control={control}
              name="website"
              label="Website"
              placeholder="https://example.com"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="facebook_url"
              label="Facebook URL"
              placeholder="https://facebook.com/..."
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="twitter_handle"
              label="Twitter/X Handle"
              placeholder="@username"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="linkedin_url"
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/..."
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="instagram_handle"
              label="Instagram Handle"
              placeholder="@username"
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        {/* 6. Tags & Classification */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Tags & Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <TextareaInputField
                control={control}
                name="notes"
                label="Internal Notes"
                placeholder="Internal notes (staff only)"
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div className="md:col-span-2">
              <TextareaInputField
                control={control}
                name="public_notes"
                label="Public Notes"
                placeholder="Public notes (visible to customer)"
                rows={4}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </form>
    );
  }
);
