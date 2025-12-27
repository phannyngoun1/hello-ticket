/**
 * Create Show Dialog Component
 *
 * Full-screen dialog for creating new shows using the shared form component.
 */

import { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { ShowForm, type ShowFormData } from "./show-form";
import {
  PendingImageManager,
  type PendingImage,
} from "./pending-image-manager";
import { useShowService } from "./show-provider";
import { useOrganizerService } from "../organizers/organizer-provider";
import { useOrganizers } from "../organizers/use-organizers";
import { uploadService } from "@truths/shared";

import type { CreateShowInput, ShowImageData } from "./types";

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
  const [pendingFormData, setPendingFormData] = useState<ShowFormData | null>(
    null
  );
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<
    Map<string, { file_id: string; url: string }>
  >(new Map());
  const showService = useShowService();
  const organizerService = useOrganizerService();
  const { data: organizersData } = useOrganizers(organizerService, {
    pagination: { page: 1, pageSize: 100 },
  });
  const organizers =
    organizersData?.data?.map((org) => ({ id: org.id, name: org.name })) || [];

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
    return (data: ShowFormData, images: ShowImageData[]): CreateShowInput => ({
      code: undefined,
      name: data.name,
      organizer_id: data.organizer_id || undefined,
      started_date: data.started_date || undefined,
      ended_date: data.ended_date || undefined,
      note: data.note || undefined,
      images: images.length > 0 ? images : undefined,
    });
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    setIsSubmitting(true);
    try {
      // Upload all pending images first and collect image data
      const imageData: ShowImageData[] = [];

      for (const pendingImage of pendingImages) {
        try {
          // Check if already uploaded
          const existingUpload = uploadedFileIds.get(pendingImage.id);
          if (existingUpload) {
            imageData.push({
              file_id: existingUpload.file_id,
              name: pendingImage.name,
              description: pendingImage.description || undefined,
              is_banner: pendingImage.is_banner,
            });
          } else {
            // Upload file
            const uploadResponse = await uploadService.uploadImage(
              pendingImage.file
            );

            // Store uploaded file info
            setUploadedFileIds((prev) => {
              const next = new Map(prev);
              next.set(pendingImage.id, {
                file_id: uploadResponse.id,
                url: uploadResponse.url,
              });
              return next;
            });

            imageData.push({
              file_id: uploadResponse.id,
              name: pendingImage.name,
              description: pendingImage.description || undefined,
              is_banner: pendingImage.is_banner,
            });
          }
        } catch (error) {
          console.error(`Failed to upload image ${pendingImage.name}:`, error);
        }
      }

      const payload = buildPayload(pendingFormData, imageData);
      await showService.createShow(payload);

      // Clean up preview URLs
      pendingImages.forEach((img) => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });

      await onSubmit(payload);
      setPendingFormData(null);
      setPendingImages([]);
      setUploadedFileIds(new Map());
      setShowConfirmDialog(false);
      // Let parent control closing; consumers can close via onOpenChange
    } catch (error) {
      console.error("Error creating show:", error);
      setShowConfirmDialog(false);
    } finally {
      setIsSubmitting(false);
    }
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

  const handleClose = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
    // Clean up preview URLs
    pendingImages.forEach((img) => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setPendingImages([]);
    setUploadedFileIds(new Map());
    onOpenChange(false);
  };

  const handleClear = () => {
    setPendingFormData(null);
    setFormKey((prev) => prev + 1);
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
        autoSubmitShortcut
        showClearButton
        onClear={handleClear}
        showCancelButton
        onCancel={handleClose}
        showSubmitButton
        onSubmit={handleDialogSubmit}
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

          <div
            className={cn(
              "bg-background border border-border rounded-lg shadow-sm",
              density.paddingForm
            )}
          >
            <PendingImageManager
              images={pendingImages}
              onImagesChange={setPendingImages}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={handleConfirmDialogChange}
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
