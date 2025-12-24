/**
 * Create Show Dialog Component
 *
 * Full-screen dialog for creating new shows using the shared form component.
 */

import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { ShowForm, type ShowFormData } from "./show-form";
import { ShowImageManager } from "./show-image-manager";
import { useShowService } from "./show-provider";
import { useOrganizerService } from "../organizers/organizer-provider";
import { useOrganizers } from "../organizers/use-organizers";

import type { CreateShowInput, ShowImage } from "./types";

export interface CreateShowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateShowInput) => Promise<void>;
  title?: string;
  maxWidth?: string;
}

export function CreateShowDialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Create Show",
  maxWidth = "720px",
}: CreateShowDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ShowFormData | null>(null);
  const [createdShowId, setCreatedShowId] = useState<string | null>(null);
  const [images, setImages] = useState<ShowImage[]>([]);
  const showService = useShowService();
  const organizerService = useOrganizerService();
  const { data: organizersData } = useOrganizers(organizerService, {
    pagination: { page: 1, pageSize: 100 },
  });
  const organizers = organizersData?.data?.map(org => ({ id: org.id, name: org.name })) || [];

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

  const handleFormSubmit = async (data: ShowFormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  // Build payload excludes timestamp fields (created_at, updated_at) - backend manages these
  const buildPayload = useMemo(() => {
    return (data: ShowFormData): CreateShowInput => ({
      code: undefined,
      name: data.name,
      organizer_id: data.organizer_id || undefined,
      started_date: data.started_date || undefined,
      ended_date: data.ended_date || undefined,
      note: data.note || undefined,
    });
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      const createdShow = await showService.createShow(payload);
      setCreatedShowId(createdShow.id);
      await onSubmit(payload);
      setPendingFormData(null);
      setShowConfirmDialog(false);
      // Let parent control closing; consumers can close via onOpenChange
    } catch (error) {
      console.error("Error creating show:", error);
      setShowConfirmDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
    setCreatedShowId(null);
    setImages([]);
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
        <div className="space-y-6 mt-12">
          <div
            className={cn(
              "bg-background border border-border rounded-lg shadow-sm",
              density.paddingForm
            )}
          >
            <ShowForm
              ref={formRef}
              key={formKey}
              onSubmit={handleFormSubmit}
              isLoading={isSubmitting}
              mode="create"
              organizers={organizers}
            />
          </div>
          
          {createdShowId && (
            <div
              className={cn(
                "bg-background border border-border rounded-lg shadow-sm",
                density.paddingForm
              )}
            >
              <ShowImageManager
                showId={createdShowId}
                images={images}
                onImagesChange={setImages}
              />
            </div>
          )}
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
        title="Confirm Show Creation"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to create this show?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}

