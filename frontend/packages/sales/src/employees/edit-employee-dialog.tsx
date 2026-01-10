/**
 * Edit Employee Dialog Component
 *
 * Full-screen dialog for editing existing employees using shared form logic.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { EmployeeForm, type EmployeeFormData } from "./employee-form";
import type { Employee, UpdateEmployeeInput } from "./types";

export interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateEmployeeInput) => Promise<void>;
  employee: Employee | null;
  title?: string;
  maxWidth?: string;
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  onSubmit,
  employee,
  title = "Edit Employee",
  maxWidth = "720px",
}: EditEmployeeDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EmployeeFormData | null>(null);

  // Helper function to build formatted address string from individual address components
  const buildAddressString = (data: EmployeeFormData): string | undefined => {
    const addressParts = [
      data.street_address?.trim(),
      data.city?.trim(),
      data.state_province?.trim(),
      data.postal_code?.trim(),
      data.country?.trim(),
    ].filter(Boolean);

    if (addressParts.length === 0) {
      return data.office_location?.trim() || undefined;
    }

    // Format as multi-line address
    const streetAddress = data.street_address?.trim();
    const cityStateZip = [data.city?.trim(), data.state_province?.trim(), data.postal_code?.trim()]
      .filter(Boolean)
      .join(', ');
    const country = data.country?.trim();

    const formattedParts = [];
    if (streetAddress) formattedParts.push(streetAddress);
    if (cityStateZip) formattedParts.push(cityStateZip);
    if (country) formattedParts.push(country);

    return formattedParts.join('\n');
  };

  // Helper function to parse address string into components
  const parseAddressString = (addressString: string | null | undefined) => {
    if (!addressString) return { street_address: "", city: "", state_province: "", postal_code: "", country: "" };

    const lines = addressString.split('\n').map(line => line.trim()).filter(Boolean);

    // Simple parsing logic (can be improved based on your address format)
    const result = {
      street_address: lines[0] || "",
      city: "",
      state_province: "",
      postal_code: "",
      country: lines[lines.length - 1] || "" // Assume last line is country
    };

    // Try to parse city, state, zip from second line
    if (lines[1]) {
      const cityStateZip = lines[1].split(',').map(part => part.trim());
      result.city = cityStateZip[0] || "";
      if (cityStateZip[1]) {
        const stateZip = cityStateZip[1].split(' ');
        result.state_province = stateZip[0] || "";
        result.postal_code = stateZip.slice(1).join(' ') || "";
      }
    }

    return result;
  };

  const defaultValues = useMemo(() => {
    if (!employee) return undefined;

    const parsedAddress = parseAddressString(employee.office_location);

    return {
      name: employee.name ?? "",

      // System Link
      work_email: employee.work_email ?? "",

      // Organizational Structure
      job_title: employee.job_title ?? "",
      department: employee.department ?? "",
      manager_id: employee.manager_id ?? "",
      employment_type: employee.employment_type ?? "",
      hire_date: employee.hire_date ?? "",

      // Contact & Location
      work_phone: employee.work_phone ?? "",
      mobile_phone: employee.mobile_phone ?? "",
      // Address fields (parsed from office_location)
      street_address: parsedAddress.street_address,
      city: parsedAddress.city,
      state_province: parsedAddress.state_province,
      postal_code: parsedAddress.postal_code,
      country: parsedAddress.country,
      office_location: employee.office_location ?? "",
      timezone: employee.timezone ?? "UTC",

      // Sales & Operational
      skills: employee.skills?.join(", ") ?? "",
      assigned_territories: employee.assigned_territories?.join(", ") ?? "",
      commission_tier: employee.commission_tier ?? "",

      // Personal (HR)
      birthday: employee.birthday ?? "",
      emergency_contact_name: employee.emergency_contact_name ?? "",
      emergency_contact_phone: employee.emergency_contact_phone ?? "",
      emergency_contact_relationship: employee.emergency_contact_relationship ?? "",
    };
  }, [employee]);

  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      const firstInput = formRef.current?.querySelector(
        "input, textarea, select"
      ) as HTMLElement | null;
      firstInput?.focus();
    });
  }, [open, formKey]);

  const handleFormSubmit = async (data: EmployeeFormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  // Build payload excludes timestamp fields (created_at, updated_at) - backend manages these
  const buildPayload = useMemo(() => {
    return (data: EmployeeFormData): UpdateEmployeeInput => ({
      name: data.name,
      
      // System Link
      work_email: data.work_email || undefined,
      
      // Organizational Structure
      job_title: data.job_title || undefined,
      department: data.department || undefined,
      manager_id: data.manager_id || undefined,
      employment_type: data.employment_type || undefined,
      hire_date: data.hire_date || undefined,
      
      // Contact & Location
      work_phone: data.work_phone || undefined,
      mobile_phone: data.mobile_phone || undefined,
      office_location: buildAddressString(data) || undefined,
      timezone: data.timezone || undefined,
      
      // Sales & Operational
      skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      assigned_territories: data.assigned_territories ? data.assigned_territories.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      commission_tier: data.commission_tier || undefined,
      
      // Personal (HR)
      birthday: data.birthday || undefined,
      emergency_contact_name: data.emergency_contact_name || undefined,
      emergency_contact_phone: data.emergency_contact_phone || undefined,
      emergency_contact_relationship: data.emergency_contact_relationship || undefined,
    });
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData || !employee) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit(employee.id, payload);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    } catch (error) {
      console.error("Error updating employee:", error);
      setShowConfirmDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFormKey((prev) => prev + 1);
  };

  const handleDialogSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleConfirmDialogChange = (dialogOpen: boolean) => {
    setShowConfirmDialog(dialogOpen);
    if (!dialogOpen) {
      setPendingFormData(null);
      setTimeout(() => {
        const firstInput = formRef.current?.querySelector(
          "input, textarea, select"
        ) as HTMLElement;
        firstInput?.focus();
      }, 0);
    }
  };

  const confirmAction = {
    label: isSubmitting ? "Updating..." : "Confirm & Update",
    onClick: handleConfirmSubmit,
    loading: isSubmitting,
    disabled: isSubmitting,
    variant: "default" as const,
  };

  const cancelAction = {
    label: "Cancel",
    variant: "outline" as const,
    disabled: isSubmitting,
  };

  if (!employee) {
    return null;
  }

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title={title}
        maxWidth={maxWidth}
        loading={isSubmitting}
        formSelector={formRef}
        autoSubmitShortcut
        showClearButton
        onClear={handleClear}
        showCancelButton
        onCancel={handleClose}
        showSubmitButton
        onSubmit={handleDialogSubmit}
      >
        <div
          className={cn(
            "bg-background border border-border rounded-lg shadow-sm mt-12",
            density.paddingForm
          )}
        >
          <EmployeeForm
            ref={formRef}
            key={`${employee.id}-${formKey}`}
            defaultValues={defaultValues}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
            mode="edit"
          />
        </div>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={handleConfirmDialogChange}
        title="Confirm Employee Update"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to update this employee?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}
