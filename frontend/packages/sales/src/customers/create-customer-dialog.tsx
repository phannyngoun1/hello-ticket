/**
 * Create Customer Dialog Component
 *
 * Full-screen dialog for creating new customers using the shared form component.
 *
 * @author Phanny
 */

import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { CustomerForm, type CustomerFormData } from "./customer-form";
import type { CreateCustomerInput } from "../types";

export interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCustomerInput) => Promise<void>;
  title?: string;
  maxWidth?: string;
}

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Create Customer",
  maxWidth = "720px",
}: CreateCustomerDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] =
    useState<CustomerFormData | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

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
    return (data: CustomerFormData): CreateCustomerInput => {
      return {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        business_name: data.business_name || undefined,
        street_address: data.street_address || undefined,
        city: data.city || undefined,
        state_province: data.state_province || undefined,
        postal_code: data.postal_code || undefined,
        country: data.country || undefined,
        date_of_birth: data.date_of_birth || undefined,
        gender: data.gender || undefined,
        nationality: data.nationality || undefined,
        id_number: data.id_number || undefined,
        id_type: data.id_type || undefined,
        event_preferences: data.event_preferences || undefined,
        seating_preferences: data.seating_preferences || undefined,
        accessibility_needs: data.accessibility_needs || undefined,
        dietary_restrictions: data.dietary_restrictions || undefined,
        emergency_contact_name: data.emergency_contact_name || undefined,
        emergency_contact_phone: data.emergency_contact_phone || undefined,
        emergency_contact_relationship: data.emergency_contact_relationship || undefined,
        preferred_language: data.preferred_language || undefined,
        marketing_opt_in: data.marketing_opt_in || false,
        email_marketing: data.email_marketing || false,
        sms_marketing: data.sms_marketing || false,
        facebook_url: data.facebook_url || undefined,
        twitter_handle: data.twitter_handle || undefined,
        linkedin_url: data.linkedin_url || undefined,
        instagram_handle: data.instagram_handle || undefined,
        website: data.website || undefined,
        notes: data.notes || undefined,
        public_notes: data.public_notes || undefined,
        status: "active",
      };
    };
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit(payload);
      setPendingFormData(null);
      setShowConfirmDialog(false);
      // Let parent control closing; consumers can close via onOpenChange
    } catch (error) {
      console.error("Error creating customer:", error);
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
    setPendingFormData(null);
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
        ) as HTMLElement | null;
        firstInput?.focus();
      }, 0);
    }
  };

  const confirmAction = {
    label: isSubmitting ? "Creating..." : "Confirm & Create",
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

  return (
    <>
      <FullScreenDialog
        open={open}
        onClose={handleClose}
        title={title}
        maxWidth={maxWidth}
        loading={isSubmitting}
        formSelector={formRef}
        onClear={handleClear}
        onCancel={handleClose}
        showSubmitButton
        onSubmit={() => {
          formRef.current?.requestSubmit();
        }}
      >
        <div
          className={cn(
            "bg-background border border-border rounded-lg shadow-sm mt-12",
            density.paddingForm
          )}
        >
          <CustomerForm
            ref={formRef}
            key={formKey}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
            mode="create"
          />
        </div>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={(dialogOpen) => {
          setShowConfirmDialog(dialogOpen);
          if (!dialogOpen) {
            setPendingFormData(null);
            setTimeout(() => {
              const firstInput = formRef.current?.querySelector(
                "input, textarea, select"
              ) as HTMLElement | null;
              firstInput?.focus();
            }, 0);
          }
        }}
        title="Confirm Customer Creation"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to create this customer?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}
