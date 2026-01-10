/**
 * Employee Form Component
 *
 * Shared form used for creating and editing employees with Zod validation.
 */

import { forwardRef, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TextInputField, DateInputField, SelectInputField } from "@truths/custom-ui";
import { cn } from "@truths/ui/lib/utils";

// Form schema with all new employee fields
const employeeFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    
    // System Link
    work_email: z.string().email("Invalid email format").optional().or(z.literal("")),
    
    // Organizational Structure
    job_title: z.string().optional(),
    department: z.string().optional(),
    manager_id: z.string().optional(),
    employment_type: z.string().optional(),
    hire_date: z.string().optional(),
    
    // Contact & Location
    work_phone: z.string().optional(),
    mobile_phone: z.string().optional(),
    // Address fields
    street_address: z.string().optional(),
    city: z.string().optional(),
    state_province: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
    office_location: z.string().optional(), // Legacy field for backward compatibility
    timezone: z.string().optional(),
    
    // Sales & Operational
    skills: z.string().optional(), // comma-separated, will be split later
    assigned_territories: z.string().optional(), // comma-separated
    commission_tier: z.string().optional(),
    
    // Personal (HR)
    birthday: z.string().optional(),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    emergency_contact_relationship: z.string().optional(),
  })
  .transform((values) => values);

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export const EmployeeForm = forwardRef<HTMLFormElement, EmployeeFormProps>(
  function EmployeeForm(
    {
      defaultValues,
      onSubmit,
      isLoading = false,
    },
    ref
  ) {
    const {
      handleSubmit,
      control,
      reset,
      formState: { errors, isSubmitted },
    } = useForm<EmployeeFormData>({
      resolver: zodResolver(employeeFormSchema),
      defaultValues: {
        name: "",
        work_email: "",
        job_title: "",
        department: "",
        employment_type: "",
        // Address defaults
        street_address: "",
        city: "",
        state_province: "",
        postal_code: "",
        country: "",
        office_location: "",
        timezone: "UTC",
        ...defaultValues,
      },
    });

    const firstErrorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (defaultValues) {
        reset((formValues) => ({
          ...formValues,
          ...defaultValues,
        }));
      }
    }, [defaultValues, reset]);

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

    const handleFormSubmit = async (data: EmployeeFormData) => {
      await onSubmit(data);
    };

    return (
      <form
        ref={ref}
        id="employee-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")} ref={firstErrorRef}>
            <TextInputField
              control={control}
              name="name"
              label="Name"
              placeholder="Enter full name"
              required
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="work_email"
              label="Work Email"
              type="email"
              placeholder="employee@company.com"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateInputField
              control={control}
              name="birthday"
              label="Birthday (for celebrations)"
              disabled={isLoading}
            />
          </div>
        </div>

        

        {/* Contact & Location */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact & Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInputField
              control={control}
              name="work_phone"
              label="Work Phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="mobile_phone"
              label="Mobile Phone"
              type="tel"
              placeholder="+1 (555) 987-6543"
              disabled={isLoading}
            />
          </div>

          {/* Address Fields */}
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
              placeholder="New York"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="state_province"
              label="State/Province"
              placeholder="NY"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="postal_code"
              label="Postal Code"
              placeholder="10001"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="country"
              label="Country"
              placeholder="United States"
              disabled={isLoading}
            />
          </div>

          {/* Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInputField
              control={control}
              name="timezone"
              label="Timezone"
              placeholder="UTC"
              disabled={isLoading}
            />
          </div>

          {/* Legacy Office Location (hidden for now) */}
          <div className="hidden">
            <TextInputField
              control={control}
              name="office_location"
              label="Office Location"
              placeholder="e.g., New York HQ"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Organizational Structure */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Organization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInputField
              control={control}
              name="job_title"
              label="Job Title"
              placeholder="e.g., Sales Manager"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="department"
              label="Department"
              placeholder="e.g., Sales"
              disabled={isLoading}
            />

            <SelectInputField
              control={control}
              name="employment_type"
              label="Employment Type"
              placeholder="Select type"
              options={[
                { value: "Full-time", label: "Full-time" },
                { value: "Part-time", label: "Part-time" },
                { value: "Contractor", label: "Contractor" },
                { value: "Intern", label: "Intern" },
              ]}
              disabled={isLoading}
            />

            <DateInputField
              control={control}
              name="hire_date"
              label="Hire Date"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Sales & Operational */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Sales & Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInputField
              control={control}
              name="skills"
              label="Skills"
              placeholder="Comma-separated (e.g., Sales, Spanish)"
              helperText="Separate skills with commas"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="assigned_territories"
              label="Assigned Territories"
              placeholder="Comma-separated (e.g., EMEA, APAC)"
              helperText="Separate territories with commas"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="commission_tier"
              label="Commission Tier"
              placeholder="e.g., Tier 1"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <details className="space-y-4">
          <summary className="text-lg font-semibold cursor-pointer">Emergency Contact</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TextInputField
              control={control}
              name="emergency_contact_name"
              label="Contact Name"
              placeholder="Full name"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="emergency_contact_phone"
              label="Contact Phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              disabled={isLoading}
            />

            <TextInputField
              control={control}
              name="emergency_contact_relationship"
              label="Relationship"
              placeholder="e.g., Spouse, Parent"
              disabled={isLoading}
            />
          </div>
        </details>
      </form>
    );
  }
);
