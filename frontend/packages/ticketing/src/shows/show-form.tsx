/**
 * Show Form Component
 *
 * Shared form used for creating and editing shows with Zod validation.
 */

import { forwardRef, useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@truths/ui/lib/utils";
import {
  AIAssistFormButton,
  DateInputField,
  SelectInputField,
  TextareaInputField,
  TextInputField,
} from "@truths/custom-ui";

// Form schema excludes timestamp fields (created_at, updated_at) as they are backend-managed
const showFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    organizer_id: z.string().min(1, "Organizer is required"),
    started_date: z.string().optional(),
    ended_date: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.started_date && data.ended_date) {
        return new Date(data.started_date) <= new Date(data.ended_date);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["ended_date"],
    },
  )
  .transform((values) => values);

export type ShowFormData = z.infer<typeof showFormSchema>;

export interface ShowFormProps {
  defaultValues?: Partial<ShowFormData>;
  onSubmit: (data: ShowFormData) => Promise<void> | void;
  isLoading?: boolean;
  mode?: "create" | "edit";
  organizers?: Array<{ id: string; name: string }>;
}

export const ShowForm = forwardRef<HTMLFormElement, ShowFormProps>(
  function ShowForm(
    {
      defaultValues,
      onSubmit,
      isLoading = false,
      mode = "create",
      organizers = [],
    },
    ref,
  ) {
    const methods = useForm<ShowFormData>({
      resolver: zodResolver(showFormSchema),
      defaultValues: {
        name: "",
        organizer_id: "",
        started_date: undefined,
        ended_date: undefined,
        note: undefined,
        ...defaultValues,
      },
    });
    const {
      handleSubmit,
      watch,
      setValue,
      formState: { errors, isSubmitted },
    } = methods;

    const firstErrorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (isSubmitted && Object.keys(errors).length > 0) {
        const firstErrorField = Object.keys(errors)[0];
        const errorElement = document.querySelector(
          `[name="${firstErrorField}"], #${firstErrorField}`,
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

    const handleFormSubmit = async (data: ShowFormData) => {
      await onSubmit(data);
    };

    const showCurrentValues: Record<string, string> = {
      name: watch("name") ?? "",
      organizer_id: watch("organizer_id") ?? "",
      started_date: watch("started_date") ?? "",
      ended_date: watch("ended_date") ?? "",
      note: watch("note") ?? "",
    };

    const organizerOptions = organizers.map((org) => ({
      value: org.id,
      label: org.name,
    }));

    return (
      <FormProvider {...methods}>
        <form
          ref={ref}
          id="show-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          <div className="flex justify-end">
            <AIAssistFormButton
              formType="show"
              currentValues={showCurrentValues}
              onSuggest={(values) => {
                Object.entries(values).forEach(([key, value]) => {
                  if (value !== undefined && value !== null && value !== "") {
                    if (key === "organizer_id") {
                      const byId = organizers.find((o) => o.id === value);
                      const byName = organizers.find((o) => o.name === value);
                      setValue(
                        "organizer_id",
                        byId ? byId.id : byName ? byName.id : value,
                      );
                    } else {
                      setValue(key as keyof ShowFormData, value);
                    }
                  }
                });
              }}
              disabled={isLoading}
            />
          </div>
          <div
            className={cn("grid grid-cols-1 md:grid-cols-2 gap-4")}
            ref={firstErrorRef}
          >
            <TextInputField
              name="name"
              label="Name"
              placeholder="Enter Name"
              required
              disabled={isLoading}
            />

            <SelectInputField
              name="organizer_id"
              label="Organizer"
              placeholder="Select an organizer"
              options={organizerOptions}
              required
              disabled={isLoading}
            />

            <DateInputField
              name="started_date"
              label="Start Date"
              disabled={isLoading}
            />

            <DateInputField
              name="ended_date"
              label="End Date"
              disabled={isLoading}
            />
          </div>

          <TextareaInputField
            name="note"
            label="Note"
            placeholder="Enter notes about the show"
            rows={4}
            disabled={isLoading}
            showImproveButton
          />
        </form>
      </FormProvider>
    );
  },
);
