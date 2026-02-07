/**
 * Edit Show Dialog Component
 *
 * Full-screen dialog for editing existing shows using shared form logic.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { ShowForm, type ShowFormData } from "./show-form";
import { ShowImageManager } from "./show-image-manager";
import { useShowService } from "./show-provider";
import { useOrganizerService } from "../organizers/organizer-provider";
import { useOrganizers } from "../organizers/use-organizers";

import type { Show, UpdateShowInput, ShowImage, ShowImageData } from "./types";

export interface EditShowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateShowInput) => Promise<void>;
  show: Show | null;
  title?: string;
  maxWidth?: string;
}

export function EditShowDialog({
  open,
  onOpenChange,
  onSubmit,
  show,
  title = "Edit Show",
  maxWidth = "720px",
}: EditShowDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ShowFormData | null>(null);
  const service = useShowService();
  const [images, setImages] = useState<ShowImage[]>([]);
  const organizerService = useOrganizerService();
  const { data: organizersData } = useOrganizers(organizerService, {
    pagination: { page: 1, pageSize: 100 },
  });
  const organizers = organizersData?.data?.map(org => ({ id: org.id, name: org.name })) || [];

  const defaultValues = useMemo(() => {
    if (!show) return undefined;
    return {
      name: show.name ?? "",
      organizer_id: show.organizer_id ?? undefined,
      started_date: show.started_date ?? undefined,
      ended_date: show.ended_date ?? undefined,
      note: show.note ?? undefined,
    };
  }, [show]);

  // Load images when dialog opens
  useEffect(() => {
    if (!open || !show) return;

    const loadImages = async () => {
      try {
        const loadedImages = await service.fetchShowImages(show.id);
        setImages(loadedImages);
      } catch (error) {
        console.error("Failed to load images:", error);
      }
    };

    loadImages();
  }, [open, show, service]);

  useEffect(() => {
    if (!open) return;

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
    return (data: ShowFormData, images: ShowImageData[]): UpdateShowInput => ({
      name: data.name,
      organizer_id: data.organizer_id || undefined,
      started_date: data.started_date || undefined,
      ended_date: data.ended_date || undefined,
      note: data.note || undefined,
      images: images.length > 0 ? images : [],
    });
  }, []);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData || !show) return;

    setIsSubmitting(true);
    try {
      // Convert current images to ShowImageData format
      const imageData: ShowImageData[] = images.map((img) => ({
        file_id: img.file_id,
        name: img.name,
        description: img.description,
        is_banner: img.is_banner,
      }));

      const payload = buildPayload(pendingFormData, imageData);
      await onSubmit(show.id, payload);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    } catch (error) {
      console.error("Error updating show:", error);
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

  if (!show) {
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
        <div className="space-y-6 mt-12">
          <div
            className={cn(
              "bg-background border border-border rounded-lg shadow-sm",
              density.paddingForm
            )}
          >
            <ShowForm
              ref={formRef}
              key={`${show.id}-${formKey}`}
              defaultValues={defaultValues}
              onSubmit={handleFormSubmit}
              isLoading={isSubmitting}
              mode="edit"
              organizers={organizers}
            />
          </div>
          
          {show && (
            <div
              className={cn(
                "bg-background border border-border rounded-lg shadow-sm",
                density.paddingForm
              )}
            >
              <ShowImageManager
                showId={show.id}
                images={images}
                onImagesChange={setImages}
              />
            </div>
          )}
        </div>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={handleConfirmDialogChange}
        title="Confirm Show Update"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to update this show?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}
