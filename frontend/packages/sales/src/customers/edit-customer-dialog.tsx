/**
 * Edit Customer Dialog Component
 *
 * Full-screen dialog for editing existing customers using shared form logic.
 *
 * @author Phanny
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { CustomerForm, type CustomerFormData } from "./customer-form";
import type { Customer, UpdateCustomerInput } from "../types";

export interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateCustomerInput) => Promise<void>;
  customer: Customer | null;
  title?: string;
  maxWidth?: string;
}

export function EditCustomerDialog({
  open,
  onOpenChange,
  onSubmit,
  customer,
  title = "Edit Customer",
  maxWidth = "720px",
}: EditCustomerDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CustomerFormData | null>(null);

  const defaultValues = useMemo(() => {
    if (!customer) return undefined;
    return {
      name: customer.name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      business_name: customer.business_name ?? "",
      street_address: customer.street_address ?? "",
      city: customer.city ?? "",
      state_province: customer.state_province ?? "",
      postal_code: customer.postal_code ?? "",
      country: customer.country ?? "",
      date_of_birth: customer.date_of_birth 
        ? (typeof customer.date_of_birth === 'string' 
            ? customer.date_of_birth.split('T')[0] 
            : new Date(customer.date_of_birth).toISOString().split('T')[0])
        : "",
      gender: customer.gender ?? "",
      nationality: customer.nationality ?? "",
      id_number: customer.id_number ?? "",
      id_type: customer.id_type ?? "",
      event_preferences: customer.event_preferences ?? "",
      seating_preferences: customer.seating_preferences ?? "",
      accessibility_needs: customer.accessibility_needs ?? "",
      dietary_restrictions: customer.dietary_restrictions ?? "",
      emergency_contact_name: customer.emergency_contact_name ?? "",
      emergency_contact_phone: customer.emergency_contact_phone ?? "",
      emergency_contact_relationship: customer.emergency_contact_relationship ?? "",
      preferred_language: customer.preferred_language ?? "",
      marketing_opt_in: customer.marketing_opt_in ?? false,
      email_marketing: customer.email_marketing ?? false,
      sms_marketing: customer.sms_marketing ?? false,
      facebook_url: customer.facebook_url ?? "",
      twitter_handle: customer.twitter_handle ?? "",
      linkedin_url: customer.linkedin_url ?? "",
      instagram_handle: customer.instagram_handle ?? "",
      website: customer.website ?? "",
      priority: customer.priority ?? "",
      notes: customer.notes ?? "",
      public_notes: customer.public_notes ?? "",
    };
  }, [customer]);

  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      const firstInput = formRef.current?.querySelector(
        "input, textarea, select"
      ) as HTMLElement | null;
      firstInput?.focus();
    });
  }, [open, formKey]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  const buildPayload = useMemo(() => {
    return (data: CustomerFormData): UpdateCustomerInput => {
      // Helper to convert empty strings to null
      const toNullIfEmpty = (value: string | undefined): string | null => {
        if (!value) return null;
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
      };

      return {
        name: data.name || null,
        email: toNullIfEmpty(data.email),
        phone: toNullIfEmpty(data.phone),
        business_name: toNullIfEmpty(data.business_name),
        street_address: toNullIfEmpty(data.street_address),
        city: toNullIfEmpty(data.city),
        state_province: toNullIfEmpty(data.state_province),
        postal_code: toNullIfEmpty(data.postal_code),
        country: toNullIfEmpty(data.country),
        date_of_birth: toNullIfEmpty(data.date_of_birth),
        gender: toNullIfEmpty(data.gender),
        nationality: toNullIfEmpty(data.nationality),
        id_number: toNullIfEmpty(data.id_number),
        id_type: toNullIfEmpty(data.id_type),
        event_preferences: toNullIfEmpty(data.event_preferences),
        seating_preferences: toNullIfEmpty(data.seating_preferences),
        accessibility_needs: toNullIfEmpty(data.accessibility_needs),
        dietary_restrictions: toNullIfEmpty(data.dietary_restrictions),
        emergency_contact_name: toNullIfEmpty(data.emergency_contact_name),
        emergency_contact_phone: toNullIfEmpty(data.emergency_contact_phone),
        emergency_contact_relationship: toNullIfEmpty(data.emergency_contact_relationship),
        preferred_language: toNullIfEmpty(data.preferred_language),
        marketing_opt_in: data.marketing_opt_in ?? null,
        email_marketing: data.email_marketing ?? null,
        sms_marketing: data.sms_marketing ?? null,
        facebook_url: toNullIfEmpty(data.facebook_url),
        twitter_handle: toNullIfEmpty(data.twitter_handle),
        linkedin_url: toNullIfEmpty(data.linkedin_url),
        instagram_handle: toNullIfEmpty(data.instagram_handle),
        website: toNullIfEmpty(data.website),
        priority: toNullIfEmpty(data.priority),
        notes: toNullIfEmpty(data.notes),
        public_notes: toNullIfEmpty(data.public_notes),
      };
    };
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData || !customer) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit(customer.id, payload);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    } catch (error) {
      console.error("Error updating customer:", error);
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

  if (!customer) {
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
          <CustomerForm
            ref={formRef}
            key={`${customer.id}-${formKey}`}
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
        title="Confirm Customer Update"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to update this customer?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}
