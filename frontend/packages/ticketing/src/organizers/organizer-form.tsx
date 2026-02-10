/**
 * Organizer Form Component
 *
 * Shared form used for creating and editing organizers with Zod validation.
 */

import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  TextInputField,
  TextareaInputField,
} from "@truths/custom-ui";

// Form schema excludes timestamp fields (created_at, updated_at) as they are backend-managed
const organizerFormSchema = z
  .object({
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
      handleSubmit,
      control,
    } = useForm<OrganizerFormData>({
      resolver: zodResolver(organizerFormSchema),
      defaultValues: {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Row 1: Name, Email */}
          <TextInputField
            name="name"
            control={control}
            label="Name"
            placeholder="Enter Name"
            type="text"
            required={true}
            disabled={isLoading}
          />

          <TextInputField
            name="email"
            control={control}
            label="Email"
            placeholder="contact@example.com"
            type="email"
            disabled={isLoading}
          />

          {/* Row 2: Phone, Website */}
          <TextInputField
            name="phone"
            control={control}
            label="Phone"
            placeholder="+1 234 567 890"
            type="tel"
            disabled={isLoading}
          />

          <TextInputField
            name="website"
            control={control}
            label="Website"
            placeholder="https://example.com"
            type="url"
            disabled={isLoading}
          />

          {/* Row 3: Logo, Address */}
          <TextInputField
            name="logo"
            control={control}
            label="Logo URL"
            placeholder="https://example.com/logo.png"
            type="url"
            disabled={isLoading}
          />

          <TextInputField
            name="address"
            control={control}
            label="Address"
            placeholder="Street Address"
            type="text"
            disabled={isLoading}
          />

          {/* Row 4: City, Country */}
          <TextInputField
            name="city"
            control={control}
            label="City"
            placeholder="City"
            type="text"
            disabled={isLoading}
          />

          <TextInputField
            name="country"
            control={control}
            label="Country"
            placeholder="Country"
            type="text"
            disabled={isLoading}
          />
        </div>

        {/* Row 5: Description (full width) */}
        <TextareaInputField
          name="description"
          control={control}
          label="Description"
          placeholder="Enter description"
          disabled={isLoading}
          rows={4}
          showImproveButton={true}
        />
      </form>
    );
  },
);
