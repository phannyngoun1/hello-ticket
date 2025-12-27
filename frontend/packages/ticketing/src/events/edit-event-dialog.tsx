/**
 * Edit Event Dialog Component
 *
 * Full-screen dialog for editing events using the shared form component.
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
import type { UpdateEventInput, Event } from "./types";

export interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateEventInput) => Promise<void>;
  event: Event;
  title?: string;
  maxWidth?: string;
}

export function EditEventDialog({
  open,
  onOpenChange,
  onSubmit,
  event,
  title = "Edit Event",
  maxWidth = "720px",
}: EditEventDialogProps) {
  const density = useDensityStyles();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EventFormData | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(event.venue_id);
  
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

  // Update selected venue when event changes
  useEffect(() => {
    setSelectedVenueId(event.venue_id);
  }, [event.venue_id]);

  const handleFormSubmit = async (data: EventFormData) => {
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  // Build payload - only include changed fields
  const buildPayload = useMemo(() => {
    return (data: EventFormData): UpdateEventInput => {
      const payload: UpdateEventInput = {};
      
      if (data.title !== event.title) payload.title = data.title;
      
      // Compare datetime values - convert form value to ISO for comparison
      const formStartDtIso = new Date(data.start_dt).toISOString();
      const eventStartDtIso = new Date(event.start_dt).toISOString();
      if (formStartDtIso !== eventStartDtIso) {
        // Convert datetime-local string to ISO string with timezone
        payload.start_dt = new Date(data.start_dt).toISOString();
      }
      
      if (data.duration_minutes !== event.duration_minutes) {
        payload.duration_minutes = data.duration_minutes;
      }
      if (data.venue_id !== event.venue_id) payload.venue_id = data.venue_id;
      if (data.layout_id !== (event.layout_id || "")) {
        payload.layout_id = data.layout_id || undefined;
      }
      if (data.status !== event.status) payload.status = data.status;
      
      return payload;
    };
  }, [event]);

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload(pendingFormData);
      await onSubmit(event.id, payload);
      setPendingFormData(null);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error updating event:", error);
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

  const defaultFormValues: Partial<EventFormData> = {
    title: event.title,
    start_dt: new Date(event.start_dt).toISOString().slice(0, 16),
    duration_minutes: event.duration_minutes,
    venue_id: event.venue_id,
    layout_id: event.layout_id || undefined,
    status: event.status,
  };

  const confirmAction = {
    label: isSubmitting ? "Saving..." : "Confirm & Save",
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
              defaultValues={defaultFormValues}
              onSubmit={handleFormSubmit}
              isLoading={isSubmitting}
              mode="edit"
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
        title="Confirm Event Update"
        description={
          pendingFormData ? (
            <p className={cn("mb-3", density.textSizeSmall)}>
              Are you sure you want to update this event?
            </p>
          ) : undefined
        }
        confirmAction={confirmAction}
        cancelAction={cancelAction}
      />
    </>
  );
}

