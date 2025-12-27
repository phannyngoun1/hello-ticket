/**
 * Create Event Dialog Component
 *
 * Full-screen dialog for creating new events using the shared form component.
 */

import { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";
import { FullScreenDialog, ConfirmationDialog } from "@truths/custom-ui";
import { EventForm, type EventFormData } from "./event-form";
import { useVenueService } from "../venues/venue-provider";
import { useVenues } from "../venues/use-venues";
import { useLayoutService } from "../layouts/layout-provider";
import { useLayoutsByVenue } from "../layouts/use-layouts";
import type { CreateEventInput } from "./types";

export interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateEventInput) => Promise<void>;
  showId: string;
  title?: string;
  maxWidth?: string;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onSubmit,
  showId,
  title = "Create Event",
  maxWidth = "720px",
}: CreateEventDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EventFormData | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  
  const venueService = useVenueService();
  const layoutService = useLayoutService();
  
  const { data: venuesData } = useVenues(venueService, {
    pagination: { page: 1, pageSize: 100 },
  });
  const venues = venuesData?.data?.map((venue) => ({ id: venue.id, name: venue.name })) || [];

  // Fetch layouts for the selected venue
  const { data: layoutsData } = useLayoutsByVenue(
    layoutService,
    selectedVenueId || null
  );
  const layouts = layoutsData?.map((layout) => ({
    id: layout.id,
    name: layout.name,
    venue_id: layout.venue_id,
  })) || [];


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

  const handleFormSubmit = async (data: EventFormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  // Build payload
  const buildPayload = useMemo(() => {
    return (data: EventFormData): CreateEventInput => {
      // Convert datetime-local string (YYYY-MM-DDTHH:mm) to ISO string with timezone
      // The datetime-local value is in the user's local timezone, so we create a Date
      // object and convert it to ISO string which includes timezone info
      const startDate = new Date(data.start_dt);
      const startDtIso = startDate.toISOString();
      
      return {
        show_id: showId,
        title: data.title,
        start_dt: startDtIso,
        duration_minutes: data.duration_minutes,
        venue_id: data.venue_id,
        layout_id: data.layout_id || undefined,
        status: data.status,
        configuration_type: data.configuration_type,
      };
    };
  }, [showId]);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit(payload);
      setPendingFormData(null);
      setSelectedVenueId(null);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error creating event:", error);
      setShowConfirmDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowConfirmDialog(false);
    setPendingFormData(null);
    setSelectedVenueId(null);
    onOpenChange(false);
  };

  const handleClear = () => {
    setPendingFormData(null);
    setSelectedVenueId(null);
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
            <EventForm
              ref={formRef}
              key={formKey}
              onSubmit={handleFormSubmit}
              isLoading={isSubmitting}
              mode="create"
              venues={venues}
              layouts={layouts}
              onVenueChange={setSelectedVenueId}
            />
          </div>
        </div>
      </FullScreenDialog>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={handleConfirmDialogChange}
        title="Confirm Event Creation"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to create this event?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}

