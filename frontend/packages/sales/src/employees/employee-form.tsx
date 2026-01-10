/**
 * Employee Form Component
 *
 * Shared form used for creating and editing employees with Zod validation.
 */

import { forwardRef, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Input,
  Field,
  FieldLabel,
  FieldError,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
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
      register,
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
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">
                Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Enter full name"
                {...register("name")}
                disabled={isLoading}
                className={cn(errors.name && "border-destructive")}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.work_email}>
              <FieldLabel htmlFor="work_email">Work Email</FieldLabel>
              <Input
                id="work_email"
                type="email"
                placeholder="employee@company.com"
                {...register("work_email")}
                disabled={isLoading}
                className={cn(errors.work_email && "border-destructive")}
              />
              <FieldError>{errors.work_email?.message}</FieldError>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.birthday}>
              <FieldLabel htmlFor="birthday">Birthday (for celebrations)</FieldLabel>
              <Input
                id="birthday"
                type="date"
                {...register("birthday")}
                disabled={isLoading}
              />
            </Field>
          </div>
        </div>

        

        {/* Contact & Location */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact & Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.work_phone}>
              <FieldLabel htmlFor="work_phone">Work Phone</FieldLabel>
              <Input
                id="work_phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...register("work_phone")}
                disabled={isLoading}
              />
            </Field>

            <Field data-invalid={!!errors.mobile_phone}>
              <FieldLabel htmlFor="mobile_phone">Mobile Phone</FieldLabel>
              <Input
                id="mobile_phone"
                type="tel"
                placeholder="+1 (555) 987-6543"
                {...register("mobile_phone")}
                disabled={isLoading}
              />
            </Field>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.street_address} className="md:col-span-2">
              <FieldLabel htmlFor="street_address">Street Address</FieldLabel>
              <Input
                id="street_address"
                type="text"
                placeholder="123 Main Street"
                {...register("street_address")}
                disabled={isLoading}
              />
            </Field>

            <Field data-invalid={!!errors.city}>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input
                id="city"
                type="text"
                placeholder="New York"
                {...register("city")}
                disabled={isLoading}
              />
            </Field>

            <Field data-invalid={!!errors.state_province}>
              <FieldLabel htmlFor="state_province">State/Province</FieldLabel>
              <Input
                id="state_province"
                type="text"
                placeholder="NY"
                {...register("state_province")}
                disabled={isLoading}
              />
            </Field>

            <Field data-invalid={!!errors.postal_code}>
              <FieldLabel htmlFor="postal_code">Postal Code</FieldLabel>
              <Input
                id="postal_code"
                type="text"
                placeholder="10001"
                {...register("postal_code")}
                disabled={isLoading}
              />
            </Field>

            <Field data-invalid={!!errors.country}>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <Input
                id="country"
                type="text"
                placeholder="United States"
                {...register("country")}
                disabled={isLoading}
              />
            </Field>
          </div>

          {/* Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.timezone}>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
              <Input
                id="timezone"
                type="text"
                placeholder="UTC"
                {...register("timezone")}
                disabled={isLoading}
              />
            </Field>
          </div>

          {/* Legacy Office Location (hidden for now) */}
          <div className="hidden">
            <Field data-invalid={!!errors.office_location}>
              <FieldLabel htmlFor="office_location">Office Location</FieldLabel>
              <Input
                id="office_location"
                type="text"
                placeholder="e.g., New York HQ"
                {...register("office_location")}
                disabled={isLoading}
              />
            </Field>
          </div>
        </div>

        {/* Organizational Structure */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Organization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.job_title}>
              <FieldLabel htmlFor="job_title">Job Title</FieldLabel>
              <Input
                id="job_title"
                type="text"
                placeholder="e.g., Sales Manager"
                {...register("job_title")}
                disabled={isLoading}
              />
            </Field>

            <Field data-invalid={!!errors.department}>
              <FieldLabel htmlFor="department">Department</FieldLabel>
              <Input
                id="department"
                type="text"
                placeholder="e.g., Sales"
                {...register("department")}
                disabled={isLoading}
              />
            </Field>

            <Field data-invalid={!!errors.employment_type}>
              <FieldLabel htmlFor="employment_type">Employment Type</FieldLabel>
              <Controller
                name="employment_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contractor">Contractor</SelectItem>
                      <SelectItem value="Intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field data-invalid={!!errors.hire_date}>
              <FieldLabel htmlFor="hire_date">Hire Date</FieldLabel>
              <Input
                id="hire_date"
                type="date"
                {...register("hire_date")}
                disabled={isLoading}
              />
            </Field>
          </div>
        </div>

        {/* Sales & Operational */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Sales & Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.skills}>
              <FieldLabel htmlFor="skills">Skills</FieldLabel>
              <Input
                id="skills"
                type="text"
                placeholder="Comma-separated (e.g., Sales, Spanish)"
                {...register("skills")}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">Separate skills with commas</p>
            </Field>

            <Field data-invalid={!!errors.assigned_territories}>
              <FieldLabel htmlFor="assigned_territories">Assigned Territories</FieldLabel>
              <Input
                id="assigned_territories"
                type="text"
                placeholder="Comma-separated (e.g., EMEA, APAC)"
                {...register("assigned_territories")}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">Separate territories with commas</p>
            </Field>

            <Field data-invalid={!!errors.commission_tier}>
              <FieldLabel htmlFor="commission_tier">Commission Tier</FieldLabel>
              <Input
                id="commission_tier"
                type="text"
                placeholder="e.g., Tier 1"
                {...register("commission_tier")}
                disabled={isLoading}
              />
            </Field>
          </div>
        </div>

        {/* Emergency Contact */}
        <details className="space-y-4">
          <summary className="text-lg font-semibold cursor-pointer">Emergency Contact</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field data-invalid={!!errors.emergency_contact_name}>
              <FieldLabel htmlFor="emergency_contact_name">Contact Name</FieldLabel>
              <Input
                id="emergency_contact_name"
                type="text"
                placeholder="Full name"
                {...register("emergency_contact_name")}
                disabled={isLoading}
              />
            </Field>

            <Field data-invalid={!!errors.emergency_contact_phone}>
              <FieldLabel htmlFor="emergency_contact_phone">Contact Phone</FieldLabel>
              <Input
                id="emergency_contact_phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                {...register("emergency_contact_phone")}
                disabled={isLoading}
              />
            </Field>

            <Field data-invalid={!!errors.emergency_contact_relationship}>
              <FieldLabel htmlFor="emergency_contact_relationship">Relationship</FieldLabel>
              <Input
                id="emergency_contact_relationship"
                type="text"
                placeholder="e.g., Spouse, Parent"
                {...register("emergency_contact_relationship")}
                disabled={isLoading}
              />
            </Field>
          </div>
        </details>
      </form>
    );
  }
);
