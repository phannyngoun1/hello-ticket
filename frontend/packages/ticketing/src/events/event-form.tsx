/**
 * Event Form Component
 *
 * Shared form used for creating and editing events with Zod validation.
 */

import { forwardRef, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  TextInputField,
  NumberInputField,
  DateTimeInputField,
  SelectInputField,
} from "@truths/custom-ui";
import { cn } from "@truths/ui/lib/utils";
import { EventStatus, EventConfigurationType } from "./types";

// Form schema excludes timestamp fields (created_at, updated_at) as they are backend-managed
const eventFormSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title cannot exceed 200 characters"),
    start_dt: z.string().min(1, "Start datetime is required"),
    duration_minutes: z.number().min(1, "Duration must be at least 1 minute").max(1440, "Duration cannot exceed 1440 minutes (24 hours)"),
    venue_id: z.string().min(1, "Venue is required"),
    layout_id: z.string().optional(),
    status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
    configuration_type: z.nativeEnum(EventConfigurationType).default(EventConfigurationType.SEAT_SETUP),
  });

export type EventFormData = {
  title: string;
  start_dt: string;
  duration_minutes: number;
  venue_id: string;
  layout_id?: string;
  status: EventStatus;
  configuration_type: EventConfigurationType;
};

export interface EventFormProps {
  defaultValues?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
  venues?: { id: string; name: string }[];
  layouts?: { id: string; name: string; venue_id: string }[];
  onVenueChange?: (venueId: string | null) => void;
}

export const EventForm = forwardRef<HTMLFormElement, EventFormProps>(
  (
    {
      defaultValues,
      onSubmit,
      isLoading = false,
      mode = "create",
      venues = [],
      layouts = [],
      onVenueChange,
    },
    ref
  ) => {
    // Use variables to satisfy lints
    void mode;
    void venues;

    const methods = useForm<EventFormData>({
      resolver: zodResolver(eventFormSchema) as any,
      defaultValues: {
        title: "",
        start_dt: "",
        duration_minutes: 120,
        venue_id: "",
        layout_id: undefined,
        status: EventStatus.DRAFT,
        configuration_type: EventConfigurationType.SEAT_SETUP,
        ...defaultValues,
      },
    });

    const {
      watch,
      handleSubmit,
      formState: { errors, isSubmitted },
    } = methods;

    const selectedVenueId = watch("venue_id");
    const availableLayouts = layouts.filter(
      (layout) => !selectedVenueId || layout.venue_id === selectedVenueId
    );

    // Notify parent when venue changes
    useEffect(() => {
      if (onVenueChange) {
        onVenueChange(selectedVenueId || null);
      }
    }, [selectedVenueId, onVenueChange]);

    const firstErrorRef = useRef<HTMLDivElement | null>(null);

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

    const handleFormSubmit = async (data: EventFormData) => {
      await onSubmit(data);
    };

    const statusOptions = Object.values(EventStatus).map((status) => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "),
    }));

    const configTypeOptions = [
      {
        value: EventConfigurationType.SEAT_SETUP,
        label: "Seat Setup (Standard)",
        description: "Define seat layout first, tickets created during booking.",
      },
      {
        value: EventConfigurationType.TICKET_IMPORT,
        label: "Ticket First (Broker Import)",
        description: "Add tickets with seat information first (import/scan).",
      },
    ];

    return (
      <FormProvider {...methods}>
        <form
          ref={ref}
          onSubmit={handleSubmit(handleFormSubmit)}
          className={cn("space-y-6")}
          noValidate
        >
        <div ref={firstErrorRef} />

        <TextInputField
          name="title"
          label="Title"
          placeholder="Enter event title"
          required
          disabled={isLoading}
        />

        <DateTimeInputField
          name="start_dt"
          label="Start Date & Time"
          required
          disabled={isLoading}
          helperText="When the event begins"
        />

        <NumberInputField
          name="duration_minutes"
          label="Duration (minutes)"
          placeholder="120"
          required
          min={1}
          max={1440}
          disabled={isLoading}
          helperText="Duration of the event in minutes (1-1440)"
        />

        <SelectInputField
          name="venue_id"
          label="Venue"
          placeholder="Select a venue"
          required
          disabled={isLoading}
          options={venues.map((venue) => ({
            value: venue.id,
            label: venue.name,
          }))}
        />

        {selectedVenueId && availableLayouts.length > 0 && (
          <SelectInputField
            name="layout_id"
            label="Layout (Optional)"
            placeholder="Select a layout"
            disabled={isLoading}
            options={availableLayouts.map((layout) => ({
              value: layout.id,
              label: layout.name,
            }))}
            helperText="Select a layout for this event's seating arrangement"
          />
        )}

        <SelectInputField
          name="configuration_type"
          label="Configuration Type"
          required
          disabled={isLoading}
          options={configTypeOptions}
          helperText="Choose how tickets and seats are managed"
        />

        <SelectInputField
          name="status"
          label="Status"
          required
          disabled={isLoading}
          options={statusOptions}
        />
        </form>
      </FormProvider>
    );
  }
);

